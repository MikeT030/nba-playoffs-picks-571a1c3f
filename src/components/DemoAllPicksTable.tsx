import { useMemo } from "react";
import { useBracketData } from "@/hooks/useBracketData";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  resolveSeriesTeams,
  isPlayInPlaceholder,
  getAssumedOpponentAbbr,
  type BracketSeries,
} from "@/data/playoffsData";

/**
 * A FIXED, deterministic demo "All Picks" table that mirrors the Scoreboard
 * page's matrix view, but renders ONLY the points each pick earned (no
 * "TEAM in N" labels). Uses the same played-out winners as the demo bracket
 * so the points line up with what the bracket already shows.
 *
 * Scoring (per pick):
 *   3 pts — correct winner + correct games-played
 *   2 pts — correct winner only
 *   1 pt  — wrong series, but the picked team won some other series
 *   0 pts — wrong winner & not a winner anywhere
 *   +4   — champion bonus (added to the nba-finals cell when correct)
 */

// ── Fixed series lengths (must match DemoBracketPlayedOut) ──
const SERIES_GAMES: Record<string, number> = {
  "west-r1-1v8": 5,
  "west-r1-4v5": 7,
  "west-r1-3v6": 6,
  "west-r1-2v7": 5,
  "east-r1-1v8": 5,
  "east-r1-4v5": 6,
  "east-r1-3v6": 7,
  "east-r1-2v7": 6,
  "west-semi-top": 6,
  "west-semi-bottom": 7,
  "east-semi-top": 6,
  "east-semi-bottom": 7,
  "west-conf-finals": 6,
  "east-conf-finals": 7,
  "nba-finals": 6,
};

const ROUND_ORDER = [
  "First Round",
  "Conference Semifinals",
  "Conference Finals",
  "Finals",
] as const;

// ── Fake players: each picks differently from the actual played-out result ──
interface FakePlayerSpec {
  name: string;
  wrongPickSeries: string[]; // series where this player picks the LOSER
  gamesOffset: Record<string, number>; // series → ±N games offset vs actual
}

const FAKE_PLAYERS: FakePlayerSpec[] = [
  {
    name: "Alex",
    wrongPickSeries: ["west-r1-3v6", "east-r1-2v7", "east-conf-finals"],
    gamesOffset: {
      "west-r1-1v8": 1,
      "east-r1-4v5": -1,
      "west-conf-finals": 1,
      "nba-finals": -1,
    },
  },
  {
    name: "Sam",
    wrongPickSeries: ["east-r1-3v6", "west-semi-bottom", "nba-finals"],
    gamesOffset: {
      "west-r1-2v7": 1,
      "east-r1-1v8": -1,
      "east-semi-top": 1,
    },
  },
  {
    name: "Jordan",
    wrongPickSeries: ["west-r1-1v8", "east-semi-bottom"],
    gamesOffset: {
      "west-r1-4v5": -1,
      "east-r1-2v7": 1,
      "west-conf-finals": -1,
      "nba-finals": 1,
    },
  },
  {
    name: "Riley",
    wrongPickSeries: ["west-r1-2v7", "east-r1-4v5", "west-conf-finals"],
    gamesOffset: {
      "west-r1-3v6": 1,
      "east-r1-3v6": -1,
      "east-conf-finals": 1,
    },
  },
];

// ── Same propagation logic as DemoBracketPlayedOut ──
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

    const topSeed = top.seed ?? 99;
    const bottomSeed = bottom.seed ?? 99;
    const winner =
      topSeed <= bottomSeed ? top.abbreviation : bottom.abbreviation;

    winners[s.id] = winner;
    games[s.id] = SERIES_GAMES[s.id] ?? 6;
  }

  return { winners, games };
}

interface PickRow {
  series_id: string;
  winner: string;
  games_in_series: number;
}

function buildPlayerPicks(
  spec: FakePlayerSpec,
  bracket: BracketSeries[],
  winners: Record<string, string>,
  games: Record<string, number>,
): PickRow[] {
  const wrongSet = new Set(spec.wrongPickSeries);
  const out: PickRow[] = [];

  for (const s of bracket) {
    const w = winners[s.id];
    if (!w) continue;
    const { topTeam, bottomTeam } = resolveSeriesTeams(s.id, winners, bracket);
    const top = topTeam ?? s.topTeam;
    const bottom = bottomTeam ?? s.bottomTeam;
    if (!top || !bottom) continue;

    const loserAbbr =
      w === top.abbreviation ? bottom.abbreviation : top.abbreviation;
    const pickedWinner = wrongSet.has(s.id) ? loserAbbr : w;

    const actualGames = games[s.id] ?? 6;
    const offset = spec.gamesOffset[s.id] ?? 0;
    const pickedGames = Math.max(4, Math.min(7, actualGames + offset));

    out.push({
      series_id: s.id,
      winner: pickedWinner,
      games_in_series: pickedGames,
    });
  }

  return out;
}

interface PointsCellInfo {
  /** Base points for this pick (0–3). */
  basePoints: number;
  /** Whether the champion +4 bonus applies (only on the nba-finals row). */
  championBonus: boolean;
}

function scorePick(
  pick: PickRow,
  winners: Record<string, string>,
  games: Record<string, number>,
  actualWinnerSet: Set<string>,
): PointsCellInfo {
  const actualWinner = winners[pick.series_id];
  const actualGames = games[pick.series_id];
  let basePoints = 0;

  if (actualWinner && pick.winner === actualWinner) {
    basePoints = pick.games_in_series === actualGames ? 3 : 2;
  } else if (actualWinnerSet.has(pick.winner)) {
    // Right team, wrong series
    basePoints = 1;
  }

  const championBonus =
    pick.series_id === "nba-finals" &&
    !!actualWinner &&
    pick.winner === actualWinner;

  return { basePoints, championBonus };
}

function getSeriesLabel(seriesId: string, seriesList: BracketSeries[]): string {
  const s = seriesList.find((b) => b.id === seriesId);
  if (!s) return seriesId;
  const top = s.topTeam?.abbreviation || "TBD";
  const bot = s.bottomTeam?.abbreviation || "TBD";
  return `${top}-${bot}`;
}

function getSeriesRound(seriesId: string, seriesList: BracketSeries[]): string {
  const s = seriesList.find((b) => b.id === seriesId);
  return s?.round || "";
}

const POINTS_COLOR: Record<number, string> = {
  3: "text-emerald-400",
  2: "text-sky-400",
  1: "text-amber-400",
  0: "text-muted-foreground/50",
};

const DemoAllPicksTable = () => {
  const { data: bracket, isLoading } = useBracketData(2025);

  const { rows, players, totals } = useMemo(() => {
    const { winners, games } = buildPlayedOutResults(bracket);
    const actualWinnerSet = new Set(Object.values(winners));

    const players = FAKE_PLAYERS.map((spec) => ({
      name: spec.name,
      picks: buildPlayerPicks(spec, bracket, winners, games),
    }));

    // Ordered series IDs (only those with a winner so the table aligns with
    // the bracket).
    const seriesIds = Array.from(
      new Set(
        bracket
          .filter((s) => winners[s.id])
          .map((s) => s.id),
      ),
    );
    seriesIds.sort((a, b) => {
      const ra = ROUND_ORDER.indexOf(getSeriesRound(a, bracket) as never);
      const rb = ROUND_ORDER.indexOf(getSeriesRound(b, bracket) as never);
      if (ra !== rb) return ra - rb;
      return a.localeCompare(b);
    });

    const rows = seriesIds.map((seriesId) => {
      const round = getSeriesRound(seriesId, bracket);
      const label = getSeriesLabel(seriesId, bracket);
      const { topTeam, bottomTeam } = resolveSeriesTeams(seriesId, winners, bracket);
      const seriesDef = bracket.find((s) => s.id === seriesId);
      const top = topTeam ?? seriesDef?.topTeam;
      const bot = bottomTeam ?? seriesDef?.bottomTeam;
      const cells = players.map(({ picks }) => {
        const pick = picks.find((p) => p.series_id === seriesId);
        if (!pick) return null;
        const score = scorePick(pick, winners, games, actualWinnerSet);
        const assumedOpp = getAssumedOpponentAbbr(
          seriesId,
          pick.winner,
          bracket,
          picks.map((p) => ({ series_id: p.series_id, winner: p.winner })),
        );
        const actualOpp =
          top?.abbreviation === pick.winner
            ? bot?.abbreviation
            : bot?.abbreviation === pick.winner
              ? top?.abbreviation
              : null;
        const showAssumed =
          !!assumedOpp && !!actualOpp && actualOpp !== assumedOpp;
        return { pick, ...score, assumedOpp, showAssumed };
      });
      return { seriesId, round, label, cells };
    });

    const totals = players.map((_, i) =>
      rows.reduce((sum, r) => {
        const cell = r.cells[i];
        if (!cell) return sum;
        return sum + cell.basePoints + (cell.championBonus ? 4 : 0);
      }, 0),
    );

    return { rows, players, totals };
  }, [bracket]);

  return (
    <div className="space-y-3">
      {isLoading ? (
        <p className="text-sm text-muted-foreground font-body">Loading demo table…</p>
      ) : (
        <Accordion type="single" collapsible defaultValue="demo-all-picks">
          <AccordionItem value="demo-all-picks" className="border-none">
            <AccordionTrigger className="font-display text-lg tracking-wider hover:no-underline py-2">
              DEMO ALL-POINTS TABLE
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-3">
              <p className="text-xs text-muted-foreground font-body">
                Same played-out results as the demo bracket. Each cell shows the
                pick (e.g. "OKC in 6") and the points it earned (3 = perfect,
                2 = winner, 1 = right team / wrong series, 0 = miss). The Finals
                cell adds a +4 champion bonus when correct.
              </p>
              <div className="rounded-lg border border-white/10 bg-[#22272E]/80 backdrop-blur-md overflow-hidden">
                <div className="w-full overflow-auto">
            <table className="min-w-max text-sm border-collapse">
              <thead>
                <tr>
                  <th className="sticky top-0 z-20 bg-[#1A1E24]/90 backdrop-blur-md h-12 px-3 text-left align-middle font-medium text-muted-foreground min-w-[100px]">
                    Round
                  </th>
                  <th className="sticky top-0 left-0 z-30 bg-[#1A1E24]/90 backdrop-blur-md h-12 px-3 text-left align-middle font-medium text-muted-foreground min-w-[100px]">
                    Series
                  </th>
                  {players.map((p) => (
                    <th
                      key={p.name}
                      className="sticky top-0 z-20 bg-[#1A1E24]/90 backdrop-blur-md h-12 px-3 text-center align-middle font-medium text-muted-foreground min-w-[80px] whitespace-nowrap"
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let lastRound = "";
                  return rows.map((row) => {
                    const showRound = row.round !== lastRound;
                    lastRound = row.round;
                    return (
                      <tr
                        key={row.seriesId}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <td className="bg-[#1A1E24]/60 backdrop-blur-sm p-3 align-middle font-body text-xs text-muted-foreground min-w-[100px]">
                          {showRound ? (() => {
                            const words = row.round.split(" ");
                            return words.length > 1 ? (
                              <span className="text-primary-foreground">
                                {words[0]}
                                <br />
                                {words.slice(1).join(" ")}
                              </span>
                            ) : (
                              <span className="text-primary-foreground">
                                {row.round}
                              </span>
                            );
                          })() : ""}
                        </td>
                        <td className="sticky left-0 z-10 bg-[#1A1E24]/80 backdrop-blur-sm p-3 align-middle font-display tracking-wide whitespace-nowrap text-sm">
                          {row.label}
                        </td>
                        {row.cells.map((cell, i) => {
                          if (!cell) {
                            return (
                              <td
                                key={i}
                                className="p-3 align-middle text-center font-body text-xs text-muted-foreground/40"
                              >
                                —
                              </td>
                            );
                          }
                          const total =
                            cell.basePoints + (cell.championBonus ? 4 : 0);
                          const colorCls = POINTS_COLOR[cell.basePoints] ?? "";
                          return (
                            <td
                              key={i}
                              className="p-3 align-middle text-center font-body text-xs whitespace-nowrap"
                            >
                              <div className="inline-flex items-baseline gap-1.5">
                                <span>
                                  <span className="font-bold text-foreground">
                                    {cell.pick.winner}
                                  </span>
                                  <span className="ml-1 text-white">
                                    in {cell.pick.games_in_series}
                                  </span>
                                </span>
                                <span
                                  className={`font-display text-sm ${colorCls}`}
                                >
                                  {total}
                                  {cell.championBonus && (
                                    <span className="ml-0.5 text-[9px] font-body text-amber-300/80 align-top">
                                      +4
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  });
                })()}
                {/* Total row */}
                <tr className="bg-[#1A1E24]/40">
                  <td className="bg-[#1A1E24]/30 p-3 min-w-[100px]"></td>
                  <td className="sticky left-0 z-10 bg-[#1A1E24]/50 backdrop-blur-sm p-3 align-middle font-display tracking-wide whitespace-nowrap text-sm text-[#ededed]">
                    Total
                  </td>
                  {totals.map((t, i) => (
                    <td
                      key={i}
                      className="p-3 align-middle text-center font-display text-base text-[#ededed]"
                    >
                      {t}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
};

export default DemoAllPicksTable;
