import { useState, useEffect } from "react";
import { Trophy, Star, List, ChevronLeft } from "lucide-react";
import HeroBanner from "@/components/HeroBanner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { bracketSeries } from "@/data/playoffsData";



// Scoring system:
// 3 pts - correct winner + correct score from correct match
// 2 pts - correct winner from correct match (wrong score)
// 1 pt  - correct winner from wrong match (picked the right team but assigned to wrong series)
// 4 pts - correct champion bonus (nba-finals winner)

interface ParticipantScore {
  name: string;
  perfectPicks: number;
  winnerPicks: number;
  loosePicks: number;
  championBonus: boolean;
  totalPoints: number;
}

interface PickRow {
  profile_name: string;
  series_id: string;
  winner: string;
  games_in_series: number;
}

interface SeriesResult {
  series_id: string;
  winner: string;
  games_played: number;
}

const roundOrder = ["First Round", "Conference Semifinals", "Conference Finals", "Finals"];

function computeScoreboard(
  allPicks: PickRow[],
  results: SeriesResult[]
): ParticipantScore[] {
  // Group picks by player
  const playerPicks = new Map<string, PickRow[]>();
  for (const p of allPicks) {
    const list = playerPicks.get(p.profile_name) || [];
    list.push(p);
    playerPicks.set(p.profile_name, list);
  }

  // Build result lookup
  const resultMap = new Map<string, SeriesResult>();
  for (const r of results) resultMap.set(r.series_id, r);

  // Set of all actual winners (for loose pick matching)
  const actualWinners = new Set(results.map((r) => r.winner));

  const scores: ParticipantScore[] = [];

  for (const [name, picks] of playerPicks) {
    let perfectPicks = 0;
    let winnerPicks = 0;
    let loosePicks = 0;
    let championBonus = false;

    // Track which picks have been scored to avoid double-counting for loose picks
    const scoredPicks = new Set<number>();

    for (let i = 0; i < picks.length; i++) {
      const pick = picks[i];
      const result = resultMap.get(pick.series_id);
      if (!result) continue; // series not decided yet

      if (result.winner === pick.winner) {
        // Correct match, correct winner
        if (result.games_played === pick.games_in_series) {
          perfectPicks++; // 3 pts
        } else {
          winnerPicks++; // 2 pts
        }
        scoredPicks.add(i);
      }
    }

    // Loose picks: picked the right winner but assigned to wrong series
    for (let i = 0; i < picks.length; i++) {
      if (scoredPicks.has(i)) continue;
      const pick = picks[i];
      const result = resultMap.get(pick.series_id);
      // Only count if the series IS decided and the pick was wrong for that series
      if (result && result.winner !== pick.winner && actualWinners.has(pick.winner)) {
        loosePicks++; // 1 pt
        scoredPicks.add(i);
      }
    }

    // Champion bonus
    const finalsResult = resultMap.get("nba-finals");
    const finalsPick = picks.find((p) => p.series_id === "nba-finals");
    if (finalsResult && finalsPick && finalsResult.winner === finalsPick.winner) {
      championBonus = true;
    }

    const totalPoints =
      perfectPicks * 3 + winnerPicks * 2 + loosePicks * 1 + (championBonus ? 4 : 0);

    scores.push({ name, perfectPicks, winnerPicks, loosePicks, championBonus, totalPoints });
  }

  return scores.sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));
}

const getRankIcon = (index: number) => {
  if (index === 0) return <Trophy size={18} className="text-primary" />;
  return <span className="text-muted-foreground font-body text-sm w-[18px] text-center inline-block">{index + 1}</span>;
};

// Build a label for each series like "OKC-HOU"
function getSeriesLabel(seriesId: string): string {
  const s = bracketSeries.find((b) => b.id === seriesId);
  if (!s) return seriesId;
  const top = s.topTeam?.abbreviation || "TBD";
  const bot = s.bottomTeam?.abbreviation || "TBD";
  return `${top}-${bot}`;
}

function getSeriesRound(seriesId: string): string {
  const s = bracketSeries.find((b) => b.id === seriesId);
  return s?.round || "";
}

const AllPicksMatrix = () => {
  const [picks, setPicks] = useState<PickRow[]>([]);
  const [results, setResults] = useState<SeriesResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [picksRes, resultsRes] = await Promise.all([
        supabase.from("picks").select("profile_name, series_id, winner, games_in_series"),
        supabase.from("series_results").select("series_id, winner, games_played"),
      ]);
      if (picksRes.data) setPicks(picksRes.data);
      if (resultsRes.data) setResults(resultsRes.data as SeriesResult[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <p className="text-center text-muted-foreground font-body py-8">Loading picks…</p>;
  }

  if (picks.length === 0) {
    return <p className="text-center text-muted-foreground font-body py-8">No picks saved yet.</p>;
  }

  // Get unique players and series
  const players = [...new Set(picks.map((p) => p.profile_name))].sort((a, b) =>
    a.localeCompare(b)
  );

  // Order series by round then by bracket order
  const seriesIds = [...new Set(picks.map((p) => p.series_id))];
  const orderedSeries = seriesIds.sort((a, b) => {
    const ra = roundOrder.indexOf(getSeriesRound(a));
    const rb = roundOrder.indexOf(getSeriesRound(b));
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });

  // Compute per-player scores
  const playerScores = new Map<string, number>();
  const scoreboardData = computeScoreboard(picks, results);
  for (const s of scoreboardData) {
    playerScores.set(s.name, s.totalPoints);
  }


  const pickMap = new Map<string, PickRow>();
  for (const p of picks) {
    pickMap.set(`${p.profile_name}::${p.series_id}`, p);
  }

  // Group series by round for row headers
  let lastRound = "";

  return (
    <div className="w-full max-h-[75vh] overflow-auto">
      <table className="min-w-max text-sm border-collapse">
          <thead className="[&_tr]:border-b">
            <tr className="border-b">
              <th className="sticky top-0 left-0 z-30 bg-card h-12 px-3 text-left align-middle font-medium text-muted-foreground min-w-[100px]">Round</th>
              <th className="sticky top-0 left-[100px] z-30 bg-card h-12 px-3 text-left align-middle font-medium text-muted-foreground min-w-[100px]">Series</th>
              {players.map((player) => (
                <th key={player} className="sticky top-0 z-20 bg-card h-12 px-3 text-center align-middle font-medium text-muted-foreground min-w-[90px] whitespace-nowrap">
                  {player}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orderedSeries.map((seriesId) => {
              const round = getSeriesRound(seriesId);
              const showRound = round !== lastRound;
              lastRound = round;

              return (
                <tr key={seriesId} className="border-b transition-colors hover:bg-muted/50">
                  <td className="sticky left-0 z-10 bg-card p-3 align-middle font-body text-xs text-muted-foreground min-w-[100px]">
                    {showRound ? (() => {
                      const words = round.split(" ");
                      return words.length > 1 ? (
                        <span className="text-primary-foreground">{words[0]}<br />{words.slice(1).join(" ")}</span>
                      ) : <span className="text-primary-foreground">{round}</span>;
                    })() : ""}
                  </td>
                  <td className="sticky left-[100px] z-10 bg-card p-3 align-middle font-display tracking-wide whitespace-nowrap text-sm">
                    {getSeriesLabel(seriesId)}
                  </td>
                  {players.map((player) => {
                    const pick = pickMap.get(`${player}::${seriesId}`);
                    return (
                      <td key={player} className="p-3 align-middle text-center font-body text-xs whitespace-nowrap">
                        {pick ? (
                          <span>
                            <span className="font-medium text-foreground">{pick.winner}</span>
                            <span className="ml-1 text-white">in {pick.games_in_series}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
    </div>
  );
};

const Scoreboard = () => {
  const [showAllPicks, setShowAllPicks] = useState(false);
  const [scoreboard, setScoreboard] = useState<ParticipantScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      const [picksRes, resultsRes] = await Promise.all([
        supabase.from("picks").select("profile_name, series_id, winner, games_in_series"),
        supabase.from("series_results").select("series_id, winner, games_played"),
      ]);
      const picks = (picksRes.data || []) as PickRow[];
      const results = (resultsRes.data || []) as SeriesResult[];
      setScoreboard(computeScoreboard(picks, results));
      setLoading(false);
    };
    fetchScores();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner title={"SCORE\nBOARD"} subtitle="NBA Playoffs 2026" />

      <section className="container py-8">

        {/* Toggle button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowAllPicks(!showAllPicks)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20"
          >
            {showAllPicks ? (
              <>
                <ChevronLeft size={18} />
                Back to Scoreboard
              </>
            ) : (
              <>
                <List size={18} />
                See All Picks
              </>
            )}
          </button>
        </div>

        {showAllPicks ? (
          /* All Picks Matrix */
          <div className="bg-card rounded-lg overflow-hidden">
            <AllPicksMatrix />
          </div>
        ) : (
          /* Leaderboard */
          <div className="bg-card rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scoreboard.map((player, i) => (
                  <TableRow key={player.name}>
                    <TableCell>{getRankIcon(i)}</TableCell>
                    <TableCell>
                      <span className="font-body font-medium text-foreground">{player.name}</span>
                    </TableCell>
                    <TableCell className="text-right font-display text-lg text-foreground">{player.totalPoints}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Scoring legend */}
        <div className="mt-8 bg-card border border-border rounded-lg p-5">
          <h2 className="font-display text-sm tracking-wider text-foreground mb-3 flex items-center gap-2">
            <Star size={14} className="text-primary" /> SCORING SYSTEM
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-body text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-display text-primary text-base w-6 text-right">3</span>
              <span>Correct winner + correct score (correct match)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-primary text-base w-6 text-right">2</span>
              <span>Correct winner (correct match)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-primary text-base w-6 text-right">1</span>
              <span>Correct winner (wrong match)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-primary text-base w-6 text-right">+4</span>
              <span>Correct champion bonus</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground font-body mt-6">
          Scores update as playoff results come in
        </p>
      </section>
    </div>
  );
};

export default Scoreboard;
