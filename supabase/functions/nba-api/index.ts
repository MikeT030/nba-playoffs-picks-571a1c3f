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
    const apiKey = Deno.env.get("BALLDONTLIE_API_KEY");
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

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: apiKey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("BallDontLie API error:", data);
      return new Response(
        JSON.stringify({ error: `API error: ${response.status}`, details: data }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
