import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePlayoffGames } from "@/hooks/usePlayoffGames";
import { useBracketData } from "@/hooks/useBracketData";
import TeamLogo from "@/components/TeamLogo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const MatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: matches, isLoading } = usePlayoffGames();
  const { data: bracketData } = useBracketData();
  const match = matches?.find((m) => m.id === id);

  // Map the API match id (e.g. "atl-nyk") to the bracket series_id (e.g. "east-r1-3v6")
  const bracketSeriesId = useMemo(() => {
    if (!match || !bracketData) return null;
    const teamSet = new Set([match.homeTeam.abbreviation, match.awayTeam.abbreviation]);
    const found = bracketData.find(
      (s) => s.topTeam && s.bottomTeam && teamSet.has(s.topTeam.abbreviation) && teamSet.has(s.bottomTeam.abbreviation)
    );
    return found?.id ?? null;
  }, [match, bracketData]);

  const { data: userPick } = useQuery({
    queryKey: ["user-pick", bracketSeriesId, user?.id],
    queryFn: async () => {
      if (!user || !bracketSeriesId) return null;
      const { data } = await supabase
        .from("picks")
        .select("winner, games_in_series")
        .eq("user_id", user.id)
        .eq("series_id", bracketSeriesId)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!bracketSeriesId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Match not found.</p>
        <Link to="/" className="text-primary font-body text-sm hover:underline">← Back to Matchups</Link>
      </div>
    );
  }

  const seriesDots = (wins: number, color: string) =>
    Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="w-3 h-3 rounded-full border border-border"
        style={{ backgroundColor: i < wins ? color : "transparent" }}
      />
    ));

  return (
    <div className="min-h-screen bg-background">
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
            <div className="flex-1 text-center flex flex-col items-center">
              <TeamLogo src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-16 h-16 md:w-20 md:h-20" />
              <h2 className="font-display text-3xl md:text-4xl tracking-wider mt-2">
                {match.awayTeam.abbreviation}
              </h2>
              <p className="text-sm text-muted-foreground font-body mt-1">{match.awayTeam.name}</p>
              <div className="flex gap-1.5 justify-center mt-3">
                {seriesDots(match.awayWins, match.awayTeam.color)}
              </div>
            </div>

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

            <div className="flex-1 text-center flex flex-col items-center">
              <TeamLogo src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-16 h-16 md:w-20 md:h-20" />
              <h2 className="font-display text-3xl md:text-4xl tracking-wider mt-2">
                {match.homeTeam.abbreviation}
              </h2>
              <p className="text-sm text-muted-foreground font-body mt-1">{match.homeTeam.name}</p>
              <div className="flex gap-1.5 justify-center mt-3">
                {seriesDots(match.homeWins, match.homeTeam.color)}
              </div>
            </div>
          </div>

          {user && userPick && (() => {
            const pickedTeam = userPick.winner === match.homeTeam.abbreviation ? match.homeTeam : match.awayTeam;
            return (
              <div className="mt-6 flex items-center justify-center gap-3 bg-card/60 backdrop-blur rounded-lg px-4 py-3">
                <span className="text-xs text-muted-foreground font-body uppercase tracking-wider">Your Pick</span>
                <TeamLogo src={pickedTeam.logo} alt={pickedTeam.name} className="w-5 h-5" />
                <span className="font-body font-semibold text-sm" style={{ color: pickedTeam.color }}>
                  {pickedTeam.abbreviation}
                </span>
                <span className="text-xs text-muted-foreground font-body">in {userPick.games_in_series}</span>
              </div>
            );
          })()}
        </div>
      </div>

      <section className="container py-10">
        <h3 className="font-display text-2xl tracking-wider mb-6">
          Picks from the others
        </h3>
        <div className="grid gap-3">
          {match.tips.map((tip) => {
            const pickedTeam =
              tip.pick === match.homeTeam.abbreviation ? match.homeTeam : match.awayTeam;
            return (
              <div
                key={tip.user}
                className="flex items-center gap-4 bg-card rounded-lg p-4"
              >
                
                <div className="flex-1">
                  <p className="font-body font-semibold">{tip.user}</p>
                  <p className="text-sm text-muted-foreground font-body">
                    Picks{" "}
                    <span className="font-semibold" style={{ color: pickedTeam.color }}>
                      {pickedTeam.abbreviation}
                    </span>{" "}
                    in {tip.gamesInSeries}
                  </p>
                </div>
                <TeamLogo src={pickedTeam.logo} alt={pickedTeam.name} className="w-8 h-8" />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default MatchDetail;
