import { useState, useEffect } from "react";
import { PenLine } from "lucide-react";
import HeroBanner from "@/components/HeroBanner";
import MatchCard from "@/components/MatchCard";
import BetsDrawer from "@/components/BetsDrawer";
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
  const [betsOpen, setBetsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBetsOpen(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredMatches =
    selectedRound === "all"
      ? matches
      : matches?.filter((m) => m.round === selectedRound);

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner />

      <section className="container py-10">
        <button
          onClick={() => setBetsOpen(true)}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-colors mb-6"
        >
          <PenLine size={16} />
          Make Your Bets
        </button>

        <h2 className="font-display text-3xl tracking-wider mb-4">
          Upcoming Matchups
        </h2>

        <Select value={selectedRound} onValueChange={setSelectedRound}>
          <SelectTrigger className="w-[220px] mb-6">
            <SelectValue placeholder="Select round" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
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
          <>
            {(selectedRound !== "Finals" ? ["East", "West"] : ["Finals"]).map((conf) => {
              const confMatches = filteredMatches?.filter((m) => m.conference === conf);
              if (!confMatches?.length) return null;
              return (
                <div key={conf} className="mb-8">
                  {conf !== "Finals" && (
                    <h3 className="font-display text-lg tracking-wider text-foreground mb-3">
                      {conf === "East" ? "Eastern Conference" : "Western Conference"}
                    </h3>
                  )}
                  <div className="grid gap-4 md:grid-cols-2">
                    {confMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </section>

      <BetsDrawer open={betsOpen} onOpenChange={setBetsOpen} />
    </div>
  );
};

export default Index;
