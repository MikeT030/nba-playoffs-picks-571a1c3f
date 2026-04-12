import HeroBanner from "@/components/HeroBanner";
import MatchCard from "@/components/MatchCard";
import { usePlayoffGames } from "@/hooks/usePlayoffGames";

const Index = () => {
  const { data: matches, isLoading } = usePlayoffGames();

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner />

      <section className="container py-10">
        <h2 className="font-display text-3xl tracking-wider mb-6">
          Upcoming Matchups
        </h2>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border h-40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {matches?.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
