import { useMemo, useState } from "react";
import { PenLine, CheckCircle } from "lucide-react";
import TeamLogo from "@/components/TeamLogo";
import HeroBanner from "@/components/HeroBanner";
import BetsDrawer from "@/components/BetsDrawer";
import {
  bracketSeries,
  resolveSeriesTeams,
  type Team,
} from "@/data/playoffsData";

interface BetSelection {
  seriesId: string;
  winner: string;
  gamesInSeries: number;
}

interface SavedBets {
  profile: string;
  bets: BetSelection[];
}

const roundOrder = [
  "First Round",
  "Conference Semifinals",
  "Conference Finals",
  "Finals",
];

const PickCard = ({
  topTeam,
  bottomTeam,
  bet,
  round,
  conference,
}: {
  topTeam?: Team;
  bottomTeam?: Team;
  bet?: BetSelection;
  round: string;
  conference: string;
}) => {
  const winnerTeam =
    bet?.winner === topTeam?.abbreviation
      ? topTeam
      : bet?.winner === bottomTeam?.abbreviation
        ? bottomTeam
        : null;

  const loserTeam =
    winnerTeam === topTeam ? bottomTeam : topTeam;

  return (
    <div className="bg-card rounded-lg p-5">
      <p className="text-xs text-muted-foreground font-body font-medium uppercase tracking-wider mb-4">
        {round} · {conference}
      </p>

      <div className="flex items-center gap-4 mb-3">
        {/* Top team */}
        <div
          className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
            bet?.winner === topTeam?.abbreviation
              ? "border-primary bg-primary/10"
              : "border-transparent opacity-50"
          }`}
        >
          {topTeam && topTeam.abbreviation !== "TBD" ? (
            <>
              <TeamLogo src={topTeam.logo} alt={topTeam.name} className="w-12 h-12" />
              <span className="font-display text-lg tracking-wide">{topTeam.abbreviation}</span>
            </>
          ) : (
            <>
              <span className="text-3xl opacity-30">🏀</span>
              <span className="font-display text-lg tracking-wide text-muted-foreground/50">TBD</span>
            </>
          )}
        </div>

        <span className="text-muted-foreground font-body text-sm">VS</span>

        {/* Bottom team */}
        <div
          className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
            bet?.winner === bottomTeam?.abbreviation
              ? "border-primary bg-primary/10"
              : "border-transparent opacity-50"
          }`}
        >
          {bottomTeam && bottomTeam.abbreviation !== "TBD" ? (
            <>
              <TeamLogo src={bottomTeam.logo} alt={bottomTeam.name} className="w-12 h-12" />
              <span className="font-display text-lg tracking-wide">{bottomTeam.abbreviation}</span>
            </>
          ) : (
            <>
              <span className="text-3xl opacity-30">🏀</span>
              <span className="font-display text-lg tracking-wide text-muted-foreground/50">TBD</span>
            </>
          )}
        </div>
      </div>

      {bet && winnerTeam ? (
        <p className="text-center text-sm font-body text-primary">
          <span className="font-medium">{winnerTeam.name}</span> in{" "}
          <span className="font-medium">{bet.gamesInSeries}</span> games
        </p>
      ) : (
        <p className="text-center text-xs text-muted-foreground/60 font-body italic">
          No pick made
        </p>
      )}
    </div>
  );
};

const MyPicks = () => {
  const [betsOpen, setBetsOpen] = useState(false);
  const [betsSaved, setBetsSaved] = useState(false);

  const saved = useMemo<SavedBets | null>(() => {
    try {
      const raw = localStorage.getItem("nba-bets");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [betsSaved]);

  const picks: Record<string, string> = {};
  if (saved) {
    for (const bet of saved.bets) picks[bet.seriesId] = bet.winner;
  }

  const makePicksButton = (
    <button
      onClick={() => setBetsOpen(true)}
      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 mb-6 ${
        betsSaved
          ? "bg-primary/15 text-primary border border-primary/40"
          : "bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20"
      }`}
    >
      {betsSaved ? (
        <>
          <CheckCircle size={18} />
          You have made your picks
        </>
      ) : (
        <>
          <PenLine size={18} />
          Make Your Picks
        </>
      )}
    </button>
  );

  if (!saved || saved.bets.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <HeroBanner title="MY PICKS" subtitle="NBA Playoffs 2026" />
        <section className="container py-10">
          {makePicksButton}
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="font-display text-2xl tracking-wider mb-2">NO PICKS YET</p>
              <p className="text-muted-foreground font-body text-sm">
                Make your picks to see them here.
              </p>
            </div>
          </div>
        </section>
        <BetsDrawer open={betsOpen} onOpenChange={setBetsOpen} onBetsSaved={() => setBetsSaved(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner title="MY PICKS" subtitle={`${saved.profile}'s predictions · ${saved.bets.length} picks`} />

      <section className="container py-8 pb-24">
        {makePicksButton}
        {roundOrder.map((round) => {
          const roundSeries = bracketSeries.filter((s) => s.round === round);
          const conferences = round === "Finals" ? ["Finals"] : ["West", "East"];

          return (
            <div key={round} className="mb-10">
              <h2 className="font-display text-2xl tracking-wider mb-4">{round.toUpperCase()}</h2>

              {conferences.map((conf) => {
                const confSeries = roundSeries.filter((s) => s.conference === conf);
                if (!confSeries.length) return null;

                return (
                  <div key={conf} className="mb-6">
                    {conf !== "Finals" && (
                      <h3 className="font-display text-lg tracking-wider text-foreground mb-3">
                        {conf === "East" ? "Eastern Conference" : "Western Conference"}
                      </h3>
                    )}
                    <div className="grid gap-4 md:grid-cols-2">
                      {confSeries.map((series) => {
                        const resolved = resolveSeriesTeams(series.id, picks);
                        return (
                          <PickCard
                            key={series.id}
                            topTeam={resolved.topTeam ?? series.topTeam}
                            bottomTeam={resolved.bottomTeam ?? series.bottomTeam}
                            bet={saved.bets.find((b) => b.seriesId === series.id)}
                            round={series.round}
                            conference={series.conference}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </section>

      <BetsDrawer open={betsOpen} onOpenChange={setBetsOpen} onBetsSaved={() => setBetsSaved(true)} />
    </div>
  );
};

export default MyPicks;
