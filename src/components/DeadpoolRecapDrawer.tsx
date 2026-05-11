import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Copy, RefreshCw, ChevronDown, ChevronRight, Plus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getPlayoffGames, getGameStats, type NbaGame, type NbaPlayerStat } from "@/lib/nbaApi";
import { DEFAULT_MATCH_DATA } from "@/components/DemoMatchCardColored";
import { recapKey, setDemoRecap, saveDemoRecapRemote } from "@/lib/demoRecapStore";
import { useBracketData } from "@/hooks/useBracketData";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface FactSheet {
  awayAbbr: string;
  awayName: string;
  homeAbbr: string;
  homeName: string;
  awayScore: number;
  homeScore: number;
  date: string;
  round?: string;
  gameNumber?: number;
  ot?: number;
  quarters?: { q: number; away: number; home: number }[];
  highlights?: string[];
}

const SAMPLE_HIGHLIGHTS = [
  "Edwards 31pts/8reb/6ast",
  "Castle 6/9 from deep",
];

function deriveQuarterSwing(fs: FactSheet): string | null {
  if (!fs.quarters || fs.quarters.length === 0) return null;
  let best: { q: number; abbr: string; net: number; a: number; h: number } | null = null;
  for (const q of fs.quarters) {
    const net = Math.abs(q.away - q.home);
    if (!best || net > best.net) {
      best = {
        q: q.q,
        abbr: q.away > q.home ? fs.awayAbbr : fs.homeAbbr,
        net,
        a: q.away,
        h: q.home,
      };
    }
  }
  if (!best || best.net < 6) return null;
  const ord = ["", "first", "second", "third", "fourth"][best.q] ?? `Q${best.q}`;
  return `${best.abbr} ran a ${Math.max(best.a, best.h)}-${Math.min(best.a, best.h)} ${ord}`;
}

function deriveHighlightsFromStats(
  stats: NbaPlayerStat[],
  fs: FactSheet,
): string[] {
  const out: string[] = [];
  if (!stats.length) return out;
  const sorted = [...stats].sort((a, b) => (b.pts ?? 0) - (a.pts ?? 0));
  const top = sorted[0];
  if (top && top.pts >= 10) {
    out.push(
      `${top.player.last_name} ${top.pts}pts/${top.reb ?? 0}reb/${top.ast ?? 0}ast`,
    );
  }
  const hotShooter = stats.find(
    (s) => (s.fg3m ?? 0) >= 6 && s.player.id !== top?.player.id,
  );
  if (hotShooter) {
    out.push(
      `${hotShooter.player.last_name} ${hotShooter.fg3m}/${hotShooter.fg3a ?? "?"} from deep`,
    );
  } else {
    const loserAbbr = fs.awayScore > fs.homeScore ? fs.homeAbbr : fs.awayAbbr;
    const topLoser = sorted.find(
      (s) => s.team.abbreviation === loserAbbr && s.player.id !== top?.player.id,
    );
    if (topLoser && topLoser.pts >= 15) {
      out.push(
        `${topLoser.player.last_name} ${topLoser.pts}/${topLoser.reb ?? 0}/${topLoser.ast ?? 0} in the loss`,
      );
    }
  }
  const swing = deriveQuarterSwing(fs);
  if (swing) out.push(swing);
  return Array.from(new Set(out.filter(Boolean))).slice(0, 3);
}

const MODELS = [
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (preview)" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "openai/gpt-5-mini", label: "GPT-5 mini" },
];

const SAMPLE_FACTSHEET: FactSheet = {
  awayAbbr: DEFAULT_MATCH_DATA.away.abbreviation,
  awayName: DEFAULT_MATCH_DATA.away.name,
  homeAbbr: DEFAULT_MATCH_DATA.home.abbreviation,
  homeName: DEFAULT_MATCH_DATA.home.name,
  awayScore: DEFAULT_MATCH_DATA.awayScore,
  homeScore: DEFAULT_MATCH_DATA.homeScore,
  date: DEFAULT_MATCH_DATA.date,
  round: DEFAULT_MATCH_DATA.round,
  gameNumber: DEFAULT_MATCH_DATA.gameNumber,
  ot: 0,
  quarters: [
    { q: 1, away: 28, home: 24 },
    { q: 2, away: 22, home: 30 },
    { q: 3, away: 31, home: 27 },
    { q: 4, away: 27, home: 31 },
  ],
};

function gameToFactsheet(g: NbaGame): FactSheet {
  return {
    awayAbbr: g.visitor_team.abbreviation,
    awayName: g.visitor_team.name,
    homeAbbr: g.home_team.abbreviation,
    homeName: g.home_team.name,
    awayScore: g.visitor_team_score,
    homeScore: g.home_team_score,
    date: new Date(g.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
  };
}

const GAMES_FROM_DATE = "2026-05-10"; // inclusive, YYYY-MM-DD

async function fetchFinishedGames(): Promise<NbaGame[]> {
  const seasons = [2025, 2024];
  const all: NbaGame[] = [];
  for (const season of seasons) {
    try {
      const games = await getPlayoffGames(season);
      all.push(...games);
    } catch {
      /* skip */
    }
  }
  return all
    .filter((g) => g.status === "Final")
    .filter((g) => (g.date ?? "").slice(0, 10) >= GAMES_FROM_DATE)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeadpoolRecapDrawer({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const { data: bracketData } = useBracketData();
  const { isAdmin } = useIsAdmin();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "remote" | "local">("idle");
  // source = "sample" or a stringified game id
  const [source, setSource] = useState<string>("sample");
  const [model, setModel] = useState(MODELS[0].value);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [factsheet, setFactsheet] = useState<FactSheet | null>(null);
  const [showInputs, setShowInputs] = useState(false);
  const [finishedGames, setFinishedGames] = useState<NbaGame[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);

  useEffect(() => {
    if (!open || finishedGames.length > 0 || gamesLoading) return;
    setGamesLoading(true);
    fetchFinishedGames()
      .then(setFinishedGames)
      .catch(() => {
        /* silent — list just stays empty */
      })
      .finally(() => setGamesLoading(false));
  }, [open, finishedGames.length, gamesLoading]);

  const generate = async (overrideSource?: string) => {
    const src = overrideSource ?? source;
    setLoading(true);
    setSummary("");
    try {
      let fs: FactSheet;
      if (src === "sample") {
        fs = { ...SAMPLE_FACTSHEET };
        const swing = deriveQuarterSwing(fs);
        fs.highlights = [...SAMPLE_HIGHLIGHTS, ...(swing ? [swing] : [])].slice(0, 3);
      } else {
        const game = finishedGames.find((g) => String(g.id) === src);
        if (!game) throw new Error("Game not found");
        fs = gameToFactsheet(game);
        try {
          const stats = await getGameStats(game.id);
          const highlights = deriveHighlightsFromStats(stats, fs);
          if (highlights.length) fs.highlights = highlights;
        } catch {
          /* stats optional — fall back to plain recap */
        }
      }
      setFactsheet(fs);

      const { data, error } = await supabase.functions.invoke("demo-game-recap", {
        body: { factsheet: fs, model },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSummary(data?.summary ?? "");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate recap";
      toast({ title: "Wade's busy", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSourceChange = (v: string) => {
    setSource(v);
    generate(v);
  };

  const copy = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      toast({ title: "Copied", description: "Recap copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const [added, setAdded] = useState(false);
  const resolveSeriesId = (away: string, home: string): string => {
    if (!bracketData) return "sample-demo";
    const pair = [away, home].sort().join("|");
    const found = bracketData.find(
      (s) =>
        s.topTeam &&
        s.bottomTeam &&
        [s.topTeam.abbreviation, s.bottomTeam.abbreviation].sort().join("|") === pair,
    );
    return found?.id ?? `${pair}`;
  };

  const addToGame = async () => {
    if (!summary || !factsheet) return;
    const seriesId =
      source === "sample"
        ? "sample-demo"
        : resolveSeriesId(factsheet.awayAbbr, factsheet.homeAbbr);
    const gameNumber = factsheet.gameNumber ?? 0;
    const key = recapKey(seriesId, gameNumber);
    setDemoRecap(key, summary);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);

    if (!isAdmin) {
      setSaveStatus("local");
      toast({
        title: "Saved locally",
        description: "Only admins can publish recaps to all visitors.",
      });
      return;
    }

    setSaveStatus("saving");
    const result = await saveDemoRecapRemote(key, {
      seriesId,
      gameNumber,
      source: "demo",
      summary,
    });
    if (result.ok) {
      setSaveStatus("remote");
      toast({
        title: "Published",
        description: "Wade's take is now visible to everyone.",
      });
    } else {
      setSaveStatus("local");
      toast({
        title: "Saved locally only",
        description: result.error ?? "Couldn't reach the backend.",
        variant: "destructive",
      });
    }
  };

  const headerLine = factsheet
    ? `Final · ${factsheet.awayAbbr} ${factsheet.awayScore} — ${factsheet.homeScore} ${factsheet.homeAbbr}${
        factsheet.ot ? ` · ${factsheet.ot}OT` : ""
      }`
    : "Generate a recap to begin";

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (o && !summary && !loading) {
          setTimeout(() => generate(), 0);
        }
      }}
    >
      <DrawerContent className="bg-[#181C23] border-[#2B2F37]">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle
              className="text-white tracking-wider"
              style={{ fontFamily: "'Saira Stencil One', sans-serif" }}
            >
              WADE'S TAKE
            </DrawerTitle>
            <p className="text-xs text-muted-foreground font-body">{headerLine}</p>
          </DrawerHeader>

          <div className="px-4 pb-6 space-y-4">
            {/* Controls */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Game source
                </Label>
                <RadioGroup
                  value={source}
                  onValueChange={handleSourceChange}
                  className="flex flex-col gap-2 mt-1"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="sample" id="src-sample" />
                    <Label htmlFor="src-sample" className="font-body text-sm">
                      Sample
                    </Label>
                  </div>

                  {gamesLoading && (
                    <p className="text-xs text-muted-foreground font-body pl-6">
                      Loading finished games…
                    </p>
                  )}

                  {!gamesLoading && finishedGames.length === 0 && (
                    <p className="text-xs text-muted-foreground font-body pl-6">
                      No finished games yet.
                    </p>
                  )}

                  {finishedGames.length > 0 && (
                    <div className="max-h-[260px] overflow-y-auto flex flex-col gap-2 pr-1">
                      {finishedGames.map((g) => {
                        const id = String(g.id);
                        const date = new Date(g.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        });
                        return (
                          <div key={id} className="flex items-center gap-2">
                            <RadioGroupItem value={id} id={`src-${id}`} />
                            <Label
                              htmlFor={`src-${id}`}
                              className="font-body text-sm"
                            >
                              {g.visitor_team.abbreviation} {g.visitor_team_score} —{" "}
                              {g.home_team_score} {g.home_team.abbreviation}
                              <span className="text-muted-foreground"> · {date}</span>
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Model
                </Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="mt-1 bg-[#0F1216] border-[#2B2F37]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Key moments fed to the model */}
            {factsheet?.highlights && factsheet.highlights.length > 0 && (
              <div className="rounded-md bg-[#0F1216] border border-[#2B2F37] p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">
                  Key moments fed to Wade
                </p>
                <ul className="space-y-0.5">
                  {factsheet.highlights.map((h, i) => (
                    <li
                      key={i}
                      className="font-body text-xs text-white/90 leading-snug"
                    >
                      · {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recap output */}
            <div className="rounded-md bg-[#0F1216] border border-[#2B2F37] p-3 min-h-[120px]">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-9/12" />
                  <Skeleton className="h-4 w-10/12" />
                </div>
              ) : summary ? (
                <p className="font-body text-sm text-white leading-relaxed whitespace-pre-wrap">
                  {summary}
                </p>
              ) : (
                <p className="font-body text-sm text-muted-foreground">
                  Tap Regenerate to summon Wade.
                </p>
              )}
            </div>

            <div className="space-y-2 text-xs text-muted-foreground font-body">
              <div className="flex items-center justify-between">
                <span>{summary.length} / 400 chars</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generate()}
                    disabled={loading}
                    className="h-8"
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    )}
                    Regenerate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copy}
                    disabled={!summary}
                    className="h-8"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
              <Button
                size="sm"
                variant="default"
                onClick={addToGame}
                disabled={!summary || loading}
                className="h-8 w-full"
              >
                {added ? (
                  <Check className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <Plus className="h-3.5 w-3.5 mr-1" />
                )}
                {added ? "Added" : "Add to game"}
              </Button>
            </div>

            {/* Inputs panel */}
            <button
              type="button"
              onClick={() => setShowInputs((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground font-body hover:text-white"
            >
              {showInputs ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              Inputs sent to model
            </button>
            {showInputs && factsheet && (
              <pre className="text-[11px] text-muted-foreground bg-[#0F1216] border border-[#2B2F37] rounded p-2 overflow-x-auto">
                {JSON.stringify(factsheet, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
