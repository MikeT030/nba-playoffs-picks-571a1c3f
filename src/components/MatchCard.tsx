import { Link } from "react-router-dom";
import type { Match } from "@/data/playoffsData";
import TeamLogo from "@/components/TeamLogo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useBracketData } from "@/hooks/useBracketData";
import { useMemo } from "react";

const useUserBet = (match: Match) => {
  const { user } = useAuth();
  const { data: bracketData } = useBracketData();

  const bracketSeriesId = useMemo(() => {
    if (!bracketData) return null;
    const teamSet = new Set([match.homeTeam.abbreviation, match.awayTeam.abbreviation]);
    const found = bracketData.find(
      (s) => s.topTeam && s.bottomTeam && teamSet.has(s.topTeam.abbreviation) && teamSet.has(s.bottomTeam.abbreviation)
    );
    return found?.id ?? null;
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

  return dbPick ?? null;
};

interface MatchCardProps {
  match: Match;
}

const MatchCard = ({ match }: MatchCardProps) => {
  const bet = useUserBet(match);

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
      className="block bg-card rounded-lg border border-transparent hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 group"
    >
      <div className="px-4 py-2 flex items-center justify-between border-b border-transparent">
        <span className="text-xs text-muted-foreground font-body font-medium uppercase tracking-wider">
          {match.round} · Game {match.gameNumber}
        </span>
        <div className="flex flex-col items-end">
          <span className="text-xs text-muted-foreground font-body">
            {match.date} · {match.time}
          </span>
          {match.status === "final" && (
            <span className="text-[10px] text-muted-foreground font-body font-semibold uppercase tracking-widest">
              Final
            </span>
          )}
        </div>
      </div>

      <div className="p-5 flex items-center gap-4 pt-0">
        {/* Away Team */}
        <div className="flex-1 flex items-center gap-2">
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
              <span className="text-[10px] text-loss font-body font-semibold uppercase tracking-widest animate-pulse block -translate-y-2.5">
                Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-display text-3xl">{match.awayScore}</span>
            <span className="text-muted-foreground font-body text-sm">—</span>
            <span className="font-display text-3xl">{match.homeScore}</span>
          </div>
          <p className="text-xs text-muted-foreground font-body mt-1">
            Series {match.awayWins} – {match.homeWins}
          </p>
        </div>

        {/* Home Team */}
        <div className="flex-1 flex items-center gap-2 justify-end text-right">
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
          <p className="text-xs font-body text-foreground text-center">
            Your Pick: <span className="font-medium">{bet.winner}</span> in <span className="font-medium">{bet.gamesInSeries}</span>
          </p>
        </div>
      )}
    </Link>
  );
};

export default MatchCard;
