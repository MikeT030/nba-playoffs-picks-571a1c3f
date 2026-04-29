import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PenLine, CheckCircle, Lock } from "lucide-react";
import HeroBanner from "@/components/HeroBanner";

import BetsDrawer from "@/components/BetsDrawer";
import CardRouletteOverlay from "@/components/CardRouletteOverlay";
import HighlightTicker from "@/components/HighlightTicker";
import { usePlayoffGames } from "@/hooks/usePlayoffGames";
import { useBracketData } from "@/hooks/useBracketData";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerCard } from "@/hooks/usePlayerCard";
import { useAllUserPicks } from "@/hooks/useAllUserPicks";
import { useQueryClient } from "@tanstack/react-query";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import { ALL_MONOLOGUE_LINES, isPlayoffsStarted } from "@/data/buttonMonologue";
import { isTodaySlateET, isSameLocalDay } from "@/lib/seriesUtils";
import AdvancedRoundView from "@/components/AdvancedRoundView";

const TOTAL_GAMES = 15;

const Index = () => {
  const { data: matches, isLoading, isFetching, isError } = usePlayoffGames();
  const { data: resolvedBracket } = useBracketData();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { assignedCardId, loading: cardLoading, assignRandomCard } = usePlayerCard();
  const { data: userPicks } = useAllUserPicks();
  const queryClient = useQueryClient();
  const [betsOpen, setBetsOpen] = useState(false);
  const [monologueIndex, setMonologueIndex] = useState(-1);
  const [rouletteCardId, setRouletteCardId] = useState<string | null>(null);

  // Redirect signed-out users to the auth page
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

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

  // Pull-to-refresh: refetch matchup data when the user pulls down at the top.
  const { pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["playoff-games-raw"] }),
        queryClient.refetchQueries({ queryKey: ["user-picks-all", user?.id] }),
      ]);
    },
  });

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

  const filteredMatches = matches;

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



  return (
    <div className="min-h-screen bg-background pb-28">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        progress={progress}
      />
      <HeroBanner subtitle="2026" />

      <section className="container py-10 pt-0">
        <HighlightTicker />

        {isLoading || (isFetching && (!matches || matches.length === 0)) ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border h-40 animate-pulse" />
            ))}
          </div>
        ) : isError && (!matches || matches.length === 0) ? (
          <p className="text-muted-foreground font-body text-sm">
            Couldn't load matchups. Pull down to refresh.
          </p>
        ) : (
          <AdvancedRoundView
            matches={sortedMatches}
            bracket={resolvedBracket ?? []}
            todayMatches={todayMatches}
            nextMatches={nextDaysMatches}
          />
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
