import { Link } from "react-router-dom";
import type { Match } from "@/data/playoffsData";
import TeamLogo from "@/components/TeamLogo";
import { useBracketData } from "@/hooks/useBracketData";
import { useAllUserPicks } from "@/hooks/useAllUserPicks";
import { useAllSeriesResults } from "@/hooks/useAllSeriesResults";
import { useMemo } from "react";

const useUserBet = (match: Match) => {
  const { data: bracketData } = useBracketData();
  const { data: allPicks } = useAllUserPicks();
  const { data: allResults } = useAllSeriesResults();

  const bracketSeriesId = useMemo(() => {
    if (!bracketData) return match.id;
    const teamSet = new Set([match.homeTeam.abbreviation, match.awayTeam.abbreviation]);
    // Exact match: both teams in a bracket series
    const found = bracketData.find(
      (s) => s.topTeam && s.bottomTeam && teamSet.has(s.topTeam.abbreviation) && teamSet.has(s.bottomTeam.abbreviation)
    );
    if (found) return found.id;
    // Partial match: one team appears in a bracket series (handles play-in games like CHA vs MIA)
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

  const betTeamName = bet
    ? match.homeTeam.abbreviation === bet.winner
      ? match.homeTeam.name
      : match.awayTeam.abbreviation === bet.winner
        ? match.awayTeam.name
        : bet.winner
    : null;

  return (
    <Link
      to={`/match/${match.id}`}
      className="block rounded-lg border border-white/10 bg-[#22272E]/80 backdrop-blur-md transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/40 group"
    >
      <div className="px-4 py-2 flex items-center justify-center border-b border-transparent">
        <span className="text-xs text-white font-body uppercase tracking-wider text-center font-normal">
          {match.conference !== "Finals" ? `${match.conference === "East" ? "EAST" : "WEST"}  ` : ""}{match.round === "Conference Semifinals" ? "Conf. Semifinals" : match.round === "Conference Finals" ? "Conf. Finals" : match.round} · Game {match.gameNumber} · {match.date}
        </span>
      </div>

      <div className="p-5 flex items-center gap-4 pt-[20px]">
        {/* Away Team */}
        <div className="flex-1 flex items-center gap-2 -translate-y-2">
          {match.awayTeam.seed && (
            <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center shrink-0">{match.awayTeam.seed}</span>
          )}
          <TeamLogo src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-10 h-10" />
          <div>
            <p className="font-display text-xl tracking-wide">{match.awayTeam.abbreviation}</p>
            <p className="text-xs text-muted-foreground font-body hidden sm:block">{match.awayTeam.name}</p>
          </div>
        </div>

        {/* Score & Series */}
        <div className="text-center px-4">
          <div className="h-0">
            {match.status === "live" && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-body font-semibold uppercase tracking-widest -translate-y-5 whitespace-nowrap text-[#fe953e]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FE943E] animate-pulse" />
                {match.time ?? ""}
              </span>
            )}
            {match.status === "final" && (
              <span className="text-[10px] text-muted-foreground font-body font-semibold uppercase tracking-widest block -translate-y-5">
                Final
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl">{match.awayScore}</span>
            <span className="text-muted-foreground font-body text-sm">—</span>
            <span className="font-display text-2xl">{match.homeScore}</span>
          </div>
          <p className="text-xs font-body mt-1 font-medium text-muted-foreground">
            Series {match.awayWins} – {match.homeWins}
          </p>
        </div>

        {/* Home Team */}
        <div className="flex-1 flex items-center gap-2 justify-end text-right -translate-y-2">
          <div>
            <p className="font-display text-xl tracking-wide">{match.homeTeam.abbreviation}</p>
            <p className="text-xs text-muted-foreground font-body hidden sm:block">{match.homeTeam.name}</p>
          </div>
          <TeamLogo src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-10 h-10" />
          {match.homeTeam.seed && (
            <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center shrink-0">{match.homeTeam.seed}</span>
          )}
        </div>
      </div>

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
    </Link>
  );
};

export default MatchCard;
