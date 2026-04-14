import { useEffect, useState } from "react";
import { PenLine, CheckCircle, LogIn, Network } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PlayoffBracket from "@/components/PlayoffBracket";
import TeamLogo from "@/components/TeamLogo";
import HeroBanner from "@/components/HeroBanner";
import BetsDrawer from "@/components/BetsDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  bracketSeries,
  resolveSeriesTeams,
  isPlayInPlaceholder,
  type Team,
} from "@/data/playoffsData";

const rounds = [
  { value: "all", label: "All Rounds" },
  { value: "First Round", label: "First Round" },
  { value: "Conference Semifinals", label: "Conference Semifinals" },
  { value: "Conference Finals", label: "Conference Finals" },
  { value: "Finals", label: "Finals" },
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

  return (
    <div className="bg-card rounded-lg p-5">
      <p className="text-xs text-muted-foreground font-body font-medium uppercase tracking-wider mb-4">
        {round} · {conference}
      </p>

      <div className="flex items-center gap-4 mb-3">
        <div
          className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
            bet?.winner === topTeam?.abbreviation
              ? "border-primary bg-primary/10"
              : "border-transparent opacity-50"
          }`}
        >
          {topTeam ? (
            <>
              <TeamLogo src={topTeam.logo} alt={topTeam.name} className="w-12 h-12" />
              <span className="font-display text-lg tracking-wide">{isPlayInPlaceholder(topTeam.abbreviation) ? topTeam.name : topTeam.abbreviation}</span>
            </>
          ) : (
            <>
              <span className="text-3xl opacity-30">🏀</span>
              <span className="font-display text-lg tracking-wide text-muted-foreground/50">TBD</span>
            </>
          )}
        </div>

        <span className="text-muted-foreground font-body text-sm">VS</span>

        <div
          className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
            bet?.winner === bottomTeam?.abbreviation
              ? "border-primary bg-primary/10"
              : "border-transparent opacity-50"
          }`}
        >
          {bottomTeam ? (
            <>
              <TeamLogo src={bottomTeam.logo} alt={bottomTeam.name} className="w-12 h-12" />
              <span className="font-display text-lg tracking-wide">{isPlayInPlaceholder(bottomTeam.abbreviation) ? bottomTeam.name : bottomTeam.abbreviation}</span>
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
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [betsOpen, setBetsOpen] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [bets, setBets] = useState<BetSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRound, setSelectedRound] = useState("all");
  const [showBracket, setShowBracket] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPicks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("picks")
        .select("*")
        .eq("user_id", user.id);

      if (!error && data && data.length > 0) {
        setProfileName(data[0].profile_name);
        setBets(
          data.map((row: any) => ({
            seriesId: row.series_id,
            winner: row.winner,
            gamesInSeries: row.games_in_series,
          }))
        );
      } else {
        setProfileName(null);
        setBets([]);
      }
      setLoading(false);
    };

    fetchPicks();
  }, [user, authLoading, refreshKey]);

  const picks: Record<string, string> = {};
  for (const bet of bets) picks[bet.seriesId] = bet.winner;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <HeroBanner title="MY PICKS" subtitle="NBA Playoffs 2026" />
        <section className="container py-10 text-center">
          <p className="text-muted-foreground font-body">Loading...</p>
        </section>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <HeroBanner title="MY PICKS" subtitle="NBA Playoffs 2026" />
        <section className="container py-10">
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <p className="font-display text-2xl tracking-wider">SIGN IN TO VIEW PICKS</p>
            <p className="text-muted-foreground font-body text-sm">
              Create an account to save and view your playoff predictions.
            </p>
            <button
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20"
              onClick={() => navigate("/auth")}
            >
              <LogIn size={18} />
              SIGN IN
            </button>
          </div>
        </section>
      </div>
    );
  }

  const actionButtons = (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={() => setBetsOpen(true)}
        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20"
      >
        {bets.length > 0 ? (
          <>
            <CheckCircle size={18} />
            Edit Your Picks
          </>
        ) : (
          <>
            <PenLine size={18} />
            Make Your Picks
          </>
        )}
      </button>
      <button
        onClick={() => setShowBracket((v) => !v)}
        className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 border ${
          showBracket
            ? "bg-primary/15 text-primary border-primary/40"
            : "bg-card text-foreground border-border hover:bg-accent"
        }`}
      >
        <Network size={18} className="rotate-90" />
        Bracket
      </button>
    </div>
  );

  if (bets.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <HeroBanner title="MY PICKS" subtitle="NBA Playoffs 2026" />
        <section className="container py-10">
          {actionButtons}
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="font-display text-2xl tracking-wider mb-2">NO PICKS YET</p>
              <p className="text-muted-foreground font-body text-sm">
                Make your picks to see them here.
              </p>
            </div>
          </div>
        </section>
        <BetsDrawer open={betsOpen} onOpenChange={setBetsOpen} onBetsSaved={() => setRefreshKey((k) => k + 1)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <HeroBanner title="MY PICKS" subtitle={`${profileName}'s predictions · ${bets.length} picks`} />

      <section className="container py-8 pb-24">
        {actionButtons}

        {showBracket ? (
          <PlayoffBracket picks={picks} bets={bets} />
        ) : (
          <>
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

            {(selectedRound === "all" ? roundOrder : [selectedRound]).map((round) => {
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
                                bet={bets.find((b) => b.seriesId === series.id)}
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
          </>
        )}
      </section>

      <BetsDrawer open={betsOpen} onOpenChange={setBetsOpen} onBetsSaved={() => setRefreshKey((k) => k + 1)} />
    </div>
  );
};

export default MyPicks;
