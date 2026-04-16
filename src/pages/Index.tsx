import { useState, useEffect } from "react";
import { PenLine, CheckCircle, Lock } from "lucide-react";
import HeroBanner from "@/components/HeroBanner";
import MatchCard from "@/components/MatchCard";
import BetsDrawer from "@/components/BetsDrawer";
import CountdownTimer from "@/components/CountdownTimer";
import { usePlayoffGames } from "@/hooks/usePlayoffGames";
import { useBracketData } from "@/hooks/useBracketData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  const [selectedRound, setSelectedRound] = useState("all");
  const [betsOpen, setBetsOpen] = useState(false);
  const [pickCount, setPickCount] = useState(0);
  const [monologueIndex, setMonologueIndex] = useState(-1);

  const locked = isPlayoffsStarted();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const checkPicks = async () => {
      if (user) {
        const { data } = await supabase
          .from("picks")
          .select("id")
          .eq("user_id", user.id);
        if (data && data.length > 0) {
          setPickCount(data.length);
          return;
        }
      }
      if (!locked) {
        timer = setTimeout(() => setBetsOpen(true), 800);
      }
    };
    checkPicks();
    return () => clearTimeout(timer);
  }, [user, locked]);

  const handleBetsSaved = () => {
    if (user) {
      supabase
        .from("picks")
        .select("id")
        .eq("user_id", user.id)
        .then(({ data }) => {
          setPickCount(data?.length ?? 0);
        });
    }
  };

  const handleButtonClick = () => {
    if (locked) {
      setMonologueIndex((prev) => {
        const next = prev + 1;
        // Loop back to start after all lines
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
        ? `Go, bro. You have ${TOTAL_GAMES} games to pick.`
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

  return (
    <div className="min-h-screen bg-background pb-28">
      <HeroBanner />

      <section className="container py-10">

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

        <CountdownTimer />

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
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </section>

      {!locked && (
        <BetsDrawer open={betsOpen} onOpenChange={setBetsOpen} onBetsSaved={handleBetsSaved} resolvedBracket={resolvedBracket} />
      )}
    </div>
  );
};

export default Index;
