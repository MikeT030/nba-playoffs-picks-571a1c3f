import { useState, useEffect } from "react";
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
  bracketSeries,
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

  const teamsReady = !!topTeam && !!bottomTeam && topTeam.abbreviation !== "TBD" && bottomTeam.abbreviation !== "TBD";

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
    if (!team || team.abbreviation === "TBD") {
      return (
        <div className="flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-dashed border-muted-foreground/20">
          <span className="text-3xl opacity-30">🏀</span>
          <div className="flex items-center gap-1">
            {team?.seed && <span className="text-xs text-muted-foreground/50 font-body font-semibold">{team.seed}</span>}
            <span className="font-display text-lg tracking-wide text-muted-foreground/50">TBD</span>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={() => handlePickWinner(team.abbreviation)}
        disabled={locked}
        className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 ${
          isSelected
            ? "border-primary bg-primary/10"
            : locked
              ? "border-transparent opacity-60"
              : "border-transparent hover:border-muted-foreground/30"
        }`}
      >
        <TeamLogo src={team.logo} alt={team.name} className="w-12 h-12" />
        <div className="flex items-center gap-1">
          {team.seed && <span className="text-xs text-muted-foreground font-body font-semibold">{team.seed}</span>}
          <span className="font-display text-lg tracking-wide">{team.abbreviation}</span>
        </div>
        {isSelected && <Check size={16} className="text-primary" />}
      </button>
    );
  };

  return (
    <div className={`bg-card rounded-lg p-5 ${locked ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground font-body font-medium uppercase tracking-wider">
          {series.round} · {series.conference}
        </p>
        {locked && <Lock size={14} className="text-muted-foreground" />}
      </div>

      <div className="flex items-center gap-4 mb-4">
        {renderTeamSlot(topTeam, selectedWinner === topTeam?.abbreviation)}
        <span className="text-muted-foreground font-body text-sm">VS</span>
        {renderTeamSlot(bottomTeam, selectedWinner === bottomTeam?.abbreviation)}
      </div>

      {teamsReady && !locked && (
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground font-body mr-1">In</span>
          {[4, 5, 6, 7].map((games) => (
            <button
              key={games}
              onClick={() => handlePickGames(games)}
              className={`w-9 h-9 rounded-md font-display text-sm transition-all duration-200 ${
                selectedGames === games
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {games}
            </button>
          ))}
          <span className="text-xs text-muted-foreground font-body ml-1">games</span>
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

const BetsDrawer = ({ open, onOpenChange, onBetsSaved }: { open: boolean; onOpenChange: (open: boolean) => void; onBetsSaved?: () => void }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState("");
  const [bets, setBets] = useState<BetSelection[]>([]);
  const [selectedRound, setSelectedRound] = useState(roundOrder[0]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

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
    const { topTeam, bottomTeam } = resolveSeriesTeams(series.id, picks);
    const top = topTeam ?? series.topTeam;
    const bottom = bottomTeam ?? series.bottomTeam;
    return !!top && !!bottom && top.abbreviation !== "TBD" && bottom.abbreviation !== "TBD";
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
              <p className="text-muted-foreground font-body text-center text-sm">Sign in to make your picks</p>
            </DrawerHeader>
            <div className="flex justify-center">
              <Button
                className="font-display tracking-wider"
                onClick={() => {
                  onOpenChange(false);
                  navigate("/auth");
                }}
              >
                SIGN IN
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  if (!profileName) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          <div className="overflow-y-auto px-4 pb-8">
            <DrawerHeader className="pt-4 pb-2">
              <DrawerTitle className="font-display text-4xl tracking-wider text-center">
                MAKE YOUR PICKS
              </DrawerTitle>
              <p className="text-muted-foreground font-body text-center text-sm">What's your name?</p>
            </DrawerHeader>
            <div className="max-w-xs mx-auto space-y-4">
              <Input
                placeholder="Your name"
                className="font-body text-center"
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                    const name = (e.target as HTMLInputElement).value.trim();
                    setProfileName(name);
                    // Persist name to profiles table immediately
                    if (user) {
                      await supabase
                        .from("profiles")
                        .upsert({ user_id: user.id, display_name: name }, { onConflict: "user_id" });
                    }
                  }
                }}
              />
              <p className="text-xs text-muted-foreground font-body text-center">Press Enter to continue</p>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <div className="overflow-y-auto">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <h2 className="font-display text-xl tracking-wider">MAKE YOUR PICKS</h2>
                <p className="text-xs text-muted-foreground font-body">{profileName}'s picks</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-primary" />
              <span className="font-body text-sm text-muted-foreground">{betCount}/{totalSeries}</span>
            </div>
          </div>

          <div className="px-4 py-6">
            <div className="flex gap-2 mb-6 flex-wrap">
              {roundOrder.map((round) => {
                const unlocked = isRoundUnlocked(round);
                return (
                  <button
                    key={round}
                    onClick={() => unlocked && setSelectedRound(round)}
                    disabled={!unlocked}
                    className={`px-4 py-2 rounded-lg font-body text-sm transition-all duration-200 flex items-center gap-2 ${
                      selectedRound === round
                        ? "bg-primary text-primary-foreground"
                        : unlocked
                          ? "bg-card text-foreground"
                          : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                    }`}
                  >
                    {round}
                    {unlocked && round !== "First Round" && <Check size={14} />}
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
                      const resolvedTeams = resolveSeriesTeams(series.id, picks);
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
                <Button size="lg" className="font-display text-lg tracking-wider" onClick={handleNextRound}>
                  NEXT ROUND →
                </Button>
              </div>
            )}

            {currentRoundComplete && isLastRound && (
              <div className="mt-8 text-center">
                <Button
                  size="lg"
                  className="font-display text-lg tracking-wider"
                  onClick={handleSaveBets}
                  disabled={saving}
                >
                  {saving ? "SAVING..." : "SAVE BETS ✅"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default BetsDrawer;
