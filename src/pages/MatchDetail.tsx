import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { usePlayoffGames } from "@/hooks/usePlayoffGames";
import { useBracketData } from "@/hooks/useBracketData";
import { useSeriesGames } from "@/hooks/useSeriesGames";
import { pickDefaultGameIdx, isNextUp as checkIsNextUp, formatTipOff } from "@/lib/seriesUtils";
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

  // Series games from API/data — full timeline (final + live + upcoming)
  const { data: seriesGames } = useSeriesGames(
    id,
    match?.homeTeam.abbreviation,
    match?.awayTeam.abbreviation
  );
  const allGames = useMemo(() => seriesGames ?? [], [seriesGames]);
  const hasMultipleGames = allGames.length > 1;
  const [activeGameIdx, setActiveGameIdx] = useState(0);
  const [defaultApplied, setDefaultApplied] = useState(false);

  const defaultIdx = useMemo(() => pickDefaultGameIdx(allGames), [allGames]);
  useEffect(() => {
    if (allGames.length === 0) return;
    if (!defaultApplied) {
      setActiveGameIdx(defaultIdx);
      setDefaultApplied(true);
    }
  }, [allGames.length, defaultIdx, defaultApplied]);

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
    if (!hasMultipleGames) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (diff > threshold && activeGameIdx < allGames.length - 1) {
      setActiveGameIdx((i) => i + 1);
    } else if (diff < -threshold && activeGameIdx > 0) {
      setActiveGameIdx((i) => i - 1);
    }
  }, [allGames.length, activeGameIdx, hasMultipleGames]);

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
  const activeGame = (hasMultipleGames || allGames.length === 1) ? allGames[activeGameIdx] : null;
  const isUpcoming = activeGame?.status === "upcoming";
  const isNextUp = isUpcoming && checkIsNextUp(activeGame?.startsAt);

  const displayHome = activeGame ? activeGame.homeTeam : match.homeTeam;
  const displayAway = activeGame ? activeGame.awayTeam : match.awayTeam;
  const displayHomeScore = activeGame ? activeGame.homeScore : match.homeScore;
  const displayAwayScore = activeGame ? activeGame.awayScore : match.awayScore;
  const displayStatus = activeGame ? activeGame.status : match.status;
  const displayDate = activeGame ? activeGame.date : match.date;
  const displayGameNum = activeGame ? activeGame.gameNumber : match.gameNumber;
  const displaySeriesAway = activeGame ? activeGame.seriesRecord[0] : match.awayWins;
  const displaySeriesHome = activeGame ? activeGame.seriesRecord[1] : match.homeWins;
  const displayOt = activeGame ? activeGame.ot : undefined;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div
        className="relative overflow-hidden"
        onTouchStart={hasMultipleGames ? handleTouchStart : undefined}
        onTouchMove={hasMultipleGames ? handleTouchMove : undefined}
        onTouchEnd={hasMultipleGames ? handleTouchEnd : undefined}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${displayAway.color}66 0%, ${displayAway.color}66 50%, ${displayHome.color}66 50%, ${displayHome.color}66 100%)`,
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

          <p className="text-xs font-body font-semibold uppercase tracking-widest mb-4 text-center text-primary-foreground">
            {match.conference !== "Finals" ? `${match.conference === "East" ? "EAST" : "WEST"}  ` : ""}{match.round === "Conference Semifinals" ? "Conf. Semifinals" : match.round === "Conference Finals" ? "Conf. Finals" : match.round} · Game {displayGameNum} · {displayDate}
          </p>

          <div className="flex items-center justify-between gap-5 pt-[10px]">
            {/* Left arrow for desktop */}
            {hasMultipleGames && (
              <button
                onClick={() => setActiveGameIdx((i) => Math.max(0, i - 1))}
                disabled={activeGameIdx === 0}
                className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-card/50 text-foreground disabled:opacity-20 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <div className="flex-1 text-center flex flex-col items-center relative">
              {displayAway.seed && (
                <span className="absolute -left-1 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-body font-semibold">{displayAway.seed}</span>
              )}
              <TeamLogo src={displayAway.logo} alt={displayAway.name} className="w-16 h-16 md:w-20 md:h-20" />
              <h2 className="md:text-4xl tracking-wider mt-2 text-2xl" style={{ fontFamily: "'Saira Stencil One', sans-serif" }}>
                {displayAway.abbreviation}
              </h2>
            </div>

            <div className="text-center">
              {displayStatus === "live" && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-body uppercase tracking-widest -mt-[42px] whitespace-nowrap text-[#fe953e] font-bold">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FE943E] animate-pulse" />
                  {match.time ?? ""}
                </span>
              )}
              {displayStatus === "final" && (
                <span className="text-[10px] text-muted-foreground font-body font-semibold uppercase tracking-widest -mt-6">
                  Final{displayOt ? `/${displayOt > 1 ? displayOt : ""}OT` : ""}
                </span>
              )}
              {isNextUp && (
                <span className="text-[10px] font-body font-bold uppercase tracking-widest -mt-[42px] whitespace-nowrap text-primary block">
                  {formatTipOff(activeGame?.startsAt)}
                </span>
              )}
              {isUpcoming && !isNextUp && (
                <span className="text-[10px] text-muted-foreground font-body font-semibold uppercase tracking-widest -mt-6 block">
                  Tip-off {formatTipOff(activeGame?.startsAt)}
                </span>
              )}
              <div className="flex items-center gap-4">
                {isUpcoming ? (
                  <>
                    <span className="md:text-7xl text-4xl text-muted-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>—</span>
                    <span className="text-muted-foreground text-3xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>:</span>
                    <span className="md:text-7xl text-4xl text-muted-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>—</span>
                  </>
                ) : (
                  <>
                    <span className="md:text-7xl text-4xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>{displayAwayScore}</span>
                    <span className="text-muted-foreground text-3xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>:</span>
                    <span className="md:text-7xl text-4xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>{displayHomeScore}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-foreground font-body mt-2 uppercase tracking-wider font-normal">
                Series {displaySeriesAway} – {displaySeriesHome}
              </p>
            </div>

            <div className="flex-1 text-center flex flex-col items-center relative">
              {displayHome.seed && (
                <span className="absolute -right-1 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-body font-semibold">{displayHome.seed}</span>
              )}
              <TeamLogo src={displayHome.logo} alt={displayHome.name} className="w-16 h-16 md:w-20 md:h-20" />
              <h2 className="md:text-4xl tracking-wider mt-2 text-2xl" style={{ fontFamily: "'Saira Stencil One', sans-serif" }}>
                {displayHome.abbreviation}
              </h2>
            </div>

            {/* Right arrow for desktop */}
            {hasMultipleGames && (
              <button
                onClick={() => setActiveGameIdx((i) => Math.min(allGames.length - 1, i + 1))}
                disabled={activeGameIdx === allGames.length - 1}
                className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-card/50 text-foreground disabled:opacity-20 transition-opacity"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Game dots indicator: solid for played/live, outlined for upcoming */}
          {hasMultipleGames && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {allGames.map((g, i) => {
                const isActive = i === activeGameIdx;
                const isPlayed = g.status === "final" || g.status === "live";
                let cls = "h-2 rounded-full transition-all border ";
                if (isActive) {
                  cls += "bg-primary border-primary w-4";
                } else if (isPlayed) {
                  cls += "bg-muted-foreground/40 border-transparent w-2";
                } else {
                  cls += "bg-transparent border-muted-foreground/40 w-2";
                }
                return (
                  <button
                    key={i}
                    onClick={() => setActiveGameIdx(i)}
                    className={cls}
                    aria-label={`Game ${i + 1}${g.status === "upcoming" ? " (scheduled)" : ""}`}
                  />
                );
              })}
            </div>
          )}


          {user && userPick && (() => {
            const pickedTeam = userPick.winner === match.homeTeam.abbreviation ? match.homeTeam : match.awayTeam;
            const pts = computePickPoints(userPick);
            return (
              <div className="items-center justify-center gap-3 bg-transparent rounded-lg px-4 py-3 flex flex-row mt-[18px]">
                <span className="text-sm font-body uppercase tracking-wider text-primary-foreground">Your Pick</span>
                <TeamLogo src={pickedTeam.logo} alt={pickedTeam.name} className="w-7 h-7" />
                <span className="font-body font-semibold text-sm text-white">
                  {pickedTeam.abbreviation}
                </span>
                <span className="font-body text-primary-foreground text-sm">in <span className="font-bold">{userPick.games_in_series}</span></span>
                {pts !== null && (
                  <span className="font-body text-primary font-medium text-sm">
                    ·{" "}
                    {pts === 3
                      ? "Shiiiiit 3 Points"
                      : pts === 2
                        ? "That's 2 Points"
                        : "0 Points, Bro"}
                    {match.id === "nba-finals" && pts > 0 && " And 4 for the Champ"}
                  </span>
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
        {allPicks && allPicks.length > 0 ? (
          <div className="rounded-lg border border-white/10 bg-[#22272E]/80 backdrop-blur-md overflow-hidden">
            {allPicks.map((pick, idx) => {
              const pickedTeam =
                pick.winner === match.homeTeam.abbreviation ? match.homeTeam : match.awayTeam;
              const isCurrentUser = user && pick.user_id === user.id;
              const pts = computePickPoints(pick);
              return (
                <div
                  key={pick.user_id}
                  className={`flex items-center gap-4 p-4 ${
                    idx !== allPicks.length - 1 ? "border-b border-[#2B2F37]" : ""
                  }`}
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
            })}
          </div>
        ) : (
          <p className="text-muted-foreground font-body text-sm">No picks yet for this series.</p>
        )}
      </section>
    </div>
  );
};

export default MatchDetail;
