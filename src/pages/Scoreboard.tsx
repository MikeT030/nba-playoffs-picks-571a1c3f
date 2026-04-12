import { Trophy, Star } from "lucide-react";
import HeroBanner from "@/components/HeroBanner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  perfectPicks: number; // 3pt picks
  winnerPicks: number;  // 2pt picks
  loosePicks: number;   // 1pt picks
  championBonus: boolean;
  totalPoints: number;
}

const getScoreboard = (): ParticipantScore[] => {
  // TODO: Calculate from stored bets vs actual results
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

const Scoreboard = () => {
  const scoreboard = getScoreboard();

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner title="SCOREBOARD" subtitle="NBA Playoffs 2026" />

      <section className="container py-8">

        {/* Leaderboard */}
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
