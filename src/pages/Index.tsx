import HeroBanner from "@/components/HeroBanner";
import MatchCard from "@/components/MatchCard";
import { matches } from "@/data/playoffsData";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroBanner />

      <section className="container py-10">
        <h2 className="font-display text-3xl tracking-wider mb-6">
          Upcoming Matchups
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
