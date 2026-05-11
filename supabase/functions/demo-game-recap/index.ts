const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface QuarterScore {
  q: number;
  away: number;
  home: number;
}

interface FactSheet {
  awayAbbr: string;
  awayName: string;
  homeAbbr: string;
  homeName: string;
  awayScore: number;
  homeScore: number;
  date: string; // human-readable
  round?: string;
  gameNumber?: number;
  ot?: number; // number of OTs (0 = none)
  quarters?: QuarterScore[];
  highlights?: string[];
}

const SYSTEM_PROMPT = `You are a sarcastic, witty sports writer who happens to be named Wade. You write snarky, relatable NBA playoff game recaps — the kind of take an ordinary fan would have at the bar, not a superhero caricature.

Style rules:
- Snarky and irreverent, but grounded. Talk to the reader like a clever friend.
- Lovingly mock the losing team; nod to the winners.
- ONE paragraph. Plain text only. No markdown, no emojis, no hashtags.
- HARD CAP: 400 characters total. Aim for 320-390.
- No profanity. No future-game spoilers. No made-up stats.
- Do NOT mention costumes, masks, swords, superpowers, healing factors, or any movie scenes. You are a funny person, not a comic-book character.
- Refer to teams by their nickname or abbreviation, never invent player names.
- If "Crucial moments" are provided, slip ONE or TWO into the recap as flavor — do not enumerate them, do not name-drop all of them, and do not invent any other player names or stats not on that list.
- End with a punchy one-liner.`;

function buildUserPrompt(f: FactSheet): string {
  const lines: string[] = [];
  lines.push(`Final score: ${f.awayAbbr} ${f.awayScore} @ ${f.homeAbbr} ${f.homeScore}`);
  const winnerAbbr = f.awayScore > f.homeScore ? f.awayAbbr : f.homeAbbr;
  const loserAbbr = f.awayScore > f.homeScore ? f.homeAbbr : f.awayAbbr;
  const margin = Math.abs(f.awayScore - f.homeScore);
  lines.push(`Winner: ${winnerAbbr} (${f.awayAbbr === winnerAbbr ? f.awayName : f.homeName})`);
  lines.push(`Loser: ${loserAbbr} (${f.awayAbbr === loserAbbr ? f.awayName : f.homeName})`);
  lines.push(`Margin: ${margin}`);
  if (f.ot && f.ot > 0) lines.push(`Overtime: ${f.ot}`);
  if (f.round) lines.push(`Round: ${f.round}`);
  if (typeof f.gameNumber === "number") lines.push(`Game ${f.gameNumber}`);
  if (f.date) lines.push(`Date: ${f.date}`);
  if (f.quarters && f.quarters.length) {
    lines.push(
      "Quarter scores: " +
        f.quarters
          .map((q) => `Q${q.q} ${f.awayAbbr} ${q.away}-${q.home} ${f.homeAbbr}`)
          .join(", "),
    );
  }
  lines.push("");
  lines.push("Write the recap now. Remember: max 400 characters, one paragraph.");
  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { factsheet, model } = await req.json();

    if (!factsheet || typeof factsheet !== "object") {
      return new Response(
        JSON.stringify({ error: "Missing factsheet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const chosenModel =
      typeof model === "string" && model.length > 0
        ? model
        : "google/gemini-3-flash-preview";

    const userPrompt = buildUserPrompt(factsheet as FactSheet);

    let aiResp: Response | null = null;
    let lastErrText = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: chosenModel,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      // Don't retry rate limit / payment / client errors
      if (aiResp.status === 429 || aiResp.status === 402 || aiResp.status < 500) break;

      lastErrText = await aiResp.text().catch(() => "");
      console.error(`AI gateway ${aiResp.status} (attempt ${attempt + 1})`, lastErrText.slice(0, 200));
      // Backoff before next try
      if (attempt < 2) await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }

    if (!aiResp) {
      return new Response(
        JSON.stringify({ error: "AI gateway unreachable" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (aiResp.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiResp.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiResp.ok) {
      return new Response(
        JSON.stringify({
          error: `Wade's stuck in traffic (AI gateway ${aiResp.status}). Try Regenerate in a few seconds.`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await aiResp.json();
    let summary: string =
      data?.choices?.[0]?.message?.content?.toString().trim() ?? "";

    // Hard cap to ~400 chars: try to cut at a sentence boundary.
    if (summary.length > 400) {
      const slice = summary.slice(0, 400);
      const lastStop = Math.max(
        slice.lastIndexOf("."),
        slice.lastIndexOf("!"),
        slice.lastIndexOf("?"),
      );
      summary = lastStop > 200 ? slice.slice(0, lastStop + 1) : slice.trimEnd() + "…";
    }

    return new Response(
      JSON.stringify({ summary, model: chosenModel, factsheet, prompt: userPrompt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("demo-game-recap error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
