import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LayoutGrid, ChevronLeft, ChevronRight, Download } from "lucide-react";
import allPicksIcon from "@/assets/all-picks-icon.svg";

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
import { bracketSeries, type BracketSeries } from "@/data/playoffsData";
import { useBracketData } from "@/hooks/useBracketData";
import { playerImages } from "@/lib/playerImages";
import { playerCards } from "@/data/playerCards";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import PlayerCard from "@/components/PlayerCard";



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
  return <span className="text-muted-foreground font-body text-sm w-[18px] text-center inline-block">{index + 1}</span>;
};

// Build a label for each series like "OKC-HOU"
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

interface AllPicksMatrixProps {
  picks: PickRow[];
  results: SeriesResult[];
  loading: boolean;
}

const AllPicksMatrix = ({ picks, results, loading }: AllPicksMatrixProps) => {
  const { data: resolvedBracket } = useBracketData();
  const seriesList = resolvedBracket ?? bracketSeries;

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
    const ra = roundOrder.indexOf(getSeriesRound(a, seriesList));
    const rb = roundOrder.indexOf(getSeriesRound(b, seriesList));
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
          <thead>
            <tr>
              <th className="sticky top-0 z-20 bg-[#1A1E24]/90 backdrop-blur-md h-12 px-3 text-left align-middle font-medium text-muted-foreground min-w-[100px]">Round</th>
              <th className="sticky top-0 left-0 z-30 bg-[#1A1E24]/90 backdrop-blur-md h-12 px-3 text-left align-middle font-medium text-muted-foreground min-w-[100px]">Series</th>
              {players.map((player) => (
                <th key={player} className="sticky top-0 z-20 bg-[#1A1E24]/90 backdrop-blur-md h-12 px-3 text-center align-middle font-medium text-muted-foreground min-w-[90px] whitespace-nowrap">
                  {player}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orderedSeries.map((seriesId) => {
              const round = getSeriesRound(seriesId, seriesList);
              const showRound = round !== lastRound;
              lastRound = round;

              return (
                <tr key={seriesId} className="transition-colors hover:bg-muted/50">
                  <td className="bg-[#1A1E24]/60 backdrop-blur-sm p-3 align-middle font-body text-xs text-muted-foreground min-w-[100px]">
                    {showRound ? (() => {
                      const words = round.split(" ");
                      return words.length > 1 ? (
                        <span className="text-primary-foreground">{words[0]}<br />{words.slice(1).join(" ")}</span>
                      ) : <span className="text-primary-foreground">{round}</span>;
                    })() : ""}
                  </td>
                  <td className="sticky left-0 z-10 bg-[#1A1E24]/80 backdrop-blur-sm p-3 align-middle font-display tracking-wide whitespace-nowrap text-sm">
                    {getSeriesLabel(seriesId, seriesList)}
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
            <tr className="bg-[#1A1E24]/40">
              <td className="bg-[#1A1E24]/30 p-3 align-middle font-body text-xs text-muted-foreground min-w-[100px]"></td>
              <td className="sticky left-0 z-10 bg-[#1A1E24]/50 backdrop-blur-sm p-3 align-middle font-display tracking-wide whitespace-nowrap text-sm text-primary">
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

function exportAllPicksToExcel(
  picks: PickRow[],
  results: SeriesResult[],
  seriesList: BracketSeries[]
) {
  if (picks.length === 0) return;

  const players = [...new Set(picks.map((p) => p.profile_name))].sort((a, b) =>
    a.localeCompare(b)
  );
  const seriesIds = [...new Set(picks.map((p) => p.series_id))];
  const orderedSeries = seriesIds.sort((a, b) => {
    const ra = roundOrder.indexOf(getSeriesRound(a, seriesList));
    const rb = roundOrder.indexOf(getSeriesRound(b, seriesList));
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });

  const pickMap = new Map<string, PickRow>();
  for (const p of picks) pickMap.set(`${p.profile_name}::${p.series_id}`, p);

  const playerScores = new Map<string, number>();
  for (const s of computeScoreboard(picks, results)) {
    playerScores.set(s.name, s.totalPoints);
  }

  const header = ["Round", "Series", ...players];
  const rows: (string | number)[][] = [header];
  let lastRound = "";
  for (const seriesId of orderedSeries) {
    const round = getSeriesRound(seriesId, seriesList);
    const showRound = round !== lastRound;
    lastRound = round;
    const row: (string | number)[] = [
      showRound ? round : "",
      getSeriesLabel(seriesId, seriesList),
    ];
    for (const player of players) {
      const pick = pickMap.get(`${player}::${seriesId}`);
      row.push(pick ? `${pick.winner} in ${pick.games_in_series}` : "—");
    }
    rows.push(row);
  }
  rows.push(["", "Score", ...players.map((p) => playerScores.get(p) ?? 0)]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 20 },
    { wch: 14 },
    ...players.map(() => ({ wch: 14 })),
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "All Picks");
  XLSX.writeFile(wb, "nba-playoffs-all-picks.xlsx");
}

const Scoreboard = () => {
  const [showAllPicks, setShowAllPicks] = useState(false);
  const [scoreboard, setScoreboard] = useState<ParticipantScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardMap, setCardMap] = useState<Record<string, string>>({});
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [allPicks, setAllPicks] = useState<PickRow[]>([]);
  const [allResults, setAllResults] = useState<SeriesResult[]>([]);
  const { data: resolvedBracket } = useBracketData();
  const seriesListForExport = resolvedBracket ?? bracketSeries;

  // Build list of players with cards for navigation
  const playersWithCards = scoreboard
    .map((p) => {
      const cardId = cardMap[p.name];
      const card = cardId ? playerCards.find((c) => c.id === cardId) : null;
      return card ? { name: p.name, card } : null;
    })
    .filter(Boolean) as { name: string; card: (typeof playerCards)[0] }[];

  const openCardDialog = (playerName: string) => {
    const idx = playersWithCards.findIndex((p) => p.name === playerName);
    if (idx >= 0) {
      setSelectedCardIndex(idx);
      setCardDialogOpen(true);
    }
  };

  useEffect(() => {
    const fetchScores = async () => {
      const [picksRes, resultsRes, profilesRes, cardsRes] = await Promise.all([
        supabase.from("picks").select("profile_name, series_id, winner, games_in_series, user_id"),
        supabase.from("series_results").select("series_id, winner, games_played"),
        supabase.from("profiles").select("user_id, display_name"),
        supabase.from("player_card_assignments").select("user_id, card_id"),
      ]);
      const activeUserIds = new Set((profilesRes.data || []).map((p: any) => p.user_id));
      const picks = ((picksRes.data || []) as (PickRow & { user_id: string })[]).filter(p => activeUserIds.has(p.user_id));
      const results = (resultsRes.data || []) as SeriesResult[];
      setScoreboard(computeScoreboard(picks, results));
      setAllPicks(picks);
      setAllResults(results);

      // Build name -> card_id map via user_id
      const userToName = new Map<string, string>();
      for (const p of picks) userToName.set(p.user_id, p.profile_name);
      const nameToCard: Record<string, string> = {};
      for (const c of (cardsRes.data || [])) {
        const name = userToName.get(c.user_id);
        if (name) nameToCard[name] = c.card_id;
      }
      setCardMap(nameToCard);

      setLoading(false);
    };
    fetchScores();
  }, []);


  const viewTabs = (
    <div className="flex border-b border-border/40 mb-11">
      <button
        onClick={() => setShowAllPicks(false)}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-body text-base font-medium transition-all duration-200 border-b-2 -mb-px ${
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
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-body text-base font-medium transition-all duration-200 border-b-2 -mb-px ${
          showAllPicks
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        <span
          aria-label="All Picks"
          className="w-4 h-4 bg-current"
          style={{
            WebkitMaskImage: `url(${allPicksIcon})`,
            maskImage: `url(${allPicksIcon})`,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "contain",
            maskSize: "contain",
          }}
        />
        All Picks
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-28">
      <HeroBanner title={"SCORE\nBOARD"} subtitle="2026 Playoffs Picks" />

      <section className="container py-8">
        {viewTabs}

        {showAllPicks ? (
          <>
            <div className="rounded-lg border border-white/10 bg-[#191d24] backdrop-blur-md overflow-hidden pt-0">
              <AllPicksMatrix picks={allPicks} results={allResults} loading={loading} />
            </div>
            {allPicks.length > 0 && (
              <div className="flex justify-start mt-3">
                <button
                  onClick={() => exportAllPicksToExcel(allPicks, allResults, seriesListForExport)}
                  className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  <Download size={14} />
                  Download as Excel
                </button>
              </div>
            )}
          </>
        ) : (
          /* Leaderboard */
          <div className="rounded-lg bg-[#191d24] overflow-hidden">
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
                  <TableRow key={player.name} className="cursor-pointer border-b-[#2B2F37]" onClick={() => openCardDialog(player.name)}>
                    <TableCell>{getRankIcon(i)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {(() => {
                          const cardId = cardMap[player.name];
                          const card = cardId ? playerCards.find(c => c.id === cardId) : null;
                          const imgSrc = card ? playerImages[card.image] : null;
                          return (
                            <Avatar className="h-8 w-8 border border-border/40">
                              {imgSrc ? (
                                <AvatarImage src={imgSrc} alt={player.name} className="object-cover object-top" />
                              ) : (
                                <AvatarFallback className="text-xs bg-muted">{player.name.charAt(0)}</AvatarFallback>
                              )}
                            </Avatar>
                          );
                        })()}
                        <span className="font-body font-medium text-foreground">{player.name}</span>
                      </div>
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
          <AccordionItem value="scoring" className="rounded-lg border border-white/10 bg-[#22272E]/80 backdrop-blur-md px-5 py-0 border-none">
            <AccordionTrigger className="font-display text-sm tracking-wider text-foreground flex items-center gap-2 hover:no-underline py-4">
              <span className="flex items-center gap-2 text-base">
                SCORING SYSTEM
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-body text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-display text-primary text-base w-auto text-right whitespace-nowrap">3 pts</span>
                  <span className="text-foreground">Correct winner + correct game count on the right series</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-primary text-base w-auto text-right whitespace-nowrap">2 pts</span>
                  <span className="text-foreground">Correct winner on the right series (wrong game count)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-primary text-base w-auto text-right whitespace-nowrap">1 pt</span>
                  <span className="text-foreground">Picked a team that won, but assigned to the wrong series</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-primary text-base w-auto text-right whitespace-nowrap">4 pts</span>
                  <span className="text-foreground">Correctly predicted the Supreme Finals champion</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <p className="text-center text-xs text-muted-foreground font-body mt-6">
          Scores update as playoff results come in
        </p>
      </section>

      {/* Player Card Drawer */}
      <Drawer open={cardDialogOpen} onOpenChange={setCardDialogOpen}>
        <DrawerContent className="h-[92vh] border-none">
          <div className="flex-1 flex items-center justify-center overflow-hidden px-4 pb-8 pt-4">
            {playersWithCards.length > 0 && (
              <div
                className="flex flex-col items-center gap-3 mx-auto w-full max-w-[359px] touch-pan-y select-none"
                onTouchStart={(e) => {
                  (e.currentTarget as any)._touchStartX = e.touches[0].clientX;
                  (e.currentTarget as any)._touchStartY = e.touches[0].clientY;
                }}
                onTouchEnd={(e) => {
                  const startX = (e.currentTarget as any)._touchStartX;
                  const startY = (e.currentTarget as any)._touchStartY;
                  if (startX == null) return;
                  const dx = e.changedTouches[0].clientX - startX;
                  const dy = e.changedTouches[0].clientY - startY;
                  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && playersWithCards.length > 1) {
                    if (dx < 0) {
                      setSelectedCardIndex((prev) => (prev + 1) % playersWithCards.length);
                    } else {
                      setSelectedCardIndex((prev) => (prev - 1 + playersWithCards.length) % playersWithCards.length);
                    }
                  }
                }}
              >
                {/* Username */}
                <p className="font-display text-lg tracking-wider text-foreground text-center">
                  {playersWithCards[selectedCardIndex]?.name}
                </p>

                {/* Card */}
                <div className="relative w-full">
                  <PlayerCard player={playersWithCards[selectedCardIndex]?.card} />
                </div>

                {/* Dots indicator */}
                {playersWithCards.length > 1 && (
                  <div className="flex gap-1.5">
                    {playersWithCards.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedCardIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${i === selectedCardIndex ? "bg-primary" : "bg-white/30"}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Scoreboard;
