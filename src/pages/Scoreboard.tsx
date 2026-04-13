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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const participants = [
  { name: "Erik", avatar: "🎣" },
  { name: "Alexander", avatar: "😎" },
  { name: "David", avatar: "🎬" },
  { name: "Fabian", avatar: "🏔️" },
  { name: "Hannes", avatar: "🌄" },
  { name: "Jörn", avatar: "🎿" },
  { name: "Larsn", avatar: "🐕" },
  { name: "Michi", avatar: "🎸" },
  { name: "Momentum", avatar: "🚀" },
  { name: "Simon", avatar: "📡" },
  { name: "Sven", avatar: "🐶" },
];

// Scoring system:
// 3 pts - correct winner + correct score from correct match
// 2 pts - correct winner from correct match (wrong score)
// 1 pt  - correct winner from wrong match
// 4 pts - correct champion bonus

interface ParticipantScore {
  name: string;
  avatar: string;
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

const roundOrder = ["First Round", "Conference Semifinals", "Conference Finals", "Finals"];

const getScoreboard = (): ParticipantScore[] => {
  return participants
    .map((p) => ({
      name: p.name,
      avatar: p.avatar,
      perfectPicks: 0,
      winnerPicks: 0,
      loosePicks: 0,
      championBonus: false,
      totalPoints: 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));
};

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("picks")
        .select("profile_name, series_id, winner, games_in_series");
      if (data) setPicks(data);
      setLoading(false);
    };
    fetch();
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

  // Build lookup: player+series -> pick
  const pickMap = new Map<string, PickRow>();
  for (const p of picks) {
    pickMap.set(`${p.profile_name}::${p.series_id}`, p);
  }

  // Group series by round for row headers
  let lastRound = "";

  return (
    <ScrollArea className="w-full max-h-[60vh]" type="always">
      <div className="min-w-max">
        <table className="w-full caption-bottom text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-20 bg-card min-w-[100px]">Round</TableHead>
              <TableHead className="sticky left-[100px] z-20 bg-card min-w-[100px]">Series</TableHead>
              {players.map((player) => (
                <TableHead key={player} className="text-center min-w-[90px] whitespace-nowrap">
                  {player}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderedSeries.map((seriesId) => {
              const round = getSeriesRound(seriesId);
              const showRound = round !== lastRound;
              lastRound = round;

              return (
                <TableRow key={seriesId}>
                  <TableCell className="sticky left-0 z-10 bg-card font-body text-xs text-muted-foreground whitespace-nowrap">
                    {showRound ? round : ""}
                  </TableCell>
                  <TableCell className="sticky left-[100px] z-10 bg-card font-display text-xs tracking-wide whitespace-nowrap">
                    {getSeriesLabel(seriesId)}
                  </TableCell>
                  {players.map((player) => {
                    const pick = pickMap.get(`${player}::${seriesId}`);
                    return (
                      <TableCell key={player} className="text-center font-body text-xs whitespace-nowrap">
                        {pick ? (
                          <span>
                            <span className="font-medium text-foreground">{pick.winner}</span>
                            <span className="text-muted-foreground ml-1">{pick.games_in_series}g</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

const Scoreboard = () => {
  const scoreboard = getScoreboard();
  const [showAllPicks, setShowAllPicks] = useState(false);

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
