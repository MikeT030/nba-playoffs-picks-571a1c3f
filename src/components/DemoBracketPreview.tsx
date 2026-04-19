import { useMemo, useState } from "react";
import { Shuffle } from "lucide-react";
import PlayoffBracket from "@/components/PlayoffBracket";
import {
  bracketSeries as defaultBracketSeries,
  resolveSeriesTeams,
  isPlayInPlaceholder,
  type BracketSeries,
} from "@/data/playoffsData";

interface DemoBracketPreviewProps {
  seriesList?: BracketSeries[];
}

/**
 * Generates a random pick map for every series in the bracket, propagating
 * winners through later rounds. Picks games-in-series randomly between 4-7.
 */
function generateRandomPicks(bracket: BracketSeries[]): {
  picks: Record<string, string>;
  bets: { seriesId: string; winner: string; gamesInSeries: number }[];
} {
  const picks: Record<string, string> = {};
  const bets: { seriesId: string; winner: string; gamesInSeries: number }[] = [];

  // Round order matters: R1 → Semis → CF → Finals
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
    // Skip play-in placeholders — no real team to pick.
    if (isPlayInPlaceholder(top.abbreviation) || isPlayInPlaceholder(bottom.abbreviation)) continue;

    const winner = Math.random() < 0.5 ? top.abbreviation : bottom.abbreviation;
    const gamesInSeries = 4 + Math.floor(Math.random() * 4); // 4–7
    picks[s.id] = winner;
    bets.push({ seriesId: s.id, winner, gamesInSeries });
  }

  return { picks, bets };
}

const DemoBracketPreview = ({ seriesList }: DemoBracketPreviewProps) => {
  const bracket = seriesList ?? defaultBracketSeries;
  const [seed, setSeed] = useState(0);
  const [enabled, setEnabled] = useState(false);

  const { picks, bets } = useMemo(
    () => generateRandomPicks(bracket),
    // Regenerate on seed change or bracket change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed, bracket]
  );

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
        <div className="rounded-lg bg-[#1A1E24] p-3">
          <PlayoffBracket picks={picks} bets={bets} seriesList={bracket} />
        </div>
      )}
    </div>
  );
};

export default DemoBracketPreview;
