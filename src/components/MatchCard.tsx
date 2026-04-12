import { Link } from "react-router-dom";
import type { Match } from "@/data/playoffsData";
import TeamLogo from "@/components/TeamLogo";

interface MatchCardProps {
  match: Match;
}

const MatchCard = ({ match }: MatchCardProps) => {
  return (
    <Link
      to={`/match/${match.id}`}
      className="block bg-card rounded-lg border border-border hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 group"
    >
      <div className="px-4 py-2 flex items-center justify-between border-b border-border">
        <span className="text-xs text-muted-foreground font-body font-medium uppercase tracking-wider">
          {match.round} · Game {match.gameNumber}
        </span>
        <span className="text-xs text-muted-foreground font-body">
          {match.date} · {match.time}
        </span>
      </div>

      <div className="p-5 flex items-center gap-4">
        {/* Away Team */}
        <div className="flex-1 flex items-center gap-3">
          <TeamLogo src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-10 h-10" />
          <div>
            <p className="font-display text-xl tracking-wide">{match.awayTeam.abbreviation}</p>
            <p className="text-xs text-muted-foreground font-body hidden sm:block">{match.awayTeam.name}</p>
          </div>
        </div>

        {/* Series Score */}
        <div className="text-center px-4">
          <div className="flex items-center gap-3">
            <span className="font-display text-3xl">{match.awayWins}</span>
            <span className="text-muted-foreground font-body text-sm">—</span>
            <span className="font-display text-3xl">{match.homeWins}</span>
          </div>
          {match.status === "upcoming" && (
            <span className="text-[10px] text-primary font-body font-semibold uppercase tracking-widest">
              Upcoming
            </span>
          )}
          {match.status === "live" && (
            <span className="text-[10px] text-loss font-body font-semibold uppercase tracking-widest animate-pulse">
              Live
            </span>
          )}
          {match.status === "final" && (
            <span className="text-[10px] text-muted-foreground font-body font-semibold uppercase tracking-widest">
              Final
            </span>
          )}
        </div>

        {/* Home Team */}
        <div className="flex-1 flex items-center gap-3 justify-end text-right">
          <div>
            <p className="font-display text-xl tracking-wide">{match.homeTeam.abbreviation}</p>
            <p className="text-xs text-muted-foreground font-body hidden sm:block">{match.homeTeam.name}</p>
          </div>
          <TeamLogo src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-10 h-10" />
        </div>
      </div>

      {/* Tips preview */}
      <div className="px-5 pb-4 flex items-center gap-1">
        <span className="text-xs text-muted-foreground font-body mr-2">Tips:</span>
        {match.tips.map((tip) => (
          <span key={tip.user} className="text-sm" title={`${tip.user}: ${tip.pick} in ${tip.gamesInSeries}`}>
            {tip.avatar}
          </span>
        ))}
      </div>
    </Link>
  );
};

export default MatchCard;
