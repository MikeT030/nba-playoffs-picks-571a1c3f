import { useState, useEffect } from "react";
import { PenLine, CheckCircle, Lock } from "lucide-react";
import HeroBanner from "@/components/HeroBanner";
import MatchCard from "@/components/MatchCard";
import BetsDrawer from "@/components/BetsDrawer";
import CardRouletteOverlay from "@/components/CardRouletteOverlay";
import CountdownTimer from "@/components/CountdownTimer";
import { usePlayoffGames } from "@/hooks/usePlayoffGames";
import { useBracketData } from "@/hooks/useBracketData";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerCard } from "@/hooks/usePlayerCard";
import { useAllUserPicks } from "@/hooks/useAllUserPicks";
import { useQueryClient } from "@tanstack/react-query";
import { ALL_MONOLOGUE_LINES, isPlayoffsStarted } from "@/data/buttonMonologue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TOTAL_GAMES = 15;

const rounds = [
  { value: "all", label: "All Rounds" },
  { value: "First Round", label: "First Round" },
  { value: "Conference Semifinals", label: "Conference Semifinals" },
  { value: "Conference Finals", label: "Conference Finals" },
  { value: "Finals", label: "Finals" },
];

const Index = () => {
  const { data: matches, isLoading } = usePlayoffGames();
  const { data: resolvedBracket } = useBracketData();
  const { user } = useAuth();
  const { assignedCardId, loading: cardLoading, assignRandomCard } = usePlayerCard();
  const { data: userPicks } = useAllUserPicks();
  const queryClient = useQueryClient();
  const [selectedRound, setSelectedRound] = useState("all");
  const [betsOpen, setBetsOpen] = useState(false);
  const [monologueIndex, setMonologueIndex] = useState(-1);
  const [rouletteCardId, setRouletteCardId] = useState<string | null>(null);

  const locked = false; // Picks button stays active even after tip-off
  const pickCount = userPicks?.length ?? 0;

  // Auto-open the bets drawer once for users with no picks when playoffs haven't started.
  useEffect(() => {
    if (locked) return;
    if (user && userPicks === undefined) return; // wait for picks query
    if (pickCount > 0) return;
    const timer = setTimeout(() => setBetsOpen(true), 800);
    return () => clearTimeout(timer);
  }, [user, locked, userPicks, pickCount]);

  const handleBetsSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["user-picks-all", user?.id] });
  };

  const handleCardRoulette = async () => {
    // Only show roulette if user doesn't already have a card
    if (assignedCardId || cardLoading) return;
    const cardId = await assignRandomCard();
    if (cardId) {
      setRouletteCardId(cardId);
    }
  };

  const handleButtonClick = () => {
    if (locked) {
      setMonologueIndex((prev) => {
        const next = prev + 1;
        return next >= ALL_MONOLOGUE_LINES.length ? 0 : next;
      });
    } else {
      setBetsOpen(true);
    }
  };

  const gamesLeft = TOTAL_GAMES - pickCount;

  const getButtonContent = () => {
    if (locked && monologueIndex >= 0) {
      return (
        <>
          <Lock size={18} />
          {ALL_MONOLOGUE_LINES[monologueIndex]}
        </>
      );
    }
    const infoLine =
      pickCount === 0
        ? `Go, bro. You have games to pick.`
        : pickCount < TOTAL_GAMES
          ? `WTF, bro. There are still ${gamesLeft} picks to make.`
          : "You did it, bro. Picks are legit and logged in.";

    return pickCount >= TOTAL_GAMES ? (
      <>
        <CheckCircle size={18} />
        {infoLine}
      </>
    ) : (
      <>
        <PenLine size={18} />
        {infoLine}
      </>
    );
  };

  const filteredMatches =
    selectedRound === "all"
      ? matches
      : matches?.filter((m) => m.round === selectedRound);

  const groupedByDate = filteredMatches?.reduce<Record<string, typeof filteredMatches>>((acc, match) => {
    const key = match.date || "TBD";
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(match);
    return acc;
  }, {});

  // Sort matches within each date by tip-off time (earliest first).
  // Times look like "7:00 PM", "10:30 PM", etc. TBD/empty go last.
  const parseTimeToMinutes = (t?: string): number => {
    if (!t) return Number.POSITIVE_INFINITY;
    const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!m) return Number.POSITIVE_INFINITY;
    let hours = parseInt(m[1], 10);
    const minutes = parseInt(m[2], 10);
    const ampm = m[3]?.toUpperCase();
    if (ampm === "PM" && hours !== 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };
  if (groupedByDate) {
    for (const key of Object.keys(groupedByDate)) {
      groupedByDate[key]!.sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
    }
  }

  const dateOrder = groupedByDate
    ? Object.keys(groupedByDate).sort((a, b) => {
        if (a === "TBD") return 1;
        if (b === "TBD") return -1;
        const parse = (s: string) => {
          const d = new Date(`${s}, ${new Date().getFullYear()}`);
          return d.getTime();
        };
        // Today's matchups go first, then chronological order for the rest.
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMs = today.getTime();
        const aMs = parse(a);
        const bMs = parse(b);
        const aIsToday = aMs === todayMs;
        const bIsToday = bMs === todayMs;
        if (aIsToday && !bIsToday) return -1;
        if (bIsToday && !aIsToday) return 1;
        return aMs - bMs;
      })
    : [];

  return (
    <div className="min-h-screen bg-background pb-28">
      <HeroBanner />

      <section className="container py-10">

        <CountdownTimer />

        <button
          onClick={handleButtonClick}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 mb-6 ${
            locked && monologueIndex >= 0
              ? "bg-muted/50 text-muted-foreground border border-border hover:bg-muted/70"
              : pickCount >= TOTAL_GAMES
                ? "bg-primary/15 text-primary border border-primary/40"
                : "bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20"
          }`}
        >
          {getButtonContent()}
        </button>

        <h2 className="font-display text-3xl tracking-wider mb-4">
          All Matchups
        </h2>


        <Select value={selectedRound} onValueChange={setSelectedRound}>
          <SelectTrigger className="w-[220px] mb-6">
            <SelectValue placeholder="Select round" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            {rounds.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border h-40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {dateOrder.flatMap((date) =>
              groupedByDate?.[date]?.map((match) => (
                <MatchCard key={match.id} match={match} />
              )) ?? []
            )}
          </div>
        )}
      </section>

      {!locked && (
        <BetsDrawer
          open={betsOpen}
          onOpenChange={setBetsOpen}
          onBetsSaved={handleBetsSaved}
          onCardRoulette={handleCardRoulette}
          resolvedBracket={resolvedBracket}
        />
      )}

      {rouletteCardId && (
        <CardRouletteOverlay
          targetCardId={rouletteCardId}
          onDismiss={() => setRouletteCardId(null)}
        />
      )}
    </div>
  );
};

export default Index;
