const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_BASE = "https://api.balldontlie.io/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("BALLDONTLIE_API_KEY") || "fd9b85d5-7ace-4509-a1b4-2a5a0a926c2c";
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "BALLDONTLIE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint") || "games";
    
    // Build query params for the upstream API
    const params = new URLSearchParams();
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== "endpoint") {
        params.append(key, value);
      }
    }

    const apiUrl = `${API_BASE}/${endpoint}?${params.toString()}`;
    console.log("Fetching:", apiUrl);

    // Abort upstream fetch if it hangs — prevents the edge runtime from
    // exhausting CPU/wall time and returning a 503 SUPABASE_EDGE_RUNTIME_ERROR.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let response: Response;
    try {
      response = await fetch(apiUrl, {
        headers: {
          "Authorization": apiKey,
          "x-access-token": apiKey,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      console.error("Upstream fetch failed/timeout:", fetchErr);
      return new Response(
        JSON.stringify({ error: "API_TIMEOUT", fallback: true, data: [], meta: { per_page: 100 } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    clearTimeout(timeoutId);

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Non-JSON response:", response.status, text.slice(0, 200));
      const isFallbackable =
        response.status === 401 ||
        response.status === 403 ||
        response.status === 429 ||
        response.status >= 500;
      if (isFallbackable) {
        return new Response(
          JSON.stringify({
            error:
              response.status === 401 || response.status === 403
                ? "API_UNAUTHORIZED"
                : "API_RATE_LIMITED",
            fallback: true,
            data: [],
            meta: { per_page: 100 },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: `API returned non-JSON: ${text.substring(0, 200)}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!response.ok) {
      console.error("BallDontLie API error:", response.status, data);
      const isFallbackable =
        response.status === 401 ||
        response.status === 403 ||
        response.status === 429 ||
        response.status >= 500;
      return new Response(
        JSON.stringify({
          error: isFallbackable
            ? response.status === 401 || response.status === 403
              ? "API_UNAUTHORIZED"
              : "API_RATE_LIMITED"
            : `API error: ${response.status}`,
          fallback: isFallbackable,
          data: [],
          meta: { per_page: 100 },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
