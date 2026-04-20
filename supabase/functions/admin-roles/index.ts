import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client scoped to caller's JWT for identity check
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    // Verify caller is admin via security definer function
    const { data: isAdmin, error: roleErr } = await supabaseUser.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (roleErr || !isAdmin) return json({ error: "Forbidden" }, 403);

    // Service-role client for privileged ops
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string | undefined;

    if (action === "list") {
      const { data: roles, error } = await supabaseAdmin
        .from("user_roles")
        .select("id, user_id, created_at")
        .eq("role", "admin");
      if (error) return json({ error: error.message }, 500);

      const { data: usersList, error: listErr } =
        await supabaseAdmin.auth.admin.listUsers();
      if (listErr) return json({ error: listErr.message }, 500);

      const emailById = new Map(
        usersList.users.map((u) => [u.id, u.email ?? ""])
      );

      const admins = (roles ?? []).map((r) => ({
        id: r.id,
        user_id: r.user_id,
        email: emailById.get(r.user_id) ?? "(unknown)",
        created_at: r.created_at,
      }));

      return json({ admins });
    }

    if (action === "remove") {
      const targetUserId = body?.user_id as string | undefined;
      if (!targetUserId) return json({ error: "user_id required" }, 400);
      if (targetUserId === user.id)
        return json({ error: "You cannot remove your own admin role" }, 400);

      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", targetUserId)
        .eq("role", "admin");
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message ?? "Internal error" }, 500);
  }
});
