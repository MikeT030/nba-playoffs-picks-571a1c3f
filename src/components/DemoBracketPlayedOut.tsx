import { useMemo } from "react";

import PlayoffBracket from "@/components/PlayoffBracket";
import bracketCourtBg from "@/assets/bracket-court-bg.png";
import { useBracketData } from "@/hooks/useBracketData";
import { totalUserPoints } from "@/lib/pickScoring";
import {
  resolveSeriesTeams,
  isPlayInPlaceholder,
  bracketSeries,
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

// Series IDs where the fake user picked the LOSING team (an "upset call").
// Everywhere else, the fake user picks the actual winner.
const WRONG_PICK_SERIES = new Set<string>([
  "west-r1-3v6",
  "east-r1-2v7",
  "west-semi-bottom",
  "east-conf-finals",
]);

// Series IDs where the fake user's "in N" guess differs from the actual length.
const PICK_GAMES_OFFSET: Record<string, number> = {
  "west-r1-1v8": 1,
  "east-r1-4v5": -1,
  "west-semi-top": 1,
  "east-semi-top": -1,
  "west-conf-finals": 1,
  "nba-finals": -1,
};

const DemoBracketPlayedOut = () => {
  const { data: bracket, isLoading } = useBracketData(2025);

  const { winners, champion, championLogo, seriesScores, picks, bets, totalPoints } = useMemo(() => {
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

    // Champion = winner of nba-finals, resolved to its team object for name + logo
    const finalsSeries = bracket.find((s) => s.id === "nba-finals");
    let champion: string | undefined;
    let championLogo: string | undefined;
    if (finalsSeries) {
      const { topTeam, bottomTeam } = resolveSeriesTeams(
        "nba-finals",
        winners,
        bracket
      );
      const w = winners["nba-finals"];
      if (w === topTeam?.abbreviation) {
        champion = topTeam?.name;
        championLogo = topTeam?.logo;
      } else if (w === bottomTeam?.abbreviation) {
        champion = bottomTeam?.name;
        championLogo = bottomTeam?.logo;
      }
    }

    // Build fake picks + bets that align with (or intentionally diverge from)
    // the played-out winners.
    const picks: Record<string, string> = {};
    const bets: { seriesId: string; winner: string; gamesInSeries: number }[] = [];

    for (const s of bracket) {
      const w = winners[s.id];
      if (!w) continue;
      const { topTeam, bottomTeam } = resolveSeriesTeams(s.id, winners, bracket);
      const top = topTeam ?? s.topTeam;
      const bottom = bottomTeam ?? s.bottomTeam;
      if (!top || !bottom) continue;

      const loserAbbr =
        w === top.abbreviation ? bottom.abbreviation : top.abbreviation;
      const pickedWinner = WRONG_PICK_SERIES.has(s.id) ? loserAbbr : w;

      const actualGames = games[s.id] ?? 6;
      const offset = PICK_GAMES_OFFSET[s.id] ?? 0;
      const pickedGames = Math.max(4, Math.min(7, actualGames + offset));

      picks[s.id] = pickedWinner;
      bets.push({
        seriesId: s.id,
        winner: pickedWinner,
        gamesInSeries: pickedGames,
      });
    }

    const seriesResultsLite = Object.keys(winners).map((sid) => ({
      series_id: sid,
      winner: winners[sid],
      games_played: games[sid] ?? 6,
    }));
    const userPicksLite = bets.map((b) => ({
      series_id: b.seriesId,
      winner: b.winner,
      games_in_series: b.gamesInSeries,
    }));
    const totalPoints = totalUserPoints(userPicksLite, seriesResultsLite);

    return { winners, champion, championLogo, seriesScores, picks, bets, totalPoints };
  }, [bracket]);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-lg tracking-wider">PLAYED-OUT BRACKET</h2>
        <p className="text-xs text-muted-foreground font-body">
          Demo of how the playoffs could play out, with sample user picks.
          Higher seeds advance; a few intentional upsets show how wrong picks
          appear in the bracket.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground font-body">Loading bracket…</p>
      ) : (
        <>
          <div className="mb-2">
            <p className="font-body font-medium text-white flex items-baseline gap-3 text-lg">
              You have
              <span className="font-display text-primary leading-none text-2xl">{totalPoints}</span>
              points
            </p>
          </div>
          <div
            className="rounded-lg p-3"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--background) / 0.7), hsl(var(--background) / 0.7)), url(${bracketCourtBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <PlayoffBracket
              seriesList={bracket}
              actualWinners={winners}
              seriesScores={seriesScores}
              picks={picks}
              bets={bets}
              championName={champion}
              championLogoSrc={championLogo}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default DemoBracketPlayedOut;
