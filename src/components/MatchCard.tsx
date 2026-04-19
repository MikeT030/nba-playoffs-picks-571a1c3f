import { useNavigate } from "react-router-dom";
import type { Match } from "@/data/playoffsData";
import TeamLogo from "@/components/TeamLogo";
import { useBracketData } from "@/hooks/useBracketData";
import { useAllUserPicks } from "@/hooks/useAllUserPicks";
import { useAllSeriesResults } from "@/hooks/useAllSeriesResults";
import { useSeriesGames } from "@/hooks/useSeriesGames";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";

const useUserBet = (match: Match) => {
  const { data: bracketData } = useBracketData();
  const { data: allPicks } = useAllUserPicks();
  const { data: allResults } = useAllSeriesResults();

  const bracketSeriesId = useMemo(() => {
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

  return { pick: dbPick ?? null, points };
};

interface MatchCardProps {
  match: Match;
}

const MatchCard = ({ match }: MatchCardProps) => {
  const { pick: bet, points } = useUserBet(match);
  const navigate = useNavigate();

  const { data: seriesGames } = useSeriesGames(
    match.id,
    match.homeTeam.abbreviation,
    match.awayTeam.abbreviation
  );
  const playedGames = useMemo(
    () => seriesGames?.filter((g) => g.status === "final" || g.status === "live") ?? [],
    [seriesGames]
  );
  const hasSeriesGames = playedGames.length > 1;
  const [activeGameIdx, setActiveGameIdx] = useState(0);

  useEffect(() => {
    if (playedGames.length > 0) setActiveGameIdx(playedGames.length - 1);
  }, [playedGames.length]);

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
    if (!hasSeriesGames) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      swipedRef.current = true;
      if (diff > 0 && activeGameIdx < playedGames.length - 1) {
        setActiveGameIdx((i) => i + 1);
      } else if (diff < 0 && activeGameIdx > 0) {
        setActiveGameIdx((i) => i - 1);
      }
    }
  }, [playedGames.length, activeGameIdx, hasSeriesGames]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (swipedRef.current) {
        e.preventDefault();
        swipedRef.current = false;
        return;
      }
      navigate(`/match/${match.id}`);
    },
    [navigate, match.id]
  );

  const handleDotClick = useCallback(
    (e: React.MouseEvent, idx: number) => {
      e.stopPropagation();
      setActiveGameIdx(idx);
    },
    []
  );

  // Active game (or fallback to series-level)
  const activeGame = hasSeriesGames ? playedGames[activeGameIdx] : null;
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
    <div
      onClick={handleClick}
      onTouchStart={hasSeriesGames ? handleTouchStart : undefined}
      onTouchMove={hasSeriesGames ? handleTouchMove : undefined}
      onTouchEnd={hasSeriesGames ? handleTouchEnd : undefined}
      className="block rounded-lg border border-white/10 bg-[#22272E]/80 backdrop-blur-md transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/40 group cursor-pointer select-none"
    >
      <div className="px-4 py-2 flex items-center justify-center border-b border-transparent">
        <span className="text-xs text-white font-body uppercase tracking-wider text-center font-normal">
          {match.conference !== "Finals" ? `${match.conference === "East" ? "EAST" : "WEST"}  ` : ""}{match.round === "Conference Semifinals" ? "Conf. Semifinals" : match.round === "Conference Finals" ? "Conf. Finals" : match.round} · Game {displayGameNum} · {displayDate}
        </span>
      </div>

      <div className="p-5 flex items-center gap-4 pt-[20px]">
        {/* Away Team */}
        <div className="flex-1 flex items-center gap-2 -translate-y-2">
          {displayAway.seed && (
            <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center shrink-0">{displayAway.seed}</span>
          )}
          <TeamLogo src={displayAway.logo} alt={displayAway.name} className="w-10 h-10" />
          <div>
            <p className="font-display text-xl tracking-wide">{displayAway.abbreviation}</p>
            <p className="text-xs text-muted-foreground font-body hidden sm:block">{displayAway.name}</p>
          </div>
        </div>

        {/* Score & Series */}
        <div className="text-center px-4">
          <div className="h-0">
            {displayStatus === "live" && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-body font-semibold uppercase tracking-widest -translate-y-5 whitespace-nowrap text-[#fe953e]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FE943E] animate-pulse" />
                {match.time ?? ""}
              </span>
            )}
            {displayStatus === "final" && (
              <span className="text-[10px] text-muted-foreground font-body font-semibold uppercase tracking-widest block -translate-y-5">
                Final{displayOt ? `/${displayOt > 1 ? displayOt : ""}OT` : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl">{displayAwayScore}</span>
            <span className="text-muted-foreground font-body text-sm">—</span>
            <span className="font-display text-2xl">{displayHomeScore}</span>
          </div>
          <p className="text-xs font-body mt-1 font-medium text-muted-foreground">
            Series {displaySeriesAway} – {displaySeriesHome}
          </p>
        </div>

        {/* Home Team */}
        <div className="flex-1 flex items-center gap-2 justify-end text-right -translate-y-2">
          <div>
            <p className="font-display text-xl tracking-wide">{displayHome.abbreviation}</p>
            <p className="text-xs text-muted-foreground font-body hidden sm:block">{displayHome.name}</p>
          </div>
          <TeamLogo src={displayHome.logo} alt={displayHome.name} className="w-10 h-10" />
          {displayHome.seed && (
            <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center shrink-0">{displayHome.seed}</span>
          )}
        </div>
      </div>

      {/* Game dots indicator */}
      {hasSeriesGames && (
        <div className="flex items-center justify-center gap-1.5 pb-3 -mt-1">
          {playedGames.map((_, i) => (
            <button
              key={i}
              onClick={(e) => handleDotClick(e, i)}
              className={`h-1.5 rounded-full transition-all ${
                i === activeGameIdx ? "bg-primary w-3" : "bg-muted-foreground/40 w-1.5"
              }`}
              aria-label={`Game ${i + 1}`}
            />
          ))}
        </div>
      )}

      {bet && betTeamName && (
        <div className="px-4 pb-3 -mt-1">
          <div className="h-px w-full bg-[#2B2F37] mb-3" />
          <p className="font-body text-white text-center pt-0 text-sm">
            Your Pick: <span className="font-bold">{bet.winner}</span> in <span className="font-bold">{bet.gamesInSeries}</span>
            {points !== null && (
              <span className="ml-2 text-primary font-medium">
                ·{" "}
                {points === 3
                  ? "Shiiiiit 3 Points"
                  : points === 2
                    ? "That's 2 Points"
                    : "0 Points, Bro"}
                {match.id === "nba-finals" && points > 0 && " And 4 for the Champ"}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default MatchCard;
