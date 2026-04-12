import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { matches } from "@/data/playoffsData";

const MatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const match = matches.find((m) => m.id === id);

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Match not found.</p>
      </div>
    );
  }

  const seriesDots = (wins: number, color: string) =>
    Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="w-3 h-3 rounded-full border border-border"
        style={{
          backgroundColor: i < wins ? color : "transparent",
        }}
      />
    ));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${match.awayTeam.color}33 0%, transparent 50%, ${match.homeTeam.color}33 100%)`,
          }}
        />
        <div className="relative container py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Matchups
          </Link>

          <p className="text-xs text-primary font-body font-semibold uppercase tracking-widest mb-4">
            {match.round} · Game {match.gameNumber} · {match.date}
          </p>

          <div className="flex items-center justify-between gap-6">
            {/* Away */}
            <div className="flex-1 text-center">
              <span className="text-5xl md:text-6xl block mb-2">{match.awayTeam.logo}</span>
              <h2 className="font-display text-3xl md:text-4xl tracking-wider">
                {match.awayTeam.abbreviation}
              </h2>
              <p className="text-sm text-muted-foreground font-body mt-1">{match.awayTeam.name}</p>
              <div className="flex gap-1.5 justify-center mt-3">
                {seriesDots(match.awayWins, match.awayTeam.color)}
              </div>
            </div>

            {/* Score */}
            <div className="text-center">
              <div className="flex items-center gap-4">
                <span className="font-display text-5xl md:text-7xl">{match.awayWins}</span>
                <span className="text-muted-foreground font-display text-3xl">:</span>
                <span className="font-display text-5xl md:text-7xl">{match.homeWins}</span>
              </div>
              <p className="text-xs text-muted-foreground font-body mt-2 uppercase tracking-wider">
                Series
              </p>
            </div>

            {/* Home */}
            <div className="flex-1 text-center">
              <span className="text-5xl md:text-6xl block mb-2">{match.homeTeam.logo}</span>
              <h2 className="font-display text-3xl md:text-4xl tracking-wider">
                {match.homeTeam.abbreviation}
              </h2>
              <p className="text-sm text-muted-foreground font-body mt-1">{match.homeTeam.name}</p>
              <div className="flex gap-1.5 justify-center mt-3">
                {seriesDots(match.homeWins, match.homeTeam.color)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <section className="container py-10">
        <h3 className="font-display text-2xl tracking-wider mb-6">
          The Crew's Picks
        </h3>
        <div className="grid gap-3">
          {match.tips.map((tip) => {
            const pickedTeam =
              tip.pick === match.homeTeam.abbreviation ? match.homeTeam : match.awayTeam;
            return (
              <div
                key={tip.user}
                className="flex items-center gap-4 bg-card rounded-lg border border-border p-4"
              >
                <span className="text-2xl">{tip.avatar}</span>
                <div className="flex-1">
                  <p className="font-body font-semibold">{tip.user}</p>
                  <p className="text-sm text-muted-foreground font-body">
                    Picks{" "}
                    <span
                      className="font-semibold"
                      style={{ color: pickedTeam.color }}
                    >
                      {pickedTeam.abbreviation}
                    </span>{" "}
                    in {tip.gamesInSeries}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl">{pickedTeam.logo}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default MatchDetail;
