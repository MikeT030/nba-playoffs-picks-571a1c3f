import { useState } from "react";
import { Link } from "react-router-dom";
import { PenLine } from "lucide-react";
import HeroBanner from "@/components/HeroBanner";
import MatchCard from "@/components/MatchCard";
import { usePlayoffGames } from "@/hooks/usePlayoffGames";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const rounds = [
  { value: "all", label: "All Rounds" },
  { value: "First Round", label: "First Round" },
  { value: "Conference Semifinals", label: "Conference Semifinals" },
  { value: "Conference Finals", label: "Conference Finals" },
  { value: "Finals", label: "Finals" },
];

const Index = () => {
  const { data: matches, isLoading } = usePlayoffGames();
  const [selectedRound, setSelectedRound] = useState("all");

  const filteredMatches =
    selectedRound === "all"
      ? matches
      : matches?.filter((m) => m.round === selectedRound);

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner />

      <section className="container py-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-3xl tracking-wider">
            Upcoming Matchups
          </h2>
          <Link
            to="/bets"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <PenLine size={16} />
            Make Your Bets
          </Link>
        </div>

        <Select value={selectedRound} onValueChange={setSelectedRound}>
          <SelectTrigger className="w-[220px] mb-6">
            <SelectValue placeholder="Select round" />
          </SelectTrigger>
          <SelectContent>
            {rounds.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border h-40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredMatches?.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
