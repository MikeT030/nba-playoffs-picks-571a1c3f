import { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Trophy, LayoutGrid } from "lucide-react";

const AllPicksIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 95 78" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M8.4922 0C3.8164 0 0 3.8125 0 8.4883L0.00390601 69.4533C0.00390601 74.1291 3.81641 77.9455 8.49611 77.9455H85.6331C90.3089 77.9455 94.1214 74.133 94.1214 69.4533V8.4883C94.1214 3.8125 90.3089 0 85.6331 0H8.4922ZM8.4922 2.9414H30.3982V15.4374H2.9412V8.4882C2.9412 5.3905 5.3945 2.9414 8.4922 2.9414ZM33.3402 2.9414H60.7852V15.4374H33.3442L33.3402 2.9414ZM63.7272 2.9414H85.6332C88.7309 2.9414 91.1801 5.3906 91.1801 8.4883V15.4375H63.7271L63.7272 2.9414ZM2.9462 18.3674H30.4032V75.0004H8.4972C5.3995 75.0004 2.9464 72.5512 2.9464 69.4535L2.9462 18.3674ZM33.3442 18.3674H60.7852V75.0004H33.3442V18.3674ZM63.7312 18.3674H91.1842V69.4534C91.1842 72.5511 88.735 75.0003 85.6373 75.0003H63.7273L63.7312 18.3674ZM9.6882 26.7385C9.29367 26.7385 8.91867 26.8908 8.6413 27.1682C8.36396 27.4455 8.20771 27.8244 8.21161 28.2151C8.21161 28.6057 8.36786 28.9768 8.6452 29.2542C8.92254 29.5276 9.29754 29.68 9.6882 29.68H23.6612C24.4698 29.6761 25.1221 29.0237 25.126 28.2152C25.126 27.8245 24.9737 27.4495 24.7002 27.1722C24.4229 26.8948 24.0518 26.7386 23.6611 26.7386L9.6882 26.7385ZM40.0752 26.7385H40.0713C39.6807 26.7385 39.3096 26.8947 39.0361 27.1721C38.7588 27.4494 38.6064 27.8244 38.6064 28.2151C38.6103 29.0237 39.2666 29.676 40.0712 29.6799H54.0442C54.4348 29.6799 54.8098 29.5275 55.0833 29.2541C55.3606 28.9768 55.5169 28.6057 55.5208 28.215C55.5208 27.8244 55.3646 27.4455 55.0872 27.1681C54.8099 26.8908 54.4349 26.7384 54.0442 26.7384L40.0752 26.7385ZM70.4732 26.7385H70.4693C70.0787 26.7385 69.7037 26.8947 69.4302 27.1721C69.1568 27.4494 69.0044 27.8244 69.0044 28.2151C69.0083 29.0237 69.6607 29.676 70.4692 29.6799H84.4382C84.8288 29.6799 85.2038 29.5275 85.4812 29.2541C85.7586 28.9768 85.9148 28.6057 85.9148 28.215C85.9187 27.8244 85.7625 27.4455 85.4851 27.1681C85.2078 26.8908 84.8328 26.7384 84.4382 26.7384L70.4732 26.7385ZM9.6922 39.0585H9.68829C9.29767 39.0546 8.92267 39.2108 8.64529 39.4843C8.36795 39.7616 8.2117 40.1327 8.2117 40.5234C8.2078 40.9179 8.36404 41.2929 8.64139 41.5703C8.91874 41.8476 9.29373 42.0039 9.68829 42H23.6613C24.0519 42 24.423 41.8437 24.7004 41.5664C24.9738 41.289 25.1262 40.914 25.1262 40.5234C25.1223 39.7148 24.4699 39.0625 23.6614 39.0586L9.6922 39.0585ZM40.0792 39.0585H40.0714C39.2628 39.0624 38.6105 39.7147 38.6066 40.5233C38.6066 40.9139 38.7589 41.2889 39.0363 41.5663C39.3097 41.8436 39.6808 41.9999 40.0715 41.9999H54.0445C54.4351 42.0038 54.8101 41.8475 55.0875 41.5702C55.3648 41.2929 55.5211 40.9179 55.5211 40.5233C55.5211 40.1327 55.3648 39.7616 55.0875 39.4842C54.8101 39.2108 54.4351 39.0545 54.0445 39.0584L40.0792 39.0585ZM70.4772 39.0585H70.4694C69.6608 39.0624 69.0046 39.7147 69.0046 40.5233C69.0046 40.9139 69.1569 41.2889 69.4304 41.5663C69.7038 41.8436 70.0788 41.9999 70.4695 41.9999H84.4385C84.833 42.0038 85.208 41.8475 85.4854 41.5702C85.7627 41.2928 85.919 40.9179 85.9151 40.5233C85.9151 40.1327 85.7588 39.7616 85.4815 39.4842C85.2041 39.2108 84.8291 39.0545 84.4385 39.0584L70.4772 39.0585ZM9.6882 51.3675C9.29367 51.3675 8.91867 51.5198 8.6413 51.7972C8.36396 52.0745 8.20771 52.4534 8.21161 52.8441C8.21161 53.2347 8.36786 53.6097 8.6452 53.8832C8.92254 54.1605 9.29754 54.3129 9.6882 54.3129H23.6612C24.4698 54.309 25.1221 53.6527 25.126 52.8441C25.1299 52.0316 24.4737 51.3714 23.6612 51.3675L9.6882 51.3675ZM40.0752 51.3675H40.0713C39.2588 51.3714 38.6025 52.0316 38.6065 52.8441C38.6104 53.6527 39.2627 54.3089 40.0713 54.3129H54.0443C54.4349 54.3129 54.8099 54.1606 55.0873 53.8832C55.3646 53.6098 55.5209 53.2348 55.5209 52.8441C55.5209 52.4534 55.3646 52.0746 55.0873 51.7972C54.81 51.5199 54.435 51.3675 54.0443 51.3675L40.0752 51.3675ZM70.4732 51.3675H70.4693C69.6568 51.3714 69.0005 52.0316 69.0045 52.8441C69.0045 53.6527 69.6608 54.3089 70.4693 54.3129H84.4383C84.8289 54.3129 85.2039 54.1606 85.4813 53.8832C85.7586 53.6098 85.9149 53.2348 85.9149 52.8441C85.9188 52.4535 85.7626 52.0746 85.4852 51.7972C85.2079 51.5199 84.8329 51.3675 84.4383 51.3675L70.4732 51.3675ZM9.6922 63.6875L9.68829 63.6914C9.29767 63.6875 8.92267 63.8398 8.64529 64.1172C8.36795 64.3906 8.2117 64.7656 8.2117 65.1563C8.2078 65.5469 8.36404 65.9219 8.64139 66.1993C8.91873 66.4766 9.29373 66.6329 9.68829 66.6329H23.6613C24.4738 66.629 25.1301 65.9649 25.1261 65.1563C25.1221 64.3476 24.4698 63.6915 23.6613 63.6915L9.6922 63.6875ZM40.0792 63.6875L40.0714 63.6914C39.2667 63.6914 38.6105 64.3477 38.6066 65.1562C38.6027 65.9648 39.2589 66.6289 40.0714 66.6328H54.0444C54.435 66.6328 54.81 66.4766 55.0874 66.1992C55.3647 65.9219 55.521 65.5469 55.521 65.1562C55.5171 64.7656 55.3608 64.3906 55.0835 64.1171C54.81 63.8398 54.435 63.6874 54.0444 63.6913L40.0792 63.6875ZM70.4772 63.6875L70.4694 63.6914C69.6608 63.6914 69.0085 64.3477 69.0046 65.1562C69.0007 65.9648 69.6569 66.6289 70.4694 66.6328H84.4384C84.8329 66.6328 85.2079 66.4766 85.4853 66.1992C85.7626 65.9219 85.9189 65.5469 85.915 65.1562C85.915 64.7656 85.7587 64.3906 85.4814 64.1171C85.204 63.8398 84.8291 63.6874 84.4384 63.6913L70.4772 63.6875Z" fill="currentColor"/>
  </svg>
);
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
              <th className="sticky top-0 z-20 bg-card h-12 px-3 text-left align-middle font-medium text-muted-foreground min-w-[100px]">Round</th>
              <th className="sticky top-0 left-0 z-30 bg-card h-12 px-3 text-left align-middle font-medium text-muted-foreground min-w-[100px]">Series</th>
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
                  <td className="bg-card p-3 align-middle font-body text-xs text-muted-foreground min-w-[100px]">
                    {showRound ? (() => {
                      const words = round.split(" ");
                      return words.length > 1 ? (
                        <span className="text-primary-foreground">{words[0]}<br />{words.slice(1).join(" ")}</span>
                      ) : <span className="text-primary-foreground">{round}</span>;
                    })() : ""}
                  </td>
                  <td className="sticky left-0 z-10 bg-card p-3 align-middle font-display tracking-wide whitespace-nowrap text-sm">
                    {getSeriesLabel(seriesId)}
                  </td>
                  {players.map((player) => {
                    const pick = pickMap.get(`${player}::${seriesId}`);
                    return (
                      <td key={player} className="p-3 align-middle text-center font-body text-xs whitespace-nowrap">
                        {pick ? (
                          <span>
                            <span className="font-bold text-foreground">{pick.winner}</span>
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
            {/* Score row */}
            <tr className="border-t-2 border-primary/30 bg-muted/30">
              <td className="bg-muted/30 p-3 align-middle font-body text-xs text-muted-foreground min-w-[100px]"></td>
              <td className="sticky left-0 z-10 bg-muted/30 p-3 align-middle font-display tracking-wide whitespace-nowrap text-sm text-primary">
                 Score
              </td>
              {players.map((player) => (
                <td key={player} className="p-3 align-middle text-center font-display text-base text-primary">
                  {playerScores.get(player) ?? 0}
                </td>
              ))}
            </tr>
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

  const viewTabs = (
    <div className="flex border-b border-border/40 mb-6">
      <button
        onClick={() => setShowAllPicks(false)}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-body text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
          !showAllPicks
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        <LayoutGrid size={16} />
        Points
      </button>
      <button
        onClick={() => setShowAllPicks(true)}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-body text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
          showAllPicks
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        <AllPicksIcon />
        All Picks
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-28">
      <HeroBanner title={"SCORE\nBOARD"} subtitle="NBA Playoffs 2026" />

      <section className="container py-8">
        {viewTabs}

        {showAllPicks ? (
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
        <Accordion type="single" collapsible className="mt-8">
          <AccordionItem value="scoring" className="bg-card rounded-lg px-5 py-0 border-none">
            <AccordionTrigger className="font-display text-sm tracking-wider text-foreground flex items-center gap-2 hover:no-underline py-4">
              <span className="flex items-center gap-2 text-sm">
                SCORING SYSTEM
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-body text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-display text-primary text-base w-6 text-right">3</span>
                  <span>Correct winner + correct game count on the right series</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-primary text-base w-6 text-right">2</span>
                  <span>Correct winner on the right series (wrong game count)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-primary text-base w-6 text-right">1</span>
                  <span>Picked a team that won, but assigned to the wrong series</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-primary text-base w-6 text-right">+4</span>
                  <span>Correctly predicted the NBA Finals champion</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <p className="text-center text-xs text-muted-foreground font-body mt-6">
          Scores update as playoff results come in
        </p>
      </section>
    </div>
  );
};

export default Scoreboard;
