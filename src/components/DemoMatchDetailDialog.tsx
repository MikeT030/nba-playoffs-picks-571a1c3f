import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import DemoMatchCardColored, {
  DEFAULT_MATCH_DATA,
  type DemoMatchData,
} from "@/components/DemoMatchCardColored";

/**
 * Demo modal/layer matchup detail.
 * Trigger is the DemoMatchCardColored card itself.
 * Header is a smaller version of the matchup card.
 * Body shows the "All Picks" list (mirrors DemoMatchDetail / MatchDetail).
 * Closes on X click or click outside.
 */

export interface DemoPick {
  user_id: string;
  profile_name: string;
  winner: string;
  games_in_series: number;
}

interface DemoMatchDetailDialogProps {
  data?: DemoMatchData;
  picks?: DemoPick[];
  seriesResult?: { winner: string; games_played: number };
  heading?: string;
}

const DEFAULT_PICKS: DemoPick[] = [
  { user_id: "u1", profile_name: "Erik", winner: "PAC", games_in_series: 6 },
  { user_id: "u2", profile_name: "Alexander", winner: "SAC", games_in_series: 7 },
  { user_id: "u3", profile_name: "David", winner: "PAC", games_in_series: 5 },
  { user_id: "u4", profile_name: "Fabian", winner: "PAC", games_in_series: 6 },
  { user_id: "u5", profile_name: "Hannes", winner: "SAC", games_in_series: 6 },
];

const DEFAULT_SERIES_RESULT = { winner: "PAC", games_played: 6 };

const DemoMatchDetailDialog = ({
  data = DEFAULT_MATCH_DATA,
  picks = DEFAULT_PICKS,
  seriesResult = DEFAULT_SERIES_RESULT,
  heading = "DEMO MATCH DETAIL — LAYER",
}: DemoMatchDetailDialogProps = {}) => {
  const [open, setOpen] = useState(false);
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
  } = data;

  const computePts = (pick: { winner: string; games_in_series: number }) => {
    if (seriesResult.winner === pick.winner) {
      return seriesResult.games_played === pick.games_in_series ? 3 : 2;
    }
    return 0;
  };

  return (
    <div className="space-y-2">
      <h2 className="font-display text-lg tracking-wider text-muted-foreground">
        {heading}
      </h2>
      <DemoMatchCardColored data={data} onClick={() => setOpen(true)} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0 gap-0 bg-[#1A1E24]/95 backdrop-blur-md border-white/10 overflow-hidden">
          <DialogTitle className="sr-only">Match Detail</DialogTitle>

          {/* Header — smaller matchup card */}
          <div className="relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(135deg, ${away.color}66 0%, ${away.color}66 50%, ${home.color}66 50%, ${home.color}66 100%)`,
              }}
            />
            <div className="relative">
              <div className="px-4 py-2 flex items-center justify-center">
                <span className="text-xs text-white font-body uppercase tracking-wider text-center font-normal">
                  {conference}  {round} · Game {gameNumber} · {date}
                </span>
              </div>

              <div className="p-5 pt-3 flex items-center justify-between gap-2">
                {/* Away */}
                <div className="flex-1 flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center shrink-0">
                    {away.seed}
                  </span>
                  <div>
                    <p
                      className="tracking-wide text-lg"
                      style={{ fontFamily: "'Saira Stencil One', sans-serif" }}
                    >
                      {away.abbreviation}
                    </p>
                    <p className="text-xs text-muted-foreground font-body">
                      {away.name}
                    </p>
                  </div>
                </div>

                {/* Score */}
                <div className="text-center shrink-0">
                  <div className="h-0">
                    <span className="text-muted-foreground font-body font-semibold uppercase tracking-widest block -translate-y-5 text-xs">
                      Final
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-medium text-lg"
                      style={{ fontFamily: "'Orbitron', sans-serif" }}
                    >
                      {awayScore}
                    </span>
                    <span className="text-muted-foreground font-body text-sm">
                      —
                    </span>
                    <span
                      className="font-medium text-lg"
                      style={{ fontFamily: "'Orbitron', sans-serif" }}
                    >
                      {homeScore}
                    </span>
                  </div>
                  <p className="text-xs font-body mt-1 font-medium text-muted-foreground">
                    Series {seriesAway} – {seriesHome}
                  </p>
                </div>

                {/* Home */}
                <div className="flex-1 flex items-center gap-1.5 justify-end text-right">
                  <div>
                    <p
                      className="tracking-wide text-lg"
                      style={{ fontFamily: "'Saira Stencil One', sans-serif" }}
                    >
                      {home.abbreviation}
                    </p>
                    <p className="text-xs text-muted-foreground font-body">
                      {home.name}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center shrink-0">
                    {home.seed}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* All Picks */}
          <div className="px-5 py-5 max-h-[calc(60vh+40px)] overflow-y-auto">
            <h3 className="font-display text-xl tracking-wider mb-4">All Picks</h3>
            <div className="rounded-lg border border-white/10 bg-[#22272E]/80 overflow-hidden">
              {picks.map((pick, idx) => {
                const pTeam = pick.winner === home.abbreviation ? home : away;
                const pts = computePts(pick);
                return (
                  <div
                    key={pick.user_id}
                    className={`flex items-center gap-4 p-3 ${
                      idx !== picks.length - 1
                        ? "border-b border-[#2B2F37]"
                        : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-sm">
                        {pick.profile_name}
                      </p>
                      <p className="text-xs text-muted-foreground font-body">
                        Picks{" "}
                        <span className="font-semibold text-white">
                          {pTeam.abbreviation}
                        </span>{" "}
                        in{" "}
                        <span className="font-bold text-white">
                          {pick.games_in_series}
                        </span>
                        <span className="ml-2 text-primary font-bold">
                          · {pts} pts
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemoMatchDetailDialog;
