import { useMemo } from "react";
import { Trophy } from "lucide-react";
import PlayoffBracket from "@/components/PlayoffBracket";
import { useBracketData } from "@/hooks/useBracketData";
import {
  resolveSeriesTeams,
  isPlayInPlaceholder,
  type BracketSeries,
} from "@/data/playoffsData";

/**
 * A FIXED, deterministic "what if the playoffs played out" demo. Uses the
 * current resolved first-round matchups (live API data via useBracketData),
 * then propagates a chosen winner through every later round all the way to
 * a fake Finals champion. Renders inside the existing PlayoffBracket UI so
 * advancing teams are highlighted.
 *
 * Picks are deterministic — the higher seed advances at every step, with the
 * Finals decided by which conference champion has the better seed (East wins
 * ties). The "games played" per series is hand-picked to feel realistic.
 */

// Series ID → games played (4 = sweep, 7 = full series)
const SERIES_GAMES: Record<string, number> = {
  // West R1
  "west-r1-1v8": 5,
  "west-r1-4v5": 7,
  "west-r1-3v6": 6,
  "west-r1-2v7": 5,
  // East R1
  "east-r1-1v8": 5,
  "east-r1-4v5": 6,
  "east-r1-3v6": 7,
  "east-r1-2v7": 6,
  // Semis
  "west-semi-top": 6,
  "west-semi-bottom": 7,
  "east-semi-top": 6,
  "east-semi-bottom": 7,
  // Conference Finals
  "west-conf-finals": 6,
  "east-conf-finals": 7,
  // Finals
  "nba-finals": 6,
};

function buildPlayedOutResults(bracket: BracketSeries[]) {
  const winners: Record<string, string> = {};
  const games: Record<string, number> = {};

  const ordered = [
    ...bracket.filter((s) => s.round === "First Round"),
    ...bracket.filter((s) => s.round === "Conference Semifinals"),
    ...bracket.filter((s) => s.round === "Conference Finals"),
    ...bracket.filter((s) => s.round === "Finals"),
  ];

  for (const s of ordered) {
    const { topTeam, bottomTeam } = resolveSeriesTeams(s.id, winners, bracket);
    const top = topTeam ?? s.topTeam;
    const bottom = bottomTeam ?? s.bottomTeam;
    if (!top || !bottom) continue;
    if (
      isPlayInPlaceholder(top.abbreviation) ||
      isPlayInPlaceholder(bottom.abbreviation)
    )
      continue;

    // Higher seed wins (lower seed number). Tie → top slot wins.
    const topSeed = top.seed ?? 99;
    const bottomSeed = bottom.seed ?? 99;
    const winner =
      topSeed <= bottomSeed ? top.abbreviation : bottom.abbreviation;

    winners[s.id] = winner;
    games[s.id] = SERIES_GAMES[s.id] ?? 6;
  }

  return { winners, games };
}

const DemoBracketPlayedOut = () => {
  const { data: bracket, isLoading } = useBracketData(2025);

  const { winners, games, champion, seriesScores } = useMemo(() => {
    const { winners, games } = buildPlayedOutResults(bracket);

    // Build "topWins-bottomWins" per series for the score readout
    const seriesScores: Record<string, string> = {};
    for (const s of bracket) {
      const w = winners[s.id];
      if (!w) continue;
      const { topTeam, bottomTeam } = resolveSeriesTeams(s.id, winners, bracket);
      const top = topTeam ?? s.topTeam;
      const bottom = bottomTeam ?? s.bottomTeam;
      if (!top || !bottom) continue;
      const total = games[s.id] ?? 6;
      const loserWins = Math.max(0, total - 4);
      const topWins = w === top.abbreviation ? 4 : loserWins;
      const bottomWins = w === bottom.abbreviation ? 4 : loserWins;
      seriesScores[s.id] = `${topWins}-${bottomWins}`;
    }

    // Champion = winner of nba-finals, resolved to its team object for name
    const finalsSeries = bracket.find((s) => s.id === "nba-finals");
    let champion: string | undefined;
    if (finalsSeries) {
      const { topTeam, bottomTeam } = resolveSeriesTeams(
        "nba-finals",
        winners,
        bracket
      );
      const w = winners["nba-finals"];
      if (w === topTeam?.abbreviation) champion = topTeam?.name;
      else if (w === bottomTeam?.abbreviation) champion = bottomTeam?.name;
    }

    return { winners, games, champion, seriesScores };
  }, [bracket]);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-lg tracking-wider">PLAYED-OUT BRACKET</h2>
        <p className="text-xs text-muted-foreground font-body">
          Demo of how the playoffs could play out. Higher seeds advance to a
          fake Finals champion. No user picks involved.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground font-body">Loading bracket…</p>
      ) : (
        <div className="rounded-lg bg-[#1A1E24] p-3 relative">
          <PlayoffBracket
            seriesList={bracket}
            actualWinners={winners}
            seriesScores={seriesScores}
          />

          {/* Champion banner — positioned between top of bracket area and the Finals card */}
          {champion && (
            <div
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none flex items-center justify-center gap-2 py-2 px-3"
              style={{ top: 120 }}
            >
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">
                  Champion
                </p>
                <p className="font-display text-base tracking-wider" style={{ color: "#EEEEEE" }}>
                  {champion}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DemoBracketPlayedOut;
