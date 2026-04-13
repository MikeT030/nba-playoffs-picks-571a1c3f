import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Trophy, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TeamLogo from "@/components/TeamLogo";
import { bracketSeries, resolveSeriesTeams, type BracketSeries, type Team } from "@/data/playoffsData";

const participants = [
  { name: "Erik", avatar: "🎣" },
  { name: "Alexander", avatar: "😎" },
  { name: "David", avatar: "🎬" },
  { name: "Fabian", avatar: "🏔️" },
  { name: "Hannes", avatar: "🌄" },
  { name: "Jörn", avatar: "🎿" },
  { name: "Larsn", avatar: "🐕" },
  { name: "Michi", avatar: "🎸" },
  { name: "Momentum", avatar: "🚀" },
  { name: "Simon", avatar: "📡" },
  { name: "Sven", avatar: "🐶" },
];

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

const ProfileSelect = ({ onSelect }: { onSelect: (name: string) => void }) => {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onSelect(trimmed);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <Link to="/" className="absolute top-6 left-6 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={24} />
      </Link>
      <h1 className="font-display text-5xl md:text-7xl tracking-wider mb-2">MAKE YOUR BETS</h1>
      <p className="text-muted-foreground font-body mb-10">What's your name?</p>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <Input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="font-body text-center"
          autoFocus
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20 disabled:opacity-50"
        >
          CONTINUE
        </button>
      </form>
    </div>
  );
};

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

  const teamsReady = topTeam && bottomTeam;

  const handlePickWinner = (abbr: string) => {
    if (locked || !teamsReady) return;
    onBet(series.id, abbr, selectedGames);
  };

  const handlePickGames = (g: number) => {
    if (locked || !teamsReady) return;
    setSelectedGames(g);
    if (selectedWinner) {
      onBet(series.id, selectedWinner, g);
    }
  };

  const renderTeamSlot = (team: Team | undefined, isSelected: boolean) => {
    if (!team) {
      return (
        <div className="flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-dashed border-muted-foreground/20">
          <span className="text-3xl opacity-30">🏀</span>
          <span className="font-display text-lg tracking-wide text-muted-foreground/50">TBD</span>
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
        <span className="font-display text-lg tracking-wide">{team.abbreviation}</span>
        <span className="text-[10px] text-muted-foreground font-body hidden sm:block">{team.name}</span>
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
          {[4, 5, 6, 7].map((g) => (
            <button
              key={g}
              onClick={() => handlePickGames(g)}
              className={`w-9 h-9 rounded-md font-display text-sm transition-all duration-200 ${
                selectedGames === g
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {g}
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

const MakeYourBets = () => {
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [bets, setBets] = useState<BetSelection[]>([]);
  const [selectedRound, setSelectedRound] = useState(roundOrder[0]);

  // Build picks map from bets
  const picks: Record<string, string> = {};
  for (const bet of bets) {
    picks[bet.seriesId] = bet.winner;
  }

  const handleBet = (seriesId: string, winner: string, games: number) => {
    setBets((prev) => {
      const filtered = prev.filter((b) => b.seriesId !== seriesId);
      // Also clear any downstream bets that depended on the old pick
      const clearedDownstream = clearDownstreamBets(seriesId, filtered);
      return [...clearedDownstream, { seriesId, winner, gamesInSeries: games }];
    });
  };

  // When a pick changes, remove bets for series that depend on it
  const clearDownstreamBets = (changedSeriesId: string, currentBets: BetSelection[]): BetSelection[] => {
    const dependentIds = bracketSeries
      .filter((s) => s.topParentSeriesId === changedSeriesId || s.bottomParentSeriesId === changedSeriesId)
      .map((s) => s.id);

    if (dependentIds.length === 0) return currentBets;

    let cleaned = currentBets.filter((b) => !dependentIds.includes(b.seriesId));
    for (const depId of dependentIds) {
      cleaned = clearDownstreamBets(depId, cleaned);
    }
    return cleaned;
  };

  const seriesForRound = bracketSeries.filter((s) => s.round === selectedRound);

  // A series is bettable if both teams are known (not TBD)
  const isBettable = (series: BracketSeries): boolean => {
    const { topTeam, bottomTeam } = resolveSeriesTeams(series.id, picks);
    const top = topTeam ?? series.topTeam;
    const bottom = bottomTeam ?? series.bottomTeam;
    return !!top && !!bottom;
  };

  // Check if previous round is fully bet (only bettable series count)
  const isRoundUnlocked = (round: string): boolean => {
    const idx = roundOrder.indexOf(round);
    if (idx === 0) return true;
    const prevRound = roundOrder[idx - 1];
    const prevSeries = bracketSeries.filter((s) => s.round === prevRound);
    const bettablePrev = prevSeries.filter(isBettable);
    return bettablePrev.length > 0 && bettablePrev.every((s) => picks[s.id]);
  };

  // Check if current round is complete
  const currentRoundSeries = bracketSeries.filter((s) => s.round === selectedRound);
  const bettableCurrent = currentRoundSeries.filter(isBettable);
  const currentRoundComplete = bettableCurrent.length > 0 && bettableCurrent.every((s) => picks[s.id]);
  const currentRoundIndex = roundOrder.indexOf(selectedRound);
  const isLastRound = currentRoundIndex === roundOrder.length - 1;

  const handleNextRound = () => {
    if (currentRoundComplete && !isLastRound) {
      setSelectedRound(roundOrder[currentRoundIndex + 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const participant = participants.find((p) => p.name === selectedProfile);
  const totalSeries = bracketSeries.length;
  const betCount = bets.length;

  if (!selectedProfile) {
    return <ProfileSelect onSelect={setSelectedProfile} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{participant?.avatar}</span>
              <div>
                <h1 className="font-display text-2xl tracking-wider">MAKE YOUR BETS</h1>
                <p className="text-xs text-muted-foreground font-body">{selectedProfile}'s picks</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-primary" />
            <span className="font-body text-sm text-muted-foreground">
              {betCount}/{totalSeries}
            </span>
          </div>
        </div>
      </div>

      {/* Bets */}
      <section className="container py-8">
        {/* Round tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {roundOrder.map((round) => {
            const unlocked = isRoundUnlocked(round);
            const prevRoundIdx = roundOrder.indexOf(round) - 1;
            const prevComplete = prevRoundIdx < 0 || bracketSeries.filter((s) => s.round === roundOrder[prevRoundIdx]).every((s) => picks[s.id]);

            return (
              <button
                key={round}
                onClick={() => unlocked && setSelectedRound(round)}
                disabled={!unlocked}
                className={`px-4 py-2 rounded-lg font-body text-sm transition-all duration-200 flex items-center gap-2 ${
                  selectedRound === round
                    ? "bg-primary text-primary-foreground"
                    : unlocked
                    ? "bg-card text-foreground hover:border-primary/60"
                    : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                }`}
              >
                {round}
                {unlocked && prevComplete && prevRoundIdx >= 0 && <Check size={14} />}
                {!unlocked && <span className="text-xs">🔒</span>}
              </button>
            );
          })}
        </div>

        {(selectedRound !== "Finals" ? ["West", "East"] : ["Finals"]).map((conf) => {
          const confSeries = seriesForRound.filter((s) => s.conference === conf);
          if (!confSeries.length) return null;

          return (
            <div key={conf} className="mb-8">
              {conf !== "Finals" && (
                <h3 className="font-display text-lg tracking-wider text-foreground mb-3">
                  {conf === "East" ? "Eastern Conference" : "Western Conference"}
                </h3>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {confSeries.map((series) => {
                  const { topTeam, bottomTeam } = resolveSeriesTeams(series.id, picks);
                  const locked = !isRoundUnlocked(series.round);

                  return (
                    <SeriesCard
                      key={series.id}
                      series={series}
                      topTeam={topTeam ?? series.topTeam}
                      bottomTeam={bottomTeam ?? series.bottomTeam}
                      bet={bets.find((b) => b.seriesId === series.id)}
                      onBet={handleBet}
                      locked={locked}
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
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-6 py-4">
              <Trophy size={24} className="text-primary" />
              <span className="font-display text-xl tracking-wider">ALL BETS PLACED!</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default MakeYourBets;
