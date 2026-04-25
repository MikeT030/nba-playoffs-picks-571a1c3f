import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import TeamLogo from "@/components/TeamLogo";
import { teamMeta } from "@/lib/nbaApi";

/**
 * Standalone demo MatchDetail page with hardcoded SAC vs PAC dummy data.
 * Mirrors MatchDetail.tsx visuals but with no hooks / data deps.
 * Used from the Admin page for testing layout/styles.
 */

const away = {
  abbreviation: "SAC",
  name: "Kings",
  seed: 5,
  color: teamMeta.SAC?.color ?? "#5A2D81",
  logo: teamMeta.SAC?.logo ?? "",
};
const home = {
  abbreviation: "PAC",
  name: "Pacers",
  seed: 4,
  color: teamMeta.IND?.color ?? "#002D62",
  logo: teamMeta.IND?.logo ?? "",
};

const dummyPicks = [
  { user_id: "u1", profile_name: "Erik", winner: "PAC", games_in_series: 6 },
  { user_id: "u2", profile_name: "Alexander", winner: "SAC", games_in_series: 7 },
  { user_id: "u3", profile_name: "David", winner: "PAC", games_in_series: 5 },
  { user_id: "u4", profile_name: "Fabian", winner: "PAC", games_in_series: 6 },
  { user_id: "u5", profile_name: "Hannes", winner: "SAC", games_in_series: 6 },
];

const seriesResult = { winner: "PAC", games_played: 6 };

const computePts = (pick: { winner: string; games_in_series: number }) => {
  if (seriesResult.winner === pick.winner) {
    return seriesResult.games_played === pick.games_in_series ? 3 : 2;
  }
  return 0;
};

const DemoMatchDetail = () => {
  const navigate = useNavigate();
  const awayScore = 108;
  const homeScore = 112;
  const seriesAway = 2;
  const seriesHome = 3;
  const gameNumber = 6;
  const date = "Apr 28";

  // Demo "your pick"
  const userPick = { winner: "PAC", games_in_series: 6 };
  const pickedTeam = userPick.winner === home.abbreviation ? home : away;
  const userPts = computePts(userPick);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${away.color}40 0%, ${away.color}40 50%, ${home.color}40 50%, ${home.color}40 100%)`,
          }}
        />
        <div className="relative container py-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <p className="text-xs font-body font-semibold uppercase tracking-widest mb-4 text-center text-primary-foreground">
            EAST  Conf. Semifinals · Game {gameNumber} · {date}
          </p>

          <div className="flex items-center justify-between gap-5 pt-[10px]">
            <div className="flex-1 text-center flex flex-col items-center relative">
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-body font-semibold">
                {away.seed}
              </span>
              <TeamLogo src={away.logo} alt={away.name} className="w-16 h-16 md:w-20 md:h-20" />
              <h2 className="font-display text-3xl md:text-4xl tracking-wider mt-2">
                {away.abbreviation}
              </h2>
            </div>

            <div className="text-center">
              <span className="text-[10px] text-muted-foreground font-body font-semibold uppercase tracking-widest -mt-6">
                Final
              </span>
              <div className="flex items-center gap-4">
                <span className="font-display text-5xl md:text-7xl">{awayScore}</span>
                <span className="text-muted-foreground font-display text-3xl">:</span>
                <span className="font-display text-5xl md:text-7xl">{homeScore}</span>
              </div>
              <p className="text-xs text-foreground font-body mt-2 uppercase tracking-wider font-normal">
                Series {seriesAway} – {seriesHome}
              </p>
            </div>

            <div className="flex-1 text-center flex flex-col items-center relative">
              <span className="absolute -right-1 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-body font-semibold">
                {home.seed}
              </span>
              <TeamLogo src={home.logo} alt={home.name} className="w-16 h-16 md:w-20 md:h-20" />
              <h2 className="font-display text-3xl md:text-4xl tracking-wider mt-2">
                {home.abbreviation}
              </h2>
            </div>
          </div>

          <div className="items-center justify-center gap-3 bg-transparent rounded-lg px-4 py-3 flex flex-row mt-[18px]">
            <span className="text-sm font-body uppercase tracking-wider text-primary-foreground">
              Your Pick
            </span>
            <TeamLogo src={pickedTeam.logo} alt={pickedTeam.name} className="w-7 h-7" />
            <span className="font-body font-semibold text-sm text-white">
              {pickedTeam.abbreviation}
            </span>
            <span className="font-body text-primary-foreground text-sm">
              in <span className="font-bold">{userPick.games_in_series}</span>
            </span>
            <span className="font-body text-primary font-medium text-sm">
              ·{" "}
              {userPts === 3
                ? "Shiiiiit 3 Points"
                : userPts === 2
                  ? "That's 2 Points"
                  : "0 Points, Bro"}
            </span>
          </div>
        </div>
      </div>

      <section className="container py-10">
        <h3 className="font-display text-2xl tracking-wider mb-6">All Picks</h3>
        <div className="rounded-lg border border-white/10 bg-[#22272E]/80 backdrop-blur-md overflow-hidden">
          {dummyPicks.map((pick, idx) => {
            const pTeam = pick.winner === home.abbreviation ? home : away;
            const pts = computePts(pick);
            return (
              <div
                key={pick.user_id}
                className={`flex items-center gap-4 p-4 ${
                  idx !== dummyPicks.length - 1 ? "border-b border-[#2B2F37]" : ""
                }`}
              >
                <div className="flex-1">
                  <p className="font-body font-semibold">{pick.profile_name}</p>
                  <p className="text-sm text-muted-foreground font-body">
                    Picks{" "}
                    <span className="font-semibold text-white">{pTeam.abbreviation}</span> in{" "}
                    <span className="font-bold text-white">{pick.games_in_series}</span>
                    <span className="ml-2 text-primary font-bold">· {pts} pts</span>
                  </p>
                </div>
                <TeamLogo src={pTeam.logo} alt={pTeam.name} className="w-8 h-8" />
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <Link to="/admin" className="text-primary font-body text-sm hover:underline">
            ← Back to Admin
          </Link>
        </div>
      </section>
    </div>
  );
};

export default DemoMatchDetail;
