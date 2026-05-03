import { getBracketSeriesIdForMatch, getAssumedOpponentAbbr, type Match } from "@/data/playoffsData";
import { useBracketData } from "@/hooks/useBracketData";
import { useAllUserPicks } from "@/hooks/useAllUserPicks";
import { useAllSeriesResults } from "@/hooks/useAllSeriesResults";
import { useSeriesGames } from "@/hooks/useSeriesGames";
import { pickDefaultGameIdx, isNextUp as checkIsNextUp, formatTipOff } from "@/lib/seriesUtils";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import MatchDetailDialog from "@/components/MatchDetailDialog";

const useUserBet = (match: Match) => {
  const { data: bracketData } = useBracketData();
  const { data: allPicks } = useAllUserPicks();
  const { data: allResults } = useAllSeriesResults();

  const bracketSeriesId = useMemo(() => {
    return getBracketSeriesIdForMatch(match, bracketData, allResults);
  }, [match, bracketData, allResults]);

  const dbPick = useMemo(() => {
    if (!allPicks || !bracketSeriesId) return null;
    const found = allPicks.find((p) => p.series_id === bracketSeriesId);
    return found
      ? { seriesId: bracketSeriesId, winner: found.winner, gamesInSeries: found.games_in_series }
      : null;
  }, [allPicks, bracketSeriesId]);

  const seriesResult = useMemo(() => {
    if (!allResults || !bracketSeriesId) return null;
    return allResults.find((r) => r.series_id === bracketSeriesId) ?? null;
  }, [allResults, bracketSeriesId]);

  const points = useMemo(() => {
    if (!dbPick || !seriesResult) return null;
    if (seriesResult.winner === dbPick.winner) {
      if (seriesResult.games_played === dbPick.gamesInSeries) return 3;
      return 2;
    }
    return 0;
  }, [dbPick, seriesResult]);

  const opponentAbbr = useMemo(() => {
    if (!dbPick) return null;
    return getAssumedOpponentAbbr(bracketSeriesId, dbPick.winner, bracketData, allPicks);
  }, [dbPick, bracketSeriesId, bracketData, allPicks]);

  return { pick: dbPick ?? null, points, opponentAbbr };
};

interface MatchCardProps {
  match: Match;
}

const MatchCard = ({ match }: MatchCardProps) => {
  const { pick: bet, points, opponentAbbr } = useUserBet(match);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: seriesGames } = useSeriesGames(
    match.id,
    match.homeTeam.abbreviation,
    match.awayTeam.abbreviation
  );

  // All games (final + live + upcoming) — full swipeable timeline
  const allGames = useMemo(() => seriesGames ?? [], [seriesGames]);
  const hasMultipleGames = allGames.length > 1;
  const [activeGameIdx, setActiveGameIdx] = useState(0);
  const [defaultApplied, setDefaultApplied] = useState(false);

  // Apply default-slide rule once games are available; re-apply if the
  // default index changes (e.g. a live game starts) and the user hasn't
  // manually navigated yet.
  const defaultIdx = useMemo(() => pickDefaultGameIdx(allGames), [allGames]);
  useEffect(() => {
    if (allGames.length === 0) return;
    if (!defaultApplied) {
      setActiveGameIdx(defaultIdx);
      setDefaultApplied(true);
    }
  }, [allGames.length, defaultIdx, defaultApplied]);

  // Swipe handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const swipedRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    swipedRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!hasMultipleGames) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      swipedRef.current = true;
      if (diff > 0 && activeGameIdx < allGames.length - 1) {
        setActiveGameIdx((i) => i + 1);
      } else if (diff < 0 && activeGameIdx > 0) {
        setActiveGameIdx((i) => i - 1);
      }
    }
  }, [allGames.length, activeGameIdx, hasMultipleGames]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (swipedRef.current) {
        e.preventDefault();
        swipedRef.current = false;
        return;
      }
      setDialogOpen(true);
    },
    []
  );

  const handleDotClick = useCallback(
    (e: React.MouseEvent, idx: number) => {
      e.stopPropagation();
      setActiveGameIdx(idx);
    },
    []
  );

  // Active game (or fallback to series-level)
  const activeGame = hasMultipleGames || allGames.length === 1 ? allGames[activeGameIdx] : null;
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

  const betTeamName = bet
    ? match.homeTeam.abbreviation === bet.winner
      ? match.homeTeam.name
      : match.awayTeam.abbreviation === bet.winner
        ? match.awayTeam.name
        : bet.winner
    : null;

  return (
    <>
    <div
      onClick={handleClick}
      onTouchStart={hasMultipleGames ? handleTouchStart : undefined}
      onTouchMove={hasMultipleGames ? handleTouchMove : undefined}
      onTouchEnd={hasMultipleGames ? handleTouchEnd : undefined}
      className="relative block rounded-lg overflow-hidden bg-[#1A1E24]/80 backdrop-blur-md transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 group cursor-pointer select-none"
    >
      {/* Team color gradient overlay (matches MatchDetail header) */}
      {(() => {
        const alpha = displayStatus === "live" ? "80" : "66";
        return (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${displayAway.color}${alpha} 0%, ${displayAway.color}${alpha} 50%, ${displayHome.color}${alpha} 50%, ${displayHome.color}${alpha} 100%)`,
            }}
          />
        );
      })()}

      <div className="relative">
      <div className="px-4 py-2 flex items-center justify-center border-b border-transparent">
        <span className="text-xs text-white font-body uppercase tracking-wider text-center font-normal">
          {match.conference !== "Finals" ? `${match.conference === "East" ? "EAST" : "WEST"}  ` : ""}{match.round === "Conference Semifinals" ? "Conf. Semifinals" : match.round === "Conference Finals" ? "Conf. Finals" : match.round} · Game {displayGameNum} · {displayDate}
        </span>
      </div>

      <div className="p-5 flex items-center justify-between gap-2 pt-[20px]">
        {/* Away Team */}
        <div className="flex-1 flex items-center gap-1.5 -translate-y-2">
          {displayAway.seed && (
            <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center shrink-0">{displayAway.seed}</span>
          )}
          <div>
            <p className="tracking-wide text-xl" style={{ fontFamily: "'Saira Stencil One', sans-serif" }}>{displayAway.abbreviation}</p>
            <p className="text-xs text-muted-foreground font-body hidden sm:block">{displayAway.name}</p>
          </div>
        </div>

        {/* Score & Series */}
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
                <span className="text-2xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>{displayAwayScore}</span>
                <span className="text-muted-foreground font-body text-sm">—</span>
                <span className="text-2xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>{displayHomeScore}</span>
              </>
            )}
          </div>
          <p className="text-xs font-body mt-1 font-medium text-[#dce0e5]">
            Series {displaySeriesAway} – {displaySeriesHome}
          </p>
        </div>

        {/* Home Team */}
        <div className="flex-1 flex items-center gap-1.5 justify-end text-right -translate-y-2">
          <div>
            <p className="tracking-wide text-xl" style={{ fontFamily: "'Saira Stencil One', sans-serif" }}>{displayHome.abbreviation}</p>
            <p className="text-xs text-muted-foreground font-body hidden sm:block">{displayHome.name}</p>
          </div>
          {displayHome.seed && (
            <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center shrink-0">{displayHome.seed}</span>
          )}
        </div>
      </div>

      {/* Game dots indicator: solid for played/live, outlined for upcoming */}
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

      {bet && betTeamName && (() => {
        const pickInMatch =
          match.homeTeam.abbreviation === bet.winner ||
          match.awayTeam.abbreviation === bet.winner;
        const actualOpp = match.homeTeam.abbreviation === bet.winner
          ? match.awayTeam.abbreviation
          : match.awayTeam.abbreviation === bet.winner
            ? match.homeTeam.abbreviation
            : null;
        const showAssumed = !pickInMatch
          ? !!opponentAbbr
          : !!opponentAbbr && !!actualOpp && actualOpp !== opponentAbbr;
        const suffixOpp = opponentAbbr ?? actualOpp;
        const broken = !pickInMatch;
        const effectivePoints = broken ? 0 : points;
        return (
          <div className="px-4 pb-3 -mt-1">
            <p className="font-body text-white text-center pt-0 text-base">
              Your Pick:{" "}
              <span className={broken ? "line-through opacity-70" : ""}>
                <span className="font-bold">{bet.winner}</span> in <span className="font-bold">{bet.gamesInSeries}</span>
                {showAssumed && suffixOpp ? ` (vs. ${suffixOpp})` : ""}
              </span>
              {(broken || effectivePoints !== null) && (
                <span className="ml-2 text-primary font-medium">
                  ·{" "}
                  {effectivePoints === 3
                    ? "Shiiiiit 3 Points"
                    : effectivePoints === 2
                      ? "That's 2 Points"
                      : "0 Points, Bro"}
                  {match.id === "nba-finals" && effectivePoints! > 0 && " And 4 for the Champ"}
                </span>
              )}
            </p>
          </div>
        );
      })()}
      </div>
    </div>
    <MatchDetailDialog match={match} open={dialogOpen} onOpenChange={setDialogOpen} initialGameIdx={activeGameIdx} />
    </>
  );
};

export default MatchCard;
