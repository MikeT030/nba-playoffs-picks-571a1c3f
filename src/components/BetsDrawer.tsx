import { useState, useEffect, useRef } from "react";
import { Check, Lock, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import TeamLogo from "@/components/TeamLogo";
import {
  bracketSeries as defaultBracketSeries,
  resolveSeriesTeams,
  type BracketSeries,
  type Team,
} from "@/data/playoffsData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BetSelection {
  seriesId: string;
  winner: string;
  gamesInSeries: number;
}

const roundOrder = [
  "First Round",
  "Conference Semifinals",
  "Conference Finals",
  "Finals",
];

const SeriesCard = ({
  series,
  topTeam,
  bottomTeam,
  bet,
  onBet,
  locked,
}: {
  series: BracketSeries;
  topTeam?: Team;
  bottomTeam?: Team;
  bet?: BetSelection;
  onBet: (seriesId: string, winner: string, games: number) => void;
  locked: boolean;
}) => {
  const selectedWinner = bet?.winner ?? null;
  const [selectedGames, setSelectedGames] = useState<number>(bet?.gamesInSeries ?? 4);

  const teamsReady = !!topTeam && !!bottomTeam;

  const handlePickWinner = (abbr: string) => {
    if (locked || !teamsReady) return;
    onBet(series.id, abbr, selectedGames);
  };

  const handlePickGames = (games: number) => {
    if (locked || !teamsReady) return;
    setSelectedGames(games);
    if (selectedWinner) {
      onBet(series.id, selectedWinner, games);
    }
  };

  const renderTeamSlot = (team: Team | undefined, isSelected: boolean) => {
    if (!team) {
      return (
        <div className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 border-dashed border-muted-foreground/20">
          <span className="text-2xl opacity-30">🏀</span>
          <div className="flex items-center gap-1">
            <span className="font-display text-base tracking-wide text-muted-foreground/50">TBD</span>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={() => handlePickWinner(team.abbreviation)}
        disabled={locked}
        className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all duration-200 ${
          isSelected
            ? "border-primary bg-primary/10"
            : locked
              ? "border-transparent opacity-60"
              : "border-transparent hover:border-muted-foreground/30"
        }`}
      >
        <TeamLogo src={team.logo} alt={team.name} className="w-10 h-10" />
        <div className="flex items-center gap-1">
          {team.seed && <span className="text-[11px] text-muted-foreground font-body font-semibold">{team.seed}</span>}
          <span className="font-display text-base tracking-wide">{team.abbreviation}</span>
        </div>
        {isSelected && <Check size={14} className="text-primary" />}
      </button>
    );
  };

  return (
    <div className={`bg-card rounded-lg p-3.5 ${locked ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[11px] text-muted-foreground font-body font-medium uppercase tracking-wider">
          {series.round} · {series.conference}
        </p>
        {locked && <Lock size={14} className="text-muted-foreground" />}
      </div>

      <div className="flex items-center gap-3 mb-2">
        {renderTeamSlot(topTeam, selectedWinner === topTeam?.abbreviation)}
        <span className="text-muted-foreground font-body text-xs">VS</span>
        {renderTeamSlot(bottomTeam, selectedWinner === bottomTeam?.abbreviation)}
      </div>

      {teamsReady && !locked && (
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-[11px] text-muted-foreground font-body mr-1">In</span>
          {[4, 5, 6, 7].map((games) => (
            <button
              key={games}
              onClick={() => handlePickGames(games)}
              className={`w-8 h-8 rounded-full font-display text-xs transition-all duration-200 ${
                selectedGames === games
                  ? "bg-primary/15 text-primary border border-primary/40"
                  : "bg-muted text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              {games}
            </button>
          ))}
          <span className="text-[11px] text-muted-foreground font-body ml-1">games</span>
        </div>
      )}

      {!teamsReady && !locked && (
        <p className="text-center text-xs text-muted-foreground/60 font-body italic">
          Pick winners in previous rounds to unlock
        </p>
      )}
    </div>
  );
};

const BetsDrawer = ({ open, onOpenChange, onBetsSaved, resolvedBracket }: { open: boolean; onOpenChange: (open: boolean) => void; onBetsSaved?: () => void; resolvedBracket?: BracketSeries[] }) => {
  const bracketSeries = resolvedBracket ?? defaultBracketSeries;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState("");
  const [bets, setBets] = useState<BetSelection[]>([]);
  const [selectedRound, setSelectedRound] = useState(roundOrder[0]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load existing profile name and picks when drawer opens
  useEffect(() => {
    if (!open || !user || loaded) return;
    const loadData = async () => {
      const [profileRes, picksRes] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("picks").select("series_id, winner, games_in_series").eq("user_id", user.id),
      ]);
      if (profileRes.data?.display_name) {
        setProfileName(profileRes.data.display_name);
      }
      if (picksRes.data && picksRes.data.length > 0) {
        const loadedBets: BetSelection[] = picksRes.data.map((p) => ({
          seriesId: p.series_id,
          winner: p.winner,
          gamesInSeries: p.games_in_series,
        }));
        setBets(loadedBets);
      }
      setLoaded(true);
    };
    loadData();
  }, [open, user, loaded]);

  // Reset loaded state when drawer closes so it reloads next time
  useEffect(() => {
    if (!open) setLoaded(false);
  }, [open]);

  const picks: Record<string, string> = {};
  for (const bet of bets) picks[bet.seriesId] = bet.winner;

  const clearDownstreamBets = (changedSeriesId: string, currentBets: BetSelection[]): BetSelection[] => {
    const dependentIds = bracketSeries
      .filter((series) => series.topParentSeriesId === changedSeriesId || series.bottomParentSeriesId === changedSeriesId)
      .map((series) => series.id);

    if (dependentIds.length === 0) return currentBets;

    let cleaned = currentBets.filter((bet) => !dependentIds.includes(bet.seriesId));
    for (const dependentId of dependentIds) {
      cleaned = clearDownstreamBets(dependentId, cleaned);
    }
    return cleaned;
  };

  const handleBet = (seriesId: string, winner: string, games: number) => {
    setBets((prev) => {
      const filtered = prev.filter((bet) => bet.seriesId !== seriesId);
      const cleared = clearDownstreamBets(seriesId, filtered);
      return [...cleared, { seriesId, winner, gamesInSeries: games }];
    });
  };

  const isBettable = (series: BracketSeries): boolean => {
    const { topTeam, bottomTeam } = resolveSeriesTeams(series.id, picks, bracketSeries);
    const top = topTeam ?? series.topTeam;
    const bottom = bottomTeam ?? series.bottomTeam;
    return !!top && !!bottom;
  };

  const isRoundUnlocked = (round: string): boolean => {
    const roundIndex = roundOrder.indexOf(round);
    if (roundIndex === 0) return true;

    const previousRound = roundOrder[roundIndex - 1];
    const previousSeries = bracketSeries.filter((series) => series.round === previousRound);
    const bettablePreviousSeries = previousSeries.filter(isBettable);

    return bettablePreviousSeries.length > 0 && bettablePreviousSeries.every((series) => picks[series.id]);
  };

  const selectedRoundSeries = bracketSeries.filter((series) => series.round === selectedRound);
  const bettableSelectedRoundSeries = selectedRoundSeries.filter(isBettable);
  const currentRoundComplete =
    bettableSelectedRoundSeries.length > 0 &&
    bettableSelectedRoundSeries.every((series) => picks[series.id]);

  const currentRoundIndex = roundOrder.indexOf(selectedRound);
  const isLastRound = currentRoundIndex === roundOrder.length - 1;
  const totalSeries = bracketSeries.length;
  const betCount = bets.length;

  const handleNextRound = () => {
    if (currentRoundComplete && !isLastRound) {
      setSelectedRound(roundOrder[currentRoundIndex + 1]);
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSaveBets = async () => {
    if (!user) {
      navigate("/auth");
      onOpenChange(false);
      return;
    }

    if (!profileName.trim()) {
      toast.error("Enter your name first");
      return;
    }

    setSaving(true);
    try {
      // Delete existing picks for this user
      await supabase.from("picks").delete().eq("user_id", user.id);

      // Insert all new picks
      const rows = bets.map((bet) => ({
        user_id: user.id,
        profile_name: profileName.trim(),
        series_id: bet.seriesId,
        winner: bet.winner,
        games_in_series: bet.gamesInSeries,
      }));

      const { error } = await supabase.from("picks").insert(rows);
      if (error) throw error;

      toast.success("Picks saved!");
      onBetsSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save picks");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          <div className="overflow-y-auto px-4 pb-8">
            <DrawerHeader className="pt-4 pb-2">
              <DrawerTitle className="font-display text-4xl tracking-wider text-center">
                MAKE YOUR PICKS
              </DrawerTitle>
              <p className="text-muted-foreground font-body text-center text-sm">Sign in / Sign up to make your picks</p>
            </DrawerHeader>
            <div className="flex justify-center">
              <button
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20 w-full max-w-xs"
                onClick={() => {
                  onOpenChange(false);
                  navigate("/auth");
                }}
              >
                SIGN IN / SIGN UP
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  if (!profileName) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[92vh]">
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
            <DrawerHeader className="pt-4 pb-2">
              <DrawerTitle className="font-display text-4xl tracking-wider text-center">
                MAKE YOUR PICKS
              </DrawerTitle>
              <p className="text-muted-foreground font-body text-center text-sm">What's your name?</p>
            </DrawerHeader>
            <div className="max-w-xs mx-auto space-y-4">
              <Input
                id="picks-name-input"
                placeholder="Your name"
                className="font-body text-center"
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                    const name = (e.target as HTMLInputElement).value.trim();
                    setProfileName(name);
                    if (user) {
                      await supabase
                        .from("profiles")
                        .upsert({ user_id: user.id, display_name: name }, { onConflict: "user_id" });
                    }
                  }
                }}
              />
              <button
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20"
                onClick={async () => {
                  const input = document.getElementById("picks-name-input") as HTMLInputElement | null;
                  const name = input?.value.trim();
                  if (!name) return;
                  setProfileName(name);
                  if (user) {
                    await supabase
                      .from("profiles")
                      .upsert({ user_id: user.id, display_name: name }, { onConflict: "user_id" });
                  }
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh]">
        <div ref={scrollRef} className="overflow-y-auto pb-24">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <h2 className="font-display text-xl tracking-wider">MAKE YOUR PICKS,</h2>
                <h2 className="font-display text-xl tracking-wider">{profileName?.toUpperCase()}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-body text-sm text-muted-foreground">{betCount}/{totalSeries}</span>
            </div>
          </div>

          {bets.length === 0 && profileName && (
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2 max-w-xs">
                <Input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your name"
                  className="font-body text-sm"
                  onBlur={async () => {
                    if (user && profileName.trim()) {
                      await supabase
                        .from("profiles")
                        .upsert({ user_id: user.id, display_name: profileName.trim() }, { onConflict: "user_id" });
                    }
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && profileName.trim()) {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                />
              </div>
            </div>
          )}

          <div className="px-4 py-6">
            <div className="flex gap-2 mb-6 flex-wrap">
              {roundOrder.map((round) => {
                const unlocked = isRoundUnlocked(round);
                return (
                  <button
                    key={round}
                    onClick={() => unlocked && setSelectedRound(round)}
                    disabled={!unlocked}
                    className={`px-4 py-2 rounded-full font-body text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      selectedRound === round
                        ? "bg-primary/15 text-primary border border-primary/40"
                        : unlocked
                          ? "bg-card text-foreground border border-transparent"
                          : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed border border-transparent"
                    }`}
                  >
                    {round}
                    {unlocked && bracketSeries.filter((s) => s.round === round).every((s) => picks[s.id]) && <Check size={14} />}
                    {!unlocked && <span className="text-xs">🔒</span>}
                  </button>
                );
              })}
            </div>

            {(selectedRound !== "Finals" ? ["West", "East"] : ["Finals"]).map((conference) => {
              const conferenceSeries = selectedRoundSeries.filter((series) => series.conference === conference);
              if (!conferenceSeries.length) return null;

              return (
                <div key={conference} className="mb-8">
                  {conference !== "Finals" && (
                    <h3 className="font-display text-lg tracking-wider text-foreground mb-3">
                      {conference === "East" ? "Eastern Conference" : "Western Conference"}
                    </h3>
                  )}
                  <div className="grid gap-4 md:grid-cols-2">
                    {conferenceSeries.map((series) => {
                      const resolvedTeams = resolveSeriesTeams(series.id, picks, bracketSeries);
                      return (
                        <SeriesCard
                          key={series.id}
                          series={series}
                          topTeam={resolvedTeams.topTeam ?? series.topTeam}
                          bottomTeam={resolvedTeams.bottomTeam ?? series.bottomTeam}
                          bet={bets.find((bet) => bet.seriesId === series.id)}
                          onBet={handleBet}
                          locked={!isRoundUnlocked(series.round)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {currentRoundComplete && !isLastRound && (
              <div className="mt-8 text-center">
                <button className="mx-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20" onClick={handleNextRound}>
                  NEXT ROUND →
                </button>
              </div>
            )}

            {currentRoundComplete && isLastRound && (
              <div className="mt-8 text-center">
                <button
                  className="mx-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20 disabled:opacity-50"
                  onClick={handleSaveBets}
                  disabled={saving}
                >
                  {saving ? "SAVING..." : "SAVE BETS"}
                </button>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default BetsDrawer;
