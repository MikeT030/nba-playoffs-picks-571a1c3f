import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LayoutGrid, ChevronLeft, ChevronRight, Download } from "lucide-react";
import allPicksIcon from "@/assets/all-picks-icon.svg";

import HeroBannerMinimal from "@/components/HeroBannerMinimal";
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
import { useDetectedSeriesResults } from "@/hooks/useDetectedSeriesResults";
import { playerImages } from "@/lib/playerImages";
import { playerCards } from "@/data/playerCards";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import PlayerCard from "@/components/PlayerCard";
import { ScoreRibbon } from "@/components/DemoVisualScoreboard";



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
  return `${top} – ${bot}`;
}

// Render a series label with current series wins shown per team. If the
// series is decided, the loser is struck through. `live` carries
// auto-detected per-team wins from the NBA feed and is used whenever it's
// available (covers in-progress series too).
function renderSeriesLabel(
  seriesId: string,
  seriesList: BracketSeries[],
  result: SeriesResult | undefined,
  live: { topWins: number; bottomWins: number; winner: string | null } | undefined,
) {
  const s = seriesList.find((b) => b.id === seriesId);
  const top = s?.topTeam?.abbreviation || "TBD";
  const bot = s?.bottomTeam?.abbreviation || "TBD";

  // Prefer live detected wins; fall back to the confirmed result; finally show plain label.
  let topWins: number | null = null;
  let botWins: number | null = null;
  let winner: string | null = null;

  if (live && (live.topWins > 0 || live.bottomWins > 0 || live.winner)) {
    topWins = live.topWins;
    botWins = live.bottomWins;
    winner = live.winner;
  } else if (result && (result.winner === top || result.winner === bot)) {
    const winnerWins = 4;
    const loserWins = Math.max(0, result.games_played - 4);
    const topIsWinner = result.winner === top;
    topWins = topIsWinner ? winnerWins : loserWins;
    botWins = topIsWinner ? loserWins : winnerWins;
    winner = result.winner;
  }

  if (topWins === null || botWins === null) {
    return <>{`${top}-${bot}`}</>;
  }

  const topCls = winner && winner !== top ? "line-through text-muted-foreground" : "";
  const botCls = winner && winner !== bot ? "line-through text-muted-foreground" : "";

  return (
    <>
      <span className={topCls}>{top} {topWins}</span>
      <span> – </span>
      <span className={botCls}>{bot} {botWins}</span>
    </>
  );
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
  const { data: detected } = useDetectedSeriesResults();
  const liveMap = useMemo(() => {
    const m = new Map<string, { topWins: number; bottomWins: number; winner: string | null }>();
    for (const d of detected ?? []) {
      m.set(d.series_id, {
        topWins: d.topWins,
        bottomWins: d.bottomWins,
        winner: d.detectedWinner,
      });
    }
    return m;
  }, [detected]);

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

  // Result lookup + actual-winner set for per-cell point scoring
  const resultMap = new Map<string, SeriesResult>();
  for (const r of results) resultMap.set(r.series_id, r);
  const actualWinnerSet = new Set(results.map((r) => r.winner));

  const POINTS_COLOR: Record<number, string> = {
    3: "text-emerald-400",
    2: "text-sky-400",
    1: "text-amber-400",
    0: "text-muted-foreground/50",
  };

  function scorePick(pick: PickRow): { basePoints: number; championBonus: boolean } | null {
    const result = resultMap.get(pick.series_id);
    if (!result) return null; // series not decided yet
    let basePoints = 0;
    if (result.winner === pick.winner) {
      basePoints = result.games_played === pick.games_in_series ? 3 : 2;
    } else if (actualWinnerSet.has(pick.winner)) {
      basePoints = 1;
    }
    const championBonus =
      pick.series_id === "nba-finals" && result.winner === pick.winner;
    return { basePoints, championBonus };
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
                    {renderSeriesLabel(seriesId, seriesList, resultMap.get(seriesId), liveMap.get(seriesId))}
                  </td>
                  {players.map((player) => {
                    const pick = pickMap.get(`${player}::${seriesId}`);
                    if (!pick) {
                      return (
                        <td key={player} className="p-3 align-middle text-center font-body text-xs whitespace-nowrap">
                          <span className="text-muted-foreground/40">—</span>
                        </td>
                      );
                    }
                    const score = scorePick(pick);
                    const total = score
                      ? score.basePoints + (score.championBonus ? 4 : 0)
                      : null;
                    const colorCls = score ? POINTS_COLOR[score.basePoints] ?? "" : "";
                    return (
                      <td key={player} className="p-3 align-middle text-center font-body text-xs whitespace-nowrap">
                        <div className="inline-flex items-baseline gap-1.5">
                          <span>
                            <span className="font-bold text-foreground">{pick.winner}</span>
                            <span className="ml-1 text-white">in {pick.games_in_series}</span>
                          </span>
                          {score && (
                            <span className={`font-display text-sm ${colorCls}`}>
                              {total}
                              {score.championBonus && (
                                <span className="ml-0.5 text-[9px] font-body text-amber-300/80 align-top">
                                  +4
                                </span>
                              )}
                            </span>
                          )}
                        </div>
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


  return (
    <div className="min-h-screen bg-background pb-28">
      <HeroBannerMinimal title="Leaderboard" />

      <section className="container py-8 space-y-10">
        {/* Points section */}
        <div className="space-y-4">
          <h2 className="font-display tracking-wider text-foreground text-2xl">
            the facts
          </h2>
          <div className="space-y-3">
            {(() => {
              const ranks: number[] = [];
              scoreboard.forEach((p, i) => {
                if (i > 0 && p.totalPoints === scoreboard[i - 1].totalPoints) ranks.push(ranks[i - 1]);
                else ranks.push(i + 1);
              });
              return scoreboard.map((player, i) => (
                <button
                  key={player.name}
                  onClick={() => openCardDialog(player.name)}
                  className={`block w-full text-left transition-transform active:scale-[0.99] hover:brightness-110 ${i % 2 === 1 ? "brightness-[1.25]" : ""}`}
                >
                  <ScoreRibbon
                    row={{
                      name: player.name,
                      totalPoints: player.totalPoints,
                      cardId: cardMap[player.name],
                    }}
                    rank={i}
                    totalPlayers={scoreboard.length}
                    displayRank={ranks[i]}
                  />
                </button>
              ));
            })()}
          </div>
        </div>

        {/* All Picks section */}
        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="all-picks" className="border-none group">
            <AccordionTrigger className="w-full font-display tracking-wider text-foreground text-2xl hover:no-underline py-0 flex-col items-stretch gap-4 relative [&>svg]:absolute [&>svg]:right-0 [&>svg]:top-1 [&>svg]:h-6 [&>svg]:w-6 [&>svg]:z-10">
              <span className="flex items-center w-full pr-8">
                All Picks
              </span>

              {/* Teaser preview — visible only when accordion is closed */}
              <div className="group-data-[state=open]:hidden relative w-full max-w-full rounded-lg border border-white/10 bg-[#191d24] backdrop-blur-md overflow-hidden select-none">
                <div className="max-h-[110px] w-full max-w-full overflow-hidden pointer-events-none [&>div]:!overflow-hidden">
                  <AllPicksMatrix picks={allPicks} results={allResults} loading={loading} />
                </div>
                {/* Gradient fade overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(180deg, hsl(var(--background) / 0) 0%, hsl(var(--background) / 0.15) 35%, hsl(var(--background) / 0.75) 75%, hsl(var(--background)) 100%)",
                  }}
                />
              </div>
            </AccordionTrigger>

            <AccordionContent className="pt-4 pb-0">
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

            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Scoring system (standalone, no accordion) */}
        <div className="space-y-4">
          <h2 className="font-display tracking-wider text-foreground text-2xl">
            Scoring System
          </h2>
          <div className="rounded-lg border border-white/10 bg-transparent px-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-body text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-display text-primary text-base w-auto text-right whitespace-nowrap">3 pts</span>
                <span className="text-foreground pl-[10px]">Correct winner + correct game count on the right series</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-primary text-base w-auto text-right whitespace-nowrap">2 pts</span>
                <span className="text-foreground pl-[10px]">Correct winner on the right series (wrong game count)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-primary text-base w-auto text-right whitespace-nowrap">1 pt</span>
                <span className="text-foreground pl-[10px]">Picked a team that won, but assigned to the wrong series</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-primary text-base w-auto text-right whitespace-nowrap">4 pts</span>
                <span className="text-foreground pl-[10px]">Correctly predicted Finals champion</span>
              </div>
            </div>
          </div>
        </div>

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
                className="flex flex-col items-center gap-3 mx-auto w-full max-w-[352px] touch-pan-y select-none"
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
