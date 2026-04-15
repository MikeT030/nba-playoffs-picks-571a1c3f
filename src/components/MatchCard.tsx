import { Link } from "react-router-dom";
import type { Match } from "@/data/playoffsData";
import TeamLogo from "@/components/TeamLogo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useBracketData } from "@/hooks/useBracketData";
import { useMemo } from "react";

interface SeriesResult {
  series_id: string;
  winner: string;
  games_played: number;
}

const useUserBet = (match: Match) => {
  const { user } = useAuth();
  const { data: bracketData } = useBracketData();

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

  const { data: dbPick } = useQuery({
    queryKey: ["user-pick", bracketSeriesId, user?.id],
    queryFn: async () => {
      if (!user || !bracketSeriesId) return null;
      const { data } = await supabase
        .from("picks")
        .select("winner, games_in_series")
        .eq("user_id", user.id)
        .eq("series_id", bracketSeriesId)
        .maybeSingle();
      return data ? { seriesId: bracketSeriesId, winner: data.winner, gamesInSeries: data.games_in_series } : null;
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
      return data as SeriesResult | null;
    },
    enabled: !!bracketSeriesId,
  });

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
      className="block rounded-lg border border-white/10 bg-[#22272E]/80 backdrop-blur-md transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 group"
    >
      <div className="px-4 py-2 flex items-center justify-center border-b border-transparent">
        <span className="text-xs text-white font-body uppercase tracking-wider text-center font-normal">
          {match.round} · Game {match.gameNumber} · {match.date}
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
              <span className="text-[10px] text-loss font-body font-semibold uppercase tracking-widest animate-pulse block -translate-y-5">
                Live
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
          <p className="text-xs text-foreground font-body mt-1 font-medium">
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
          <p className="font-body text-white text-center pt-0 text-sm">
            Your Pick: <span className="font-bold">{bet.winner}</span> in <span className="font-bold">{bet.gamesInSeries}</span>
            {points !== null && (
              <span className="ml-2 text-foreground font-medium">· {points} pts</span>
            )}
          </p>
        </div>
      )}
    </Link>
  );
};

export default MatchCard;
