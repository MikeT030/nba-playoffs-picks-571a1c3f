import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { isTodaySlateET, isSameLocalDay } from "@/lib/seriesUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TOTAL_GAMES = 15;

const rounds = [
  { value: "all", label: "All Matchups" },
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

  const locked = true; // Picks button shows monologue-only inactive state
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

  // Sort matches chronologically by actual tip-off timestamp. Series with no
  // known startsAt (TBD) fall to the bottom while preserving relative order.
  const sortedMatches = filteredMatches
    ? [...filteredMatches].sort((a, b) => {
        const aTs = a.startsAt ? new Date(a.startsAt).getTime() : Number.POSITIVE_INFINITY;
        const bTs = b.startsAt ? new Date(b.startsAt).getTime() : Number.POSITIVE_INFINITY;
        return aTs - bTs;
      })
    : [];

  // Split matches into "Today" (current US-Eastern slate) vs "Next days".
  // A match belongs to "Today" if it's live, or if its tip-off is still upcoming
  // AND any of:
  //   (a) it's part of the active ET slate,
  //   (b) it falls on the viewer's local calendar day,
  //   (c) it tips off within the next ~20h (covers tonight's NBA slate as
  //       seen from a European morning, where tip-off is technically the next
  //       local calendar day past midnight).
  // Finished games from last night's ET slate also stay in "Today" until we
  // cross the next slate's flip moment (20:00 Europe/Berlin the day before
  // tonight's tip-off), so European morning viewers can still see results.
  const TWENTY_HOURS_MS = 20 * 60 * 60 * 1000;
  const nowMs = Date.now();
  // Compute "tonight's flip moment" = today's 20:00 in Europe/Berlin (local
  // viewer's evening). Until we cross this, last night's ET slate finals
  // remain in the Today section.
  const berlinNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" }),
  );
  const tonightFlipBerlin = new Date(berlinNow);
  tonightFlipBerlin.setHours(20, 0, 0, 0);
  // Difference between Berlin local time and UTC for "now":
  const berlinOffsetMs = berlinNow.getTime() - nowMs;
  const tonightFlipUtcMs = tonightFlipBerlin.getTime() - berlinOffsetMs;

  const todayMatches: typeof sortedMatches = [];
  const nextDaysMatches: typeof sortedMatches = [];
  for (const m of sortedMatches) {
    if (m.status === "live") {
      todayMatches.push(m);
      continue;
    }
    const ts = m.startsAt ? new Date(m.startsAt).getTime() : undefined;
    if (!ts) {
      nextDaysMatches.push(m);
      continue;
    }
    const withinTonight = ts - nowMs <= TWENTY_HOURS_MS;
    const isUpcomingToday =
      ts > nowMs && (isTodaySlateET(ts) || isSameLocalDay(ts) || withinTonight);
    // Recently finished game from the active ET slate: keep visible until
    // tonight's 20:00 Europe/Berlin flip moment.
    const isRecentSlateFinal =
      ts <= nowMs && isTodaySlateET(ts) && nowMs < tonightFlipUtcMs;
    if (isUpcomingToday || isRecentSlateFinal) {
      todayMatches.push(m);
    } else {
      nextDaysMatches.push(m);
    }
  }

  const renderMatchGrid = (list: typeof sortedMatches) => (
    <div className="grid gap-4 md:grid-cols-2">
      {list.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-28">
      <HeroBanner
        subtitle={
          pickCount >= TOTAL_GAMES
            ? "2026 Playoffs Picks"
            : "2026 Playoffs Picks"
        }
      />

      <section className="container py-10 pt-[20px]">

        <CountdownTimer />


        <Select value={selectedRound} onValueChange={setSelectedRound}>
          <SelectTrigger
            className="mb-6 w-auto max-w-full gap-3 border-0 bg-transparent p-0 h-auto font-display text-3xl tracking-wider text-foreground hover:text-foreground focus:ring-0 focus:ring-offset-0 shadow-none [&>svg]:h-6 [&>svg]:w-6 [&>svg]:opacity-70"
            aria-label="Select round"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4} className="bg-[#1A1E24] border-[#1A1E24]">
            {rounds.map((r) => (
              <SelectItem
                key={r.value}
                value={r.value}
                className="focus:bg-primary/15 focus:text-primary focus:border focus:border-primary/40 focus:rounded-full data-[state=checked]:bg-primary/15 data-[state=checked]:text-primary data-[state=checked]:border data-[state=checked]:border-primary/40 data-[state=checked]:rounded-full my-0.5"
              >
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
          <div className="space-y-8">
            {todayMatches.length > 0 && (
              <div>
                <h2 className="mb-3 font-display text-xl tracking-wider text-foreground/90">
                  Today
                </h2>
                {renderMatchGrid(todayMatches)}
              </div>
            )}
            {nextDaysMatches.length > 0 && (
              <div>
                <h2 className="mb-3 font-display text-xl tracking-wider text-foreground/90">
                  Next days
                </h2>
                {renderMatchGrid(nextDaysMatches)}
              </div>
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
