import TeamLogo from "@/components/TeamLogo";
import { teamMeta } from "@/lib/nbaApi";

/**
 * Standalone demo MatchCard with hardcoded SAC vs PAC dummy data.
 * Mirrors the visual structure of MatchCard.tsx but has no hooks /
 * data dependencies. Used on the Admin page for testing layout/styles.
 */
const DemoMatchCard = () => {
  const away = {
    abbreviation: "SAC",
    name: "Kings",
    seed: 5,
    logo: teamMeta.SAC?.logo ?? "",
  };
  const home = {
    abbreviation: "PAC",
    name: "Pacers",
    seed: 4,
    logo: teamMeta.IND?.logo ?? "", // PAC isn't a real abbr; use Pacers (IND) logo
  };

  const awayScore = 108;
  const homeScore = 112;
  const seriesAway = 2;
  const seriesHome = 3;
  const gameNumber = 6;
  const date = "Apr 28";

  return (
    <div className="block rounded-lg bg-[#1A1E24]/80 backdrop-blur-md select-none">
      <div className="px-4 py-2 flex items-center justify-center border-b border-transparent">
        <span className="text-xs text-white font-body uppercase tracking-wider text-center font-normal">
          EAST  Conf. Semifinals · Game {gameNumber} · {date}
        </span>
      </div>

      <div className="p-5 flex items-center gap-4 pt-[20px]">
        {/* Away Team */}
        <div className="flex-1 flex items-center gap-2 -translate-y-2">
          <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center shrink-0">
            {away.seed}
          </span>
          <TeamLogo src={away.logo} alt={away.name} className="w-10 h-10" />
          <div>
            <p className="font-display text-xl tracking-wide">{away.abbreviation}</p>
            <p className="text-xs text-muted-foreground font-body hidden sm:block">{away.name}</p>
          </div>
        </div>

        {/* Score & Series */}
        <div className="text-center px-4">
          <div className="h-0">
            <span className="text-muted-foreground font-body font-semibold uppercase tracking-widest block -translate-y-5 text-xs">
              Final
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl">{awayScore}</span>
            <span className="text-muted-foreground font-body text-sm">—</span>
            <span className="font-display text-2xl">{homeScore}</span>
          </div>
          <p className="text-xs font-body mt-1 font-medium text-muted-foreground">
            Series {seriesAway} – {seriesHome}
          </p>
        </div>

        {/* Home Team */}
        <div className="flex-1 flex items-center gap-2 justify-end text-right -translate-y-2">
          <div>
            <p className="font-display text-xl tracking-wide">{home.abbreviation}</p>
            <p className="text-xs text-muted-foreground font-body hidden sm:block">{home.name}</p>
          </div>
          <TeamLogo src={home.logo} alt={home.name} className="w-10 h-10" />
          <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center shrink-0">
            {home.seed}
          </span>
        </div>
      </div>

      <div className="px-4 pb-3 -mt-1">
        <div className="h-px w-full bg-[#2B2F37] mb-3" />
        <p className="font-body text-white text-center pt-0 text-sm">
          Your Pick: <span className="font-bold">PAC</span> in <span className="font-bold">6</span>
          <span className="ml-2 text-primary font-medium">· Shiiiiit 3 Points</span>
        </p>
      </div>
    </div>
  );
};

export default DemoMatchCard;
