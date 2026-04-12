import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import TeamLogo from "@/components/TeamLogo";
import { usePlayoffGames } from "@/hooks/usePlayoffGames";
import type { Match } from "@/data/playoffsData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  matchId: string;
  winner: string; // team abbreviation
  gamesInSeries: number;
}

const ProfileSelect = ({ onSelect }: { onSelect: (name: string) => void }) => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
    <Link to="/" className="absolute top-6 left-6 text-muted-foreground hover:text-foreground transition-colors">
      <ArrowLeft size={24} />
    </Link>
    <h1 className="font-display text-5xl md:text-7xl tracking-wider mb-2">MAKE YOUR BETS</h1>
    <p className="text-muted-foreground font-body mb-10">Who are you?</p>
    <div className="grid grid-cols-3 gap-4 max-w-md w-full">
      {participants.map((p) => (
        <button
          key={p.name}
          onClick={() => onSelect(p.name)}
          className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border border-border hover:border-primary/60 hover:bg-muted transition-all duration-200 group"
        >
          <span className="text-3xl group-hover:scale-110 transition-transform">{p.avatar}</span>
          <span className="font-body text-sm font-medium text-foreground">{p.name}</span>
        </button>
      ))}
    </div>
  </div>
);

const SeriesCard = ({
  match,
  bet,
  onBet,
}: {
  match: Match;
  bet?: BetSelection;
  onBet: (matchId: string, winner: string, games: number) => void;
}) => {
  const [selectedWinner, setSelectedWinner] = useState<string | null>(bet?.winner ?? null);
  const [selectedGames, setSelectedGames] = useState<number>(bet?.gamesInSeries ?? 4);

  const handlePickWinner = (abbr: string) => {
    setSelectedWinner(abbr);
    onBet(match.id, abbr, selectedGames);
  };

  const handlePickGames = (g: number) => {
    setSelectedGames(g);
    if (selectedWinner) {
      onBet(match.id, selectedWinner, g);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <p className="text-xs text-muted-foreground font-body font-medium uppercase tracking-wider mb-4">
        {match.round} · Game {match.gameNumber}
      </p>

      <div className="flex items-center gap-4 mb-4">
        {/* Away team */}
        <button
          onClick={() => handlePickWinner(match.awayTeam.abbreviation)}
          className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 ${
            selectedWinner === match.awayTeam.abbreviation
              ? "border-primary bg-primary/10"
              : "border-transparent hover:border-muted-foreground/30"
          }`}
        >
          <TeamLogo src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-12 h-12" />
          <span className="font-display text-lg tracking-wide">{match.awayTeam.abbreviation}</span>
          <span className="text-[10px] text-muted-foreground font-body hidden sm:block">{match.awayTeam.name}</span>
          {selectedWinner === match.awayTeam.abbreviation && (
            <Check size={16} className="text-primary" />
          )}
        </button>

        <span className="text-muted-foreground font-body text-sm">VS</span>

        {/* Home team */}
        <button
          onClick={() => handlePickWinner(match.homeTeam.abbreviation)}
          className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 ${
            selectedWinner === match.homeTeam.abbreviation
              ? "border-primary bg-primary/10"
              : "border-transparent hover:border-muted-foreground/30"
          }`}
        >
          <TeamLogo src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-12 h-12" />
          <span className="font-display text-lg tracking-wide">{match.homeTeam.abbreviation}</span>
          <span className="text-[10px] text-muted-foreground font-body hidden sm:block">{match.homeTeam.name}</span>
          {selectedWinner === match.homeTeam.abbreviation && (
            <Check size={16} className="text-primary" />
          )}
        </button>
      </div>

      {/* Games in series */}
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
    </div>
  );
};

const roundOrder = [
  "First Round",
  "Conference Semifinals",
  "Conference Finals",
  "Finals",
];

const MakeYourBets = () => {
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [bets, setBets] = useState<BetSelection[]>([]);
  const [manuallyUnlocked, setManuallyUnlocked] = useState<string[]>([]);
  const { data: matches, isLoading } = usePlayoffGames();

  const handleBet = (matchId: string, winner: string, games: number) => {
    setBets((prev) => {
      const filtered = prev.filter((b) => b.matchId !== matchId);
      return [...filtered, { matchId, winner, gamesInSeries: games }];
    });
  };

  const [selectedRound, setSelectedRound] = useState(roundOrder[0]);

  const getUnlockedRounds = () => {
    const unlocked: string[] = [];
    for (const round of roundOrder) {
      unlocked.push(round);
      if (!manuallyUnlocked.includes(round)) {
        break;
      }
    }
    return unlocked;
  };

  const unlockedRounds = matches ? getUnlockedRounds() : [roundOrder[0]];

  const filteredMatches = matches?.filter((m) => m.round === selectedRound);

  const participant = participants.find((p) => p.name === selectedProfile);
  const totalMatches = matches?.length ?? 0;
  const betCount = bets.filter((b) => b.winner).length;

  // Check if current round is fully bet on
  const currentRoundMatches = matches?.filter((m) => m.round === selectedRound) ?? [];
  const currentRoundComplete = currentRoundMatches.length > 0 && currentRoundMatches.every((m) => bets.some((b) => b.matchId === m.id && b.winner));
  const currentRoundIndex = roundOrder.indexOf(selectedRound);
  const isLastRound = currentRoundIndex === roundOrder.length - 1;

  const handleNextRound = () => {
    if (currentRoundComplete && !isLastRound) {
      setManuallyUnlocked((prev) => [...prev, selectedRound]);
      setSelectedRound(roundOrder[currentRoundIndex + 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
              {betCount}/{totalMatches}
            </span>
          </div>
        </div>
      </div>

      {/* Bets grid */}
      <section className="container py-8">
        {/* Round tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {roundOrder.map((round) => {
            const isUnlocked = unlockedRounds.includes(round);
            const isCompleteAndUnlocked = manuallyUnlocked.includes(round);

            return (
              <button
                key={round}
                onClick={() => isUnlocked && setSelectedRound(round)}
                disabled={!isUnlocked}
                className={`px-4 py-2 rounded-lg font-body text-sm transition-all duration-200 flex items-center gap-2 ${
                  selectedRound === round
                    ? "bg-primary text-primary-foreground"
                    : isUnlocked
                    ? "bg-card border border-border text-foreground hover:border-primary/60"
                    : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed border border-border/30"
                }`}
              >
                {round}
                {isCompleteAndUnlocked && <Check size={14} />}
                {!isUnlocked && <span className="text-xs">🔒</span>}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border h-52 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {(selectedRound !== "Finals" ? ["East", "West"] : ["Finals"]).map((conf) => {
              const confMatches = filteredMatches?.filter((m) => m.conference === conf);
              if (!confMatches?.length) return null;
              return (
                <div key={conf} className="mb-8">
                  {conf !== "Finals" && (
                    <h3 className="font-display text-lg tracking-wider text-foreground mb-3">
                      {conf === "East" ? "Eastern Conference" : "Western Conference"}
                    </h3>
                  )}
                  <div className="grid gap-4 md:grid-cols-2">
                    {confMatches.map((match) => (
                      <SeriesCard
                        key={match.id}
                        match={match}
                        bet={bets.find((b) => b.matchId === match.id)}
                        onBet={handleBet}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {currentRoundComplete && !isLastRound && (
          <div className="mt-8 text-center">
            <Button size="lg" className="font-display text-lg tracking-wider" onClick={handleNextRound}>
              NEXT ROUND →
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};

export default MakeYourBets;
