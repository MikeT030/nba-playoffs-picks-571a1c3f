import { useNavigate } from "react-router-dom";
import { teamMeta } from "@/lib/nbaApi";

export interface DemoMatchTeam {
  abbreviation: string;
  name: string;
  seed: number;
  color: string;
}

export interface DemoMatchData {
  away: DemoMatchTeam;
  home: DemoMatchTeam;
  awayScore: number;
  homeScore: number;
  seriesAway: number;
  seriesHome: number;
  gameNumber: number;
  date: string;
  conference: string;
  round: string;
  yourPick: { winner: string; games_in_series: number };
  yourPickResult: string;
}

interface DemoMatchCardColoredProps {
  onClick?: () => void;
  data?: DemoMatchData;
}

export const DEFAULT_MATCH_DATA: DemoMatchData = {
  away: {
    abbreviation: "SAC",
    name: "Kings",
    seed: 5,
    color: teamMeta.SAC?.color ?? "#5A2D81",
  },
  home: {
    abbreviation: "PAC",
    name: "Pacers",
    seed: 4,
    color: teamMeta.IND?.color ?? "#002D62",
  },
  awayScore: 108,
  homeScore: 112,
  seriesAway: 2,
  seriesHome: 3,
  gameNumber: 6,
  date: "Apr 28",
  conference: "EAST",
  round: "Conf. Semifinals",
  yourPick: { winner: "PAC", games_in_series: 6 },
  yourPickResult: "Shiiiiit 3 Points",
};

/**
 * Demo MatchCard variant: uses the team-color gradient from the matchup
 * detail card and hides team logos.
 */
const DemoMatchCardColored = ({
  onClick,
  data = DEFAULT_MATCH_DATA,
}: DemoMatchCardColoredProps = {}) => {
  const navigate = useNavigate();
  const {
    away,
    home,
    awayScore,
    homeScore,
    seriesAway,
    seriesHome,
    gameNumber,
    date,
    conference,
    round,
    yourPick,
    yourPickResult,
  } = data;

  return (
    <div
      onClick={onClick ?? (() => navigate("/admin/demo-match"))}
      className="relative block rounded-lg overflow-hidden backdrop-blur-md select-none cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 bg-[#1A1E24]/80"
    >
      {/* Team color gradient overlay (matches MatchDetail header) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${away.color}66 0%, transparent 50%, ${home.color}66 100%)`,
        }}
      />

      <div className="relative">
        <div className="px-4 py-2 flex items-center justify-center border-b border-transparent">
          <span className="text-xs text-white font-body uppercase tracking-wider text-center font-normal">
            {conference}  {round} · Game {gameNumber} · {date}
          </span>
        </div>

        <div className="p-5 flex items-center justify-between gap-2 pt-[20px]">
          {/* Away Team */}
          <div className="flex-1 flex items-center gap-1.5 -translate-y-2">
            <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center shrink-0">
              {away.seed}
            </span>
            <div>
              <p className="tracking-wide text-lg" style={{ fontFamily: "'Saira Stencil One', sans-serif" }}>{away.abbreviation}</p>
              <p className="text-xs text-muted-foreground font-body hidden sm:block">{away.name}</p>
            </div>
          </div>

          {/* Score & Series */}
          <div className="text-center shrink-0">
            <div className="h-0">
              <span className="text-muted-foreground font-body font-semibold uppercase tracking-widest block -translate-y-5 text-xs">
                Final
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-lg" style={{ fontFamily: "'Orbitron', sans-serif" }}>{awayScore}</span>
              <span className="text-muted-foreground font-body text-sm">—</span>
              <span className="font-medium text-lg" style={{ fontFamily: "'Orbitron', sans-serif" }}>{homeScore}</span>
            </div>
            <p className="text-xs font-body mt-1 font-medium text-muted-foreground">
              Series {seriesAway} – {seriesHome}
            </p>
          </div>

          {/* Home Team */}
          <div className="flex-1 flex items-center gap-1.5 justify-end text-right -translate-y-2">
            <div>
              <p className="tracking-wide text-lg" style={{ fontFamily: "'Saira Stencil One', sans-serif" }}>{home.abbreviation}</p>
              <p className="text-xs text-muted-foreground font-body hidden sm:block">{home.name}</p>
            </div>
            <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center shrink-0">
              {home.seed}
            </span>
          </div>
        </div>

        <div className="px-4 pb-3 -mt-1">
          <div className="h-px w-full bg-[#2B2F37] mb-3" />
          <p className="font-body text-white text-center pt-0 text-sm">
            Your Pick: <span className="font-bold">{yourPick.winner}</span> in <span className="font-bold">{yourPick.games_in_series}</span>
            <span className="ml-2 text-primary font-medium">· {yourPickResult}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoMatchCardColored;
