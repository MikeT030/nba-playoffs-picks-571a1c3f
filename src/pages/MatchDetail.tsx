import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { usePlayoffGames } from "@/hooks/usePlayoffGames";
import { useBracketData } from "@/hooks/useBracketData";
import { useSeriesGames } from "@/hooks/useSeriesGames";
import TeamLogo from "@/components/TeamLogo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useEffect, useState, useRef, useCallback } from "react";

const MatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: matches, isLoading } = usePlayoffGames();
  const { data: bracketData } = useBracketData();
  const match = matches?.find((m) => m.id === id);

  // Series games – only CHA vs MIA has per-game data for now
  const seriesGames: SeriesGame[] | null = id === "cha-mia" ? chaMiaSeriesGames : null;
  const [activeGameIdx, setActiveGameIdx] = useState(0);

  // Default to latest game
  useEffect(() => {
    if (seriesGames) setActiveGameIdx(seriesGames.length - 1);
  }, [seriesGames?.length]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Swipe handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!seriesGames) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (diff > threshold && activeGameIdx < seriesGames.length - 1) {
      setActiveGameIdx((i) => i + 1);
    } else if (diff < -threshold && activeGameIdx > 0) {
      setActiveGameIdx((i) => i - 1);
    }
  }, [seriesGames, activeGameIdx]);

  // Map the API match id to the bracket series_id
  const bracketSeriesId = useMemo(() => {
    if (!match) return null;
    if (!bracketData) return match.id;
    const teamSet = new Set([match.homeTeam.abbreviation, match.awayTeam.abbreviation]);
    const found = bracketData.find(
      (s) => s.topTeam && s.bottomTeam && teamSet.has(s.topTeam.abbreviation) && teamSet.has(s.bottomTeam.abbreviation)
    );
    if (found) return found.id;
    const partial = bracketData.find(
      (s) => s.topTeam && s.bottomTeam && (teamSet.has(s.topTeam.abbreviation) || teamSet.has(s.bottomTeam.abbreviation))
    );
    return partial?.id ?? match.id;
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

  const { data: seriesResult } = useQuery({
    queryKey: ["series-result", bracketSeriesId],
    queryFn: async () => {
      if (!bracketSeriesId) return null;
      const { data } = await supabase
        .from("series_results")
        .select("series_id, winner, games_played")
        .eq("series_id", bracketSeriesId)
        .maybeSingle();
      return data;
    },
    enabled: !!bracketSeriesId,
  });

  const computePickPoints = (pick: { winner: string; games_in_series: number }) => {
    if (!seriesResult) return null;
    if (seriesResult.winner === pick.winner) {
      return seriesResult.games_played === pick.games_in_series ? 3 : 2;
    }
    return 0;
  };

  const { data: allPicks } = useQuery({
    queryKey: ["series-picks", bracketSeriesId],
    queryFn: async () => {
      if (!bracketSeriesId) return [];
      const { data } = await supabase
        .from("picks")
        .select("winner, games_in_series, profile_name, user_id")
        .eq("series_id", bracketSeriesId);
      return data ?? [];
    },
    enabled: !!bracketSeriesId,
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

  // Determine display data: use per-game data if available, otherwise series-level
  const activeGame = seriesGames ? seriesGames[activeGameIdx] : null;
  const displayHome = activeGame ? activeGame.homeTeam : match.homeTeam;
  const displayAway = activeGame ? activeGame.awayTeam : match.awayTeam;
  const displayHomeScore = activeGame ? activeGame.homeScore : match.homeScore;
  const displayAwayScore = activeGame ? activeGame.awayScore : match.awayScore;
  const displayStatus = activeGame ? activeGame.status : match.status;
  const displayDate = activeGame ? activeGame.date : match.date;
  const displayGameNum = activeGame ? activeGame.gameNumber : match.gameNumber;
  const displaySeriesAway = activeGame ? activeGame.seriesRecord[0] : match.awayWins;
  const displaySeriesHome = activeGame ? activeGame.seriesRecord[1] : match.homeWins;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div
        className="relative overflow-hidden"
        onTouchStart={seriesGames ? handleTouchStart : undefined}
        onTouchMove={seriesGames ? handleTouchMove : undefined}
        onTouchEnd={seriesGames ? handleTouchEnd : undefined}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${displayAway.color}66 0%, transparent 50%, ${displayHome.color}66 100%)`,
          }}
        />
        <div className="relative container py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <p className="text-xs text-primary font-body font-semibold uppercase tracking-widest mb-4 text-center">
            {match.round} · Game {displayGameNum} · {displayDate}
          </p>

          <div className="flex items-center justify-between gap-6 pt-[4px]">
            {/* Left arrow for desktop */}
            {seriesGames && (
              <button
                onClick={() => setActiveGameIdx((i) => Math.max(0, i - 1))}
                disabled={activeGameIdx === 0}
                className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-card/50 text-foreground disabled:opacity-20 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <div className="flex-1 text-center flex flex-col items-center">
              <TeamLogo src={displayAway.logo} alt={displayAway.name} className="w-16 h-16 md:w-20 md:h-20" />
              <h2 className="font-display text-3xl md:text-4xl tracking-wider mt-2">
                {displayAway.abbreviation}
              </h2>
            </div>

            <div className="text-center">
              {displayStatus === "live" && (
                <span className="text-[10px] text-loss font-body font-semibold uppercase tracking-widest animate-pulse -mt-6">
                  Live
                </span>
              )}
              {displayStatus === "final" && (
                <span className="text-[10px] text-muted-foreground font-body font-semibold uppercase tracking-widest -mt-6">
                  Final
                </span>
              )}
              <div className="flex items-center gap-4">
                <span className="font-display text-5xl md:text-7xl">{displayAwayScore}</span>
                <span className="text-muted-foreground font-display text-3xl">:</span>
                <span className="font-display text-5xl md:text-7xl">{displayHomeScore}</span>
              </div>
              <p className="text-xs text-foreground font-body mt-2 uppercase tracking-wider font-normal">
                Series {displaySeriesAway} – {displaySeriesHome}
              </p>
            </div>

            <div className="flex-1 text-center flex flex-col items-center">
              <TeamLogo src={displayHome.logo} alt={displayHome.name} className="w-16 h-16 md:w-20 md:h-20" />
              <h2 className="font-display text-3xl md:text-4xl tracking-wider mt-2">
                {displayHome.abbreviation}
              </h2>
            </div>

            {/* Right arrow for desktop */}
            {seriesGames && (
              <button
                onClick={() => setActiveGameIdx((i) => Math.min(seriesGames.length - 1, i + 1))}
                disabled={activeGameIdx === seriesGames.length - 1}
                className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-card/50 text-foreground disabled:opacity-20 transition-opacity"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Game dots indicator */}
          {seriesGames && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {seriesGames.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveGameIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === activeGameIdx ? "bg-primary w-4" : "bg-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
          )}

          {user && userPick && (() => {
            const pickedTeam = userPick.winner === match.homeTeam.abbreviation ? match.homeTeam : match.awayTeam;
            const pts = computePickPoints(userPick);
            return (
              <div className="items-center justify-center gap-3 bg-transparent rounded-lg px-4 py-3 flex flex-row mt-[18px]">
                <span className="text-sm font-body uppercase tracking-wider text-primary-foreground">Your Pick</span>
                <TeamLogo src={pickedTeam.logo} alt={pickedTeam.name} className="w-4 h-4" />
                <span className="font-body font-semibold text-sm text-white">
                  {pickedTeam.abbreviation}
                </span>
                <span className="font-body text-primary-foreground text-sm">in <span className="font-bold">{userPick.games_in_series}</span></span>
                {pts !== null && (
                  <span className="font-body text-primary font-bold text-sm">· {pts} pts</span>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      <section className="container py-10">
        <h3 className="font-display text-2xl tracking-wider mb-6">
          All Picks
        </h3>
        <div className="grid gap-3">
          {allPicks && allPicks.length > 0 ? (
            allPicks.map((pick) => {
              const pickedTeam =
                pick.winner === match.homeTeam.abbreviation ? match.homeTeam : match.awayTeam;
              const isCurrentUser = user && pick.user_id === user.id;
              const pts = computePickPoints(pick);
              return (
                <div
                  key={pick.user_id}
                  className="flex items-center gap-4 bg-card rounded-lg p-4"
                >
                  <div className="flex-1">
                    <p className="font-body font-semibold">
                      {pick.profile_name || "Anonymous"}
                      {isCurrentUser && <span className="text-xs text-primary ml-2">(You)</span>}
                    </p>
                    <p className="text-sm text-muted-foreground font-body">
                      Picks{" "}
                      <span className="font-semibold text-white">
                        {pickedTeam.abbreviation}
                      </span>{" "}
                      in <span className="font-bold text-white">{pick.games_in_series}</span>
                      {pts !== null && (
                        <span className="ml-2 text-primary font-bold">· {pts} pts</span>
                      )}
                    </p>
                  </div>
                  <TeamLogo src={pickedTeam.logo} alt={pickedTeam.name} className="w-8 h-8" />
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground font-body text-sm">No picks yet for this series.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default MatchDetail;
