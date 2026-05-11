import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBracketData } from "@/hooks/useBracketData";
import { useAllSeriesResults } from "@/hooks/useAllSeriesResults";
import { useAllUserPicks } from "@/hooks/useAllUserPicks";
import { useSeriesGames } from "@/hooks/useSeriesGames";
import { isNextUp as checkIsNextUp, formatTipOff } from "@/lib/seriesUtils";
import { getBracketSeriesIdForMatch, getAssumedOpponentAbbr, bracketSeries as defaultBracketSeries, type Match, type Team } from "@/data/playoffsData";
import { teamMeta } from "@/lib/nbaApi";
import { useDemoRecap, recapKey } from "@/lib/demoRecapStore";
import { scorePick as scorePickShared } from "@/lib/pickScoring";

/**
 * Resolve a Team-like object for *any* abbreviation, so picks made for a
 * matchup that never materialised (e.g. someone picked "DEN" for the
 * "winner of DEN/MIN vs winner of SAS/PIW7" semi slot, and the actual
 * matchup ended up MIN vs SAS) still render with the right team
 * abbreviation/color instead of being silently mapped to one of the
 * teams in the *current* matchup.
 */
function teamForPick(abbr: string, match: Match): Team {
  if (abbr === match.homeTeam.abbreviation) return match.homeTeam;
  if (abbr === match.awayTeam.abbreviation) return match.awayTeam;
  const meta = teamMeta[abbr] || { color: "#666", logo: "🏀" };
  return { name: abbr, abbreviation: abbr, color: meta.color, logo: meta.logo };
}

interface MatchDetailDialogProps {
  match: Match | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialGameIdx?: number;
}

const MatchDetailDialog = ({ match, open, onOpenChange, initialGameIdx }: MatchDetailDialogProps) => {
  const { user } = useAuth();
  const { data: bracketData } = useBracketData();
  const { data: allResults } = useAllSeriesResults();
  const { data: currentUserAllPicks } = useAllUserPicks();
  const { data: seriesGames } = useSeriesGames(
    match?.id,
    match?.homeTeam.abbreviation,
    match?.awayTeam.abbreviation
  );

  const allGames = useMemo(() => seriesGames ?? [], [seriesGames]);
  const hasMultipleGames = allGames.length > 1;
  // If the card passed an explicit game index, honor it. Otherwise default to
  // the live game if any, otherwise the most recent final game, otherwise the
  // last game in the series.
  const defaultIdx = useMemo(() => {
    if (allGames.length === 0) return 0;
    if (initialGameIdx !== undefined && initialGameIdx >= 0 && initialGameIdx < allGames.length) {
      return initialGameIdx;
    }
    const liveIdx = allGames.findIndex((g) => g.status === "live");
    if (liveIdx >= 0) return liveIdx;
    for (let i = allGames.length - 1; i >= 0; i--) {
      if (allGames[i].status === "final") return i;
    }
    return allGames.length - 1;
  }, [allGames, initialGameIdx]);
  const [activeGameIdx, setActiveGameIdx] = useState(0);
  const [defaultApplied, setDefaultApplied] = useState(false);

  useEffect(() => {
    if (allGames.length === 0) return;
    if (!defaultApplied) {
      setActiveGameIdx(defaultIdx);
      setDefaultApplied(true);
    }
  }, [allGames.length, defaultIdx, defaultApplied]);

  // Reset when dialog closes so it re-applies default next open
  useEffect(() => {
    if (!open) {
      setDefaultApplied(false);
      setActiveGameIdx(0);
    }
  }, [open]);

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
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && activeGameIdx < allGames.length - 1) {
        setActiveGameIdx((i) => i + 1);
      } else if (diff < 0 && activeGameIdx > 0) {
        setActiveGameIdx((i) => i - 1);
      }
    }
  }, [allGames.length, activeGameIdx, hasMultipleGames]);

  const handleDotClick = useCallback((e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setActiveGameIdx(idx);
  }, []);

  const activeGame = allGames.length > 0 ? allGames[activeGameIdx] : null;

  // "Wade's take" recap added to this game (matched by away/home; per-game key
  // also tried so a game-specific recap takes precedence).
  const awayAbbrForKey = activeGame?.awayTeam.abbreviation ?? match?.awayTeam.abbreviation ?? "";
  const homeAbbrForKey = activeGame?.homeTeam.abbreviation ?? match?.homeTeam.abbreviation ?? "";
  const recapByGame = useDemoRecap(
    recapKey(awayAbbrForKey, homeAbbrForKey, activeGame?.gameNumber),
  );
  const recapBySeries = useDemoRecap(
    recapKey(awayAbbrForKey, homeAbbrForKey, undefined),
  );
  const recap = recapByGame ?? recapBySeries;

  const bracketSeriesId = useMemo(() => {
    if (!match) return null;
    return getBracketSeriesIdForMatch(match, bracketData, allResults);
  }, [match, bracketData, allResults]);

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
    enabled: !!bracketSeriesId && open,
  });

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
    enabled: !!bracketSeriesId && open,
  });

  // Fetch every pick by users that have picked this series, so we can derive
  // per-user assumed opponents for later-round series.
  const pickerUserIds = useMemo(
    () => Array.from(new Set((allPicks ?? []).map((p) => p.user_id))),
    [allPicks],
  );
  const { data: picksByUserAll } = useQuery({
    queryKey: ["series-picks-bypicker", bracketSeriesId, pickerUserIds],
    queryFn: async () => {
      if (pickerUserIds.length === 0) return {} as Record<string, { series_id: string; winner: string }[]>;
      const { data } = await supabase
        .from("picks")
        .select("user_id, series_id, winner")
        .in("user_id", pickerUserIds);
      const map: Record<string, { series_id: string; winner: string }[]> = {};
      (data ?? []).forEach((p) => {
        (map[p.user_id] ||= []).push({ series_id: p.series_id, winner: p.winner });
      });
      return map;
    },
    enabled: open && pickerUserIds.length > 0,
  });

  if (!match) return null;

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
  const isUpcoming = displayStatus === "upcoming";
  const isNextUp = isUpcoming && checkIsNextUp(activeGame?.startsAt);

  const seriesListForScoring = bracketData ?? defaultBracketSeries;

  /**
   * Score a pick using the shared scoring rule, given the picker's full
   * pick set (used for assumed-opponent resolution).
   */
  const computePts = (
    pick: { winner: string; games_in_series: number },
    pickerPicks: { series_id: string; winner: string }[] | undefined,
  ): number | null => {
    if (!bracketSeriesId) return null;
    if (!allResults) return null;
    const userPicksLite = (pickerPicks ?? []).map((p) => ({
      series_id: p.series_id,
      winner: p.winner,
      // games_in_series doesn't matter for assumed-opponent lookup; default 0
      games_in_series: 0,
    }));
    // Make sure the pick itself is in the list (it may not be if pickerPicks
    // came from a different fetch). Replace or append the canonical entry.
    const idx = userPicksLite.findIndex((p) => p.series_id === bracketSeriesId);
    const self = {
      series_id: bracketSeriesId,
      winner: pick.winner,
      games_in_series: pick.games_in_series,
    };
    if (idx >= 0) userPicksLite[idx] = self;
    else userPicksLite.push(self);
    const info = scorePickShared(self, userPicksLite, allResults, seriesListForScoring);
    return info.points;
  };

  const headerLabel = `${match.conference !== "Finals" ? `${match.conference === "East" ? "EAST" : "WEST"}  ` : ""}${match.round === "Conference Semifinals" ? "Conf. Semifinals" : match.round === "Conference Finals" ? "Conf. Finals" : match.round} · Game ${displayGameNum} · ${displayDate}`;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-none bg-black h-[97vh] max-h-[97vh] p-0 gap-0 overflow-hidden [&>div:first-child]:mt-[18px]">
        <DrawerTitle className="sr-only">
          {displayAway.abbreviation} vs {displayHome.abbreviation}
        </DrawerTitle>
        <div className="overflow-y-auto pt-[20px]">

        {/* Header — smaller matchup card with team-color gradient */}
        <div
          className="relative overflow-hidden select-none"
          onTouchStart={hasMultipleGames ? handleTouchStart : undefined}
          onTouchMove={hasMultipleGames ? handleTouchMove : undefined}
          onTouchEnd={hasMultipleGames ? handleTouchEnd : undefined}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${displayAway.color}${displayStatus === "live" ? "80" : "66"} 0%, ${displayAway.color}${displayStatus === "live" ? "80" : "66"} 50%, ${displayHome.color}${displayStatus === "live" ? "80" : "66"} 50%, ${displayHome.color}${displayStatus === "live" ? "80" : "66"} 100%)`,
            }}
          />
          <div className="relative">
            <div className="px-4 py-2 flex items-center justify-center">
              <span className="text-xs text-white font-body uppercase tracking-wider text-center font-normal">
                {headerLabel}
              </span>
            </div>

            <div className="p-5 pt-3 flex items-center justify-between gap-2">
              {/* Away */}
              <div className="flex-1 flex items-center gap-1.5">
                {displayAway.seed && (
                  <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center shrink-0">
                    {displayAway.seed}
                  </span>
                )}
                <div>
                  <p className="tracking-wide text-xl" style={{ fontFamily: "'Saira Stencil One', sans-serif" }}>
                    {displayAway.abbreviation}
                  </p>
                  
                </div>
              </div>

              {/* Score */}
              <div className="text-center shrink-0">
                <div className="h-0">
                  {displayStatus === "live" && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-body font-semibold uppercase tracking-widest -translate-y-5 whitespace-nowrap text-[#fe953e]">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FE943E] animate-pulse" />
                      {match.time ?? ""}
                    </span>
                  )}
                  {displayStatus === "final" && (
                    <span className="text-muted-foreground font-body font-semibold uppercase tracking-widest block -translate-y-5 text-xs">
                      Final{displayOt ? `/${displayOt > 1 ? displayOt : ""}OT` : ""}
                    </span>
                  )}
                  {isNextUp && (
                    <span className="text-[10px] font-body font-semibold uppercase tracking-widest block -translate-y-5 whitespace-nowrap text-primary">
                      {formatTipOff(activeGame?.startsAt)}
                    </span>
                  )}
                  {isUpcoming && !isNextUp && (
                    <span className="text-[10px] text-muted-foreground font-body font-semibold uppercase tracking-widest block -translate-y-5 whitespace-nowrap">
                      {formatTipOff(activeGame?.startsAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isUpcoming ? (
                    <>
                      <span className="text-2xl text-muted-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>—</span>
                      <span className="text-muted-foreground font-body text-sm">—</span>
                      <span className="text-2xl text-muted-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>—</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-2xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>{displayAwayScore}</span>
                      <span className="text-muted-foreground font-body text-sm">—</span>
                      <span className="font-medium text-2xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>{displayHomeScore}</span>
                    </>
                  )}
                </div>
                <p className="text-xs font-body mt-1 font-medium text-[#dce0e5]">
                  Series {displaySeriesAway} – {displaySeriesHome}
                </p>
              </div>

              {/* Home */}
              <div className="flex-1 flex items-center gap-1.5 justify-end text-right">
                <div>
                  <p className="tracking-wide text-xl" style={{ fontFamily: "'Saira Stencil One', sans-serif" }}>
                    {displayHome.abbreviation}
                  </p>
                  
                </div>
                {displayHome.seed && (
                  <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center shrink-0">
                    {displayHome.seed}
                  </span>
                )}
              </div>
            </div>

            {hasMultipleGames && (
              <div className="flex items-center justify-center gap-1.5 pb-3 -mt-1">
                {allGames.map((g, i) => {
                  const isActive = i === activeGameIdx;
                  const isPlayed = g.status === "final" || g.status === "live";
                  let cls = "h-1.5 rounded-full transition-all border ";
                  if (isActive) {
                    cls += "bg-primary border-primary w-3";
                  } else if (isPlayed) {
                    cls += "bg-muted-foreground/40 border-transparent w-1.5";
                  } else {
                    cls += "bg-transparent border-muted-foreground/40 w-1.5";
                  }
                  return (
                    <button
                      key={i}
                      onClick={(e) => handleDotClick(e, i)}
                      className={cls}
                      aria-label={`Game ${i + 1}${g.status === "upcoming" ? " (scheduled)" : ""}`}
                    />
                  );
                })}
              </div>
            )}

            {(() => {
              const userPick = user && allPicks ? allPicks.find((p) => p.user_id === user.id) : null;
              if (!userPick) return null;
              const pts = computePts(userPick, currentUserAllPicks ?? []);
              const pickInMatch =
                match.homeTeam.abbreviation === userPick.winner ||
                match.awayTeam.abbreviation === userPick.winner;
              const actualOpp = match.homeTeam.abbreviation === userPick.winner
                ? match.awayTeam.abbreviation
                : match.awayTeam.abbreviation === userPick.winner
                  ? match.homeTeam.abbreviation
                  : null;
              const assumedOpp = bracketSeriesId
                ? getAssumedOpponentAbbr(bracketSeriesId, userPick.winner, bracketData, currentUserAllPicks ?? [])
                : null;
              const broken = !pickInMatch;
              const showAssumed = broken
                ? !!assumedOpp
                : !!assumedOpp && !!actualOpp && actualOpp !== assumedOpp;
              const suffixOpp = assumedOpp ?? actualOpp;
              const effectivePts = broken ? 0 : pts;
              return (
                <div className="px-4 pb-3">
                  <p className="font-body text-white text-center text-base">
                    Your Pick:{" "}
                    <span className={broken ? "line-through opacity-70" : ""}>
                      <span className="font-bold">{userPick.winner}</span> in <span className="font-bold">{userPick.games_in_series}</span>
                      {showAssumed && suffixOpp ? ` (vs. ${suffixOpp})` : ""}
                    </span>
                    {(broken || effectivePts !== null) && (
                      <span className="ml-2 text-primary font-medium">
                        ·{" "}
                        {effectivePts === 3
                          ? "Shiiiiit 3 Points"
                          : effectivePts === 2
                            ? "That's 2 Points"
                            : "0 Points, Bro"}
                        {match.id === "nba-finals" && effectivePts! > 0 && " And 4 for the Champ"}
                      </span>
                    )}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* All Picks */}
        <div className="px-5 py-5 max-h-[calc(60vh+40px)] overflow-y-auto bg-black space-y-5">
          {recap && (
            <div>
              <h3 className="font-display text-xl tracking-wider mb-3">The gist of it</h3>
              <div className="rounded-lg border p-4 bg-[#23282f]/0 border-white/0">
                <p className="font-body text-sm text-white leading-relaxed whitespace-pre-wrap">
                  {recap}
                </p>
              </div>
            </div>
          )}
          <div>
          <h3 className="font-display text-xl tracking-wider mb-4">All Picks</h3>
          {allPicks && allPicks.length > 0 ? (
            <div className="rounded-lg border border-white/10 bg-[#22272E]/80 overflow-hidden">
              {allPicks.map((pick, idx) => {
                const pickedTeam = teamForPick(pick.winner, match);
                const isCurrentUser = user && pick.user_id === user.id;
                const pts = computePts(pick);
                const userPicks = picksByUserAll?.[pick.user_id] ?? [];
                const assumedOpp = bracketSeriesId
                  ? getAssumedOpponentAbbr(bracketSeriesId, pick.winner, bracketData, userPicks)
                  : null;
                const pickInMatch =
                  match.homeTeam.abbreviation === pick.winner ||
                  match.awayTeam.abbreviation === pick.winner;
                const actualOpp = match.homeTeam.abbreviation === pick.winner
                  ? match.awayTeam.abbreviation
                  : match.awayTeam.abbreviation === pick.winner
                    ? match.homeTeam.abbreviation
                    : null;
                const broken = !pickInMatch;
                const showAssumed = broken
                  ? !!assumedOpp
                  : !!assumedOpp && !!actualOpp && actualOpp !== assumedOpp;
                const suffixOpp = assumedOpp ?? actualOpp;
                return (
                  <div
                    key={pick.user_id}
                    className={`flex items-stretch gap-4 p-3 ${
                      idx !== allPicks.length - 1 ? "border-b border-[#2B2F37]" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0 self-center">
                      <p className="font-body font-semibold text-sm">
                        {pick.profile_name || "Anonymous"}
                        {isCurrentUser && <span className="text-xs text-primary ml-2">(You)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground font-body">
                        <span className={broken ? "line-through opacity-70" : ""}>
                          Picks{" "}
                          <span className="font-semibold text-white">{pickedTeam.abbreviation}</span>{" "}
                          in <span className="font-bold text-white">{pick.games_in_series}</span>
                          {showAssumed && suffixOpp ? ` (vs. ${suffixOpp})` : ""}
                        </span>
                        {pts !== null && (
                          <span className="ml-2 text-primary font-bold">· {pts} pts</span>
                        )}
                      </p>
                    </div>
                    <div
                      className="self-stretch -my-3 -mr-3 shrink-0 relative overflow-hidden"
                      style={{ width: "100px", maxWidth: "100px" }}
                    >
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: `linear-gradient(to top right, transparent 0%, transparent 50%, ${pickedTeam.color}4D 50%, ${pickedTeam.color}4D 100%)`,
                        }}
                      />
                      <span
                        className="absolute right-2 tracking-wide text-sm text-white leading-none"
                        style={{ fontFamily: "'Saira Stencil One', sans-serif", top: "12px" }}
                      >
                        {pickedTeam.abbreviation}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground font-body text-sm">No picks yet for this series.</p>
          )}
          </div>
        </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MatchDetailDialog;
