import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBracketData } from "@/hooks/useBracketData";
import { useSeriesGames } from "@/hooks/useSeriesGames";
import { pickDefaultGameIdx, isNextUp as checkIsNextUp, formatTipOff } from "@/lib/seriesUtils";
import type { Match } from "@/data/playoffsData";

interface MatchDetailDialogProps {
  match: Match | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MatchDetailDialog = ({ match, open, onOpenChange }: MatchDetailDialogProps) => {
  const { user } = useAuth();
  const { data: bracketData } = useBracketData();
  const { data: seriesGames } = useSeriesGames(
    match?.id,
    match?.homeTeam.abbreviation,
    match?.awayTeam.abbreviation
  );

  const allGames = useMemo(() => seriesGames ?? [], [seriesGames]);
  const defaultIdx = useMemo(() => pickDefaultGameIdx(allGames), [allGames]);
  const activeGame = allGames.length > 0 ? allGames[defaultIdx] : null;

  const bracketSeriesId = useMemo(() => {
    if (!match) return null;
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

  const { data: seriesResult } = useQuery({
    queryKey: ["series-result", bracketSeriesId],
    queryFn: async () => {
      if (!bracketSeriesId) return null;
      const { data } = await supabase
        .from("series_results")
        .select("series_id, winner, games_played")
        .eq("series_id", bracketSeriesId)
        .maybeSingle();
      return data;
    },
    enabled: !!bracketSeriesId && open,
  });

  const { data: allPicks } = useQuery({
    queryKey: ["series-picks", bracketSeriesId],
    queryFn: async () => {
      if (!bracketSeriesId) return [];
      const { data } = await supabase
        .from("picks")
        .select("winner, games_in_series, profile_name, user_id")
        .eq("series_id", bracketSeriesId);
      return data ?? [];
    },
    enabled: !!bracketSeriesId && open,
  });

  if (!match) return null;

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
  const isUpcoming = displayStatus === "upcoming";
  const isNextUp = isUpcoming && checkIsNextUp(activeGame?.startsAt);

  const computePts = (pick: { winner: string; games_in_series: number }) => {
    if (!seriesResult) return null;
    if (seriesResult.winner === pick.winner) {
      return seriesResult.games_played === pick.games_in_series ? 3 : 2;
    }
    return 0;
  };

  const headerLabel = `${match.conference !== "Finals" ? `${match.conference === "East" ? "EAST" : "WEST"}  ` : ""}${match.round === "Conference Semifinals" ? "Conf. Semifinals" : match.round === "Conference Finals" ? "Conf. Finals" : match.round} · Game ${displayGameNum} · ${displayDate}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 bg-[#1A1E24]/95 backdrop-blur-md border-white/10 overflow-hidden">
        <DialogTitle className="sr-only">
          {displayAway.abbreviation} vs {displayHome.abbreviation}
        </DialogTitle>

        {/* Header — smaller matchup card with team-color gradient */}
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${displayAway.color}4D 0%, ${displayAway.color}4D 50%, ${displayHome.color}4D 50%, ${displayHome.color}4D 100%)`,
            }}
          />
          <div className="relative">
            <div className="px-4 py-2 flex items-center justify-center">
              <span className="text-xs text-white font-body uppercase tracking-wider text-center font-normal">
                {headerLabel}
              </span>
            </div>

            <div className="p-5 pt-3 flex items-center justify-between gap-2">
              {/* Away */}
              <div className="flex-1 flex items-center gap-1.5">
                {displayAway.seed && (
                  <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center shrink-0">
                    {displayAway.seed}
                  </span>
                )}
                <div>
                  <p className="tracking-wide text-xl" style={{ fontFamily: "'Saira Stencil One', sans-serif" }}>
                    {displayAway.abbreviation}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">{displayAway.name}</p>
                </div>
              </div>

              {/* Score */}
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
                      <span className="font-medium text-2xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>{displayAwayScore}</span>
                      <span className="text-muted-foreground font-body text-sm">—</span>
                      <span className="font-medium text-2xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>{displayHomeScore}</span>
                    </>
                  )}
                </div>
                <p className="text-xs font-body mt-1 font-medium text-muted-foreground">
                  Series {displaySeriesAway} – {displaySeriesHome}
                </p>
              </div>

              {/* Home */}
              <div className="flex-1 flex items-center gap-1.5 justify-end text-right">
                <div>
                  <p className="tracking-wide text-xl" style={{ fontFamily: "'Saira Stencil One', sans-serif" }}>
                    {displayHome.abbreviation}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">{displayHome.name}</p>
                </div>
                {displayHome.seed && (
                  <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center shrink-0">
                    {displayHome.seed}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* All Picks */}
        <div className="px-5 py-5 max-h-[calc(60vh+40px)] overflow-y-auto">
          <h3 className="font-display text-xl tracking-wider mb-4">All Picks</h3>
          {allPicks && allPicks.length > 0 ? (
            <div className="rounded-lg border border-white/10 bg-[#22272E]/80 overflow-hidden">
              {allPicks.map((pick, idx) => {
                const pickedTeam =
                  pick.winner === match.homeTeam.abbreviation ? match.homeTeam : match.awayTeam;
                const isCurrentUser = user && pick.user_id === user.id;
                const pts = computePts(pick);
                return (
                  <div
                    key={pick.user_id}
                    className={`flex items-stretch gap-4 p-3 ${
                      idx !== allPicks.length - 1 ? "border-b border-[#2B2F37]" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0 self-center">
                      <p className="font-body font-semibold text-sm">
                        {pick.profile_name || "Anonymous"}
                        {isCurrentUser && <span className="text-xs text-primary ml-2">(You)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground font-body">
                        Picks{" "}
                        <span className="font-semibold text-white">{pickedTeam.abbreviation}</span>{" "}
                        in <span className="font-bold text-white">{pick.games_in_series}</span>
                        {pts !== null && (
                          <span className="ml-2 text-primary font-bold">· {pts} pts</span>
                        )}
                      </p>
                    </div>
                    <div
                      className="self-stretch -my-3 -mr-3 flex items-center justify-center px-2 shrink-0"
                      style={{
                        width: "100px",
                        maxWidth: "100px",
                        background: `linear-gradient(135deg, transparent 0%, transparent 50%, ${pickedTeam.color}4D 50%, ${pickedTeam.color}4D 100%)`,
                      }}
                    >
                      <span
                        className="tracking-wide text-xl text-white text-center leading-tight"
                        style={{ fontFamily: "'Saira Stencil One', sans-serif" }}
                      >
                        {pickedTeam.abbreviation}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground font-body text-sm">No picks yet for this series.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchDetailDialog;
