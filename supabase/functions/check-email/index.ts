import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string" || email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Use the admin API to look up user by email directly
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    // Since listUsers doesn't support email filter directly,
    // query the auth schema via the service role
    const { data, error } = await supabaseAdmin.rpc("", {}).maybeSingle();

    // Best approach: use raw fetch against the GoTrue admin endpoint
    const res = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        },
      }
    );

    if (!res.ok) {
      // Fallback: list all and filter (works for small user bases)
      const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
      const exists = allUsers?.users?.some(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      ) ?? false;
      return new Response(
        JSON.stringify({ exists }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await res.json();
    const exists = result.users?.some(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    ) ?? false;

    return new Response(
      JSON.stringify({ exists }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
