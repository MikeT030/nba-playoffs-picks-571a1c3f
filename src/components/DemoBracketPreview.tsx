import { useMemo, useState } from "react";
import { Shuffle } from "lucide-react";
import PlayoffBracket, { type BracketVariant } from "@/components/PlayoffBracket";
import {
  bracketSeries as defaultBracketSeries,
  resolveSeriesTeams,
  isPlayInPlaceholder,
  type BracketSeries,
} from "@/data/playoffsData";
import { scorePick, totalUserPoints, type PickPointInfo } from "@/lib/pickScoring";

interface DemoBracketPreviewProps {
  seriesList?: BracketSeries[];
}

interface GeneratedPicks {
  picks: Record<string, string>;
  bets: { seriesId: string; winner: string; gamesInSeries: number }[];
}

/**
 * Generates random picks for every series in the bracket, propagating winners
 * through later rounds. Picks games-in-series randomly between 4-7.
 */
function generatePicks(
  bracket: BracketSeries[],
  // Optional bias map: when provided, use this to break ties / pre-seed winners
  preferred?: Record<string, string>
): GeneratedPicks {
  const picks: Record<string, string> = {};
  const bets: GeneratedPicks["bets"] = [];

  const ordered = [
    ...bracket.filter((s) => s.round === "First Round"),
    ...bracket.filter((s) => s.round === "Conference Semifinals"),
    ...bracket.filter((s) => s.round === "Conference Finals"),
    ...bracket.filter((s) => s.round === "Finals"),
  ];

  for (const s of ordered) {
    const { topTeam, bottomTeam } = resolveSeriesTeams(s.id, picks, bracket);
    const top = topTeam ?? s.topTeam;
    const bottom = bottomTeam ?? s.bottomTeam;
    if (!top || !bottom) continue;
    if (isPlayInPlaceholder(top.abbreviation) || isPlayInPlaceholder(bottom.abbreviation)) continue;

    let winner: string;
    if (preferred?.[s.id] && (preferred[s.id] === top.abbreviation || preferred[s.id] === bottom.abbreviation)) {
      winner = preferred[s.id];
    } else {
      winner = Math.random() < 0.5 ? top.abbreviation : bottom.abbreviation;
    }
    const gamesInSeries = 4 + Math.floor(Math.random() * 4);
    picks[s.id] = winner;
    bets.push({ seriesId: s.id, winner, gamesInSeries });
  }

  return { picks, bets };
}

/**
 * Builds a plausible "actual results" set by mutating ~30% of the user's picks.
 * Also varies games_played independently.
 */
function generateActualResults(userPicks: GeneratedPicks, bracket: BracketSeries[]) {
  const actualPicks = generatePicks(bracket, userPicks.picks); // start from user's picks
  // Randomly flip ~30% of series winners to create some misses
  const flipped: Record<string, string> = { ...actualPicks.picks };
  for (const s of bracket) {
    if (!flipped[s.id]) continue;
    if (Math.random() < 0.3) {
      const { topTeam, bottomTeam } = resolveSeriesTeams(s.id, flipped, bracket);
      const top = topTeam ?? s.topTeam;
      const bottom = bottomTeam ?? s.bottomTeam;
      if (!top || !bottom) continue;
      flipped[s.id] = flipped[s.id] === top.abbreviation ? bottom.abbreviation : top.abbreviation;
    }
  }
  // Re-propagate downstream from flipped winners
  const propagated = generatePicks(bracket, flipped);
  return propagated;
}

const VARIANTS: { id: BracketVariant; label: string; description: string }[] = [
  { id: "badge", label: "Badge", description: "Green ADV badge on advancing teams" },
  { id: "ring", label: "Ring", description: "Card outlined green/red by pick correctness" },
  { id: "stripe", label: "Stripe", description: "Subtle left stripe marks the advancing team" },
  { id: "trophy", label: "Trophy", description: "Trophy icon next to the advancing team" },
];

const DemoBracketPreview = ({ seriesList }: DemoBracketPreviewProps) => {
  const bracket = seriesList ?? defaultBracketSeries;
  const [seed, setSeed] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const [variant, setVariant] = useState<BracketVariant>("badge");

  const userPicks = useMemo(
    () => generatePicks(bracket),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed, bracket]
  );

  const actualResults = useMemo(
    () => generateActualResults(userPicks, bracket),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userPicks, bracket]
  );

  // Map seriesId → actual winner
  const actualWinners = actualResults.picks;

  // Per-pick points
  const pickPoints = useMemo(() => {
    const map: Record<string, PickPointInfo> = {};
    const userBetsLite = userPicks.bets.map((b) => ({
      series_id: b.seriesId,
      winner: b.winner,
      games_in_series: b.gamesInSeries,
    }));
    const resultsLite = actualResults.bets.map((b) => ({
      series_id: b.seriesId,
      winner: b.winner,
      games_played: b.gamesInSeries,
    }));
    for (const b of userPicks.bets) {
      const pick = { series_id: b.seriesId, winner: b.winner, games_in_series: b.gamesInSeries };
      map[b.seriesId] = scorePick(pick, userBetsLite, resultsLite);
    }
    return map;
  }, [userPicks, actualResults]);

  const totalPoints = useMemo(() => {
    const userBetsLite = userPicks.bets.map((b) => ({
      series_id: b.seriesId,
      winner: b.winner,
      games_in_series: b.gamesInSeries,
    }));
    const resultsLite = actualResults.bets.map((b) => ({
      series_id: b.seriesId,
      winner: b.winner,
      games_played: b.gamesInSeries,
    }));
    return totalUserPoints(userBetsLite, resultsLite);
  }, [userPicks, actualResults]);

  // Demo "matchup standings" — formatted as topWins-bottomWins per series,
  // matching the actual advancement results above.
  const seriesScores = useMemo(() => {
    const map: Record<string, string> = {};
    for (const b of actualResults.bets) {
      const series = bracket.find((s) => s.id === b.seriesId);
      const resolved = resolveSeriesTeams(b.seriesId, actualResults.picks, bracket);
      const top = resolved.topTeam ?? series?.topTeam;
      const bottom = resolved.bottomTeam ?? series?.bottomTeam;
      if (!top || !bottom) continue;
      const loserWins = Math.max(0, b.gamesInSeries - 4);
      const topWins = b.winner === top.abbreviation ? 4 : loserWins;
      const bottomWins = b.winner === bottom.abbreviation ? 4 : loserWins;
      map[b.seriesId] = `${topWins}-${bottomWins}`;
    }
    return map;
  }, [actualResults, bracket]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg tracking-wider">DEMO BRACKET</h2>
          <p className="text-xs text-muted-foreground font-body">
            Preview how the bracket fills in. Picks are random and not saved.
          </p>
        </div>
        {enabled && (
          <button
            onClick={() => setSeed((s) => s + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-medium bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20 transition-all duration-200 shrink-0"
          >
            <Shuffle size={14} />
            Reroll
          </button>
        )}
      </div>

      {!enabled ? (
        <button
          onClick={() => setEnabled(true)}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20"
        >
          <Shuffle size={18} />
          Show Demo Bracket
        </button>
      ) : (
        <>
          {/* Variant dot navigation */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              {VARIANTS.map((v) => {
                const active = variant === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setVariant(v.id)}
                    aria-label={`${v.label} variant`}
                    aria-pressed={active}
                    className={`rounded-full transition-all duration-200 ${
                      active
                        ? "w-4 h-4 bg-primary ring-2 ring-primary/30"
                        : "w-3 h-3 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                    }`}
                  />
                );
              })}
            </div>
            <div className="text-center">
              <p className="font-display text-xs tracking-wider text-foreground uppercase">
                {VARIANTS.find((v) => v.id === variant)?.label}
              </p>
              <p className="text-[10px] text-muted-foreground font-body">
                {VARIANTS.find((v) => v.id === variant)?.description}
              </p>
            </div>
          </div>

          {/* Points summary */}
          <div className="flex items-center justify-center gap-4 py-2 px-3 rounded-lg bg-[#1A1E24] border border-border/50">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">Your Points</p>
              <p className="font-display text-2xl text-primary">{totalPoints}</p>
            </div>
            <div className="h-8 w-px bg-border/40" />
            <div className="flex items-center gap-3 text-[10px] font-body">
              <span className="flex items-center gap-1 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> 3 perfect
              </span>
              <span className="flex items-center gap-1 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> 2 winner
              </span>
              <span className="flex items-center gap-1 text-sky-300">
                <span className="w-2 h-2 rounded-full bg-sky-400" /> 1 loose
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-[#1A1E24] p-3">
            <PlayoffBracket
              picks={userPicks.picks}
              bets={userPicks.bets}
              seriesList={bracket}
              actualWinners={actualWinners}
              pickPoints={pickPoints}
              variant={variant}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default DemoBracketPreview;
