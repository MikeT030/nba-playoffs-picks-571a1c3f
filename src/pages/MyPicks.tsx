import { useEffect, useState, useRef, useCallback } from "react";
import { PenLine, LogIn, Lock } from "lucide-react";
import shareIcon from "@/assets/share-icon.svg";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  bracketSeries,
  resolveSeriesTeams,
  isPlayInPlaceholder,
  type Team,
} from "@/data/playoffsData";
import { useBracketData } from "@/hooks/useBracketData";
import { useAllSeriesResults } from "@/hooks/useAllSeriesResults";
import { totalUserPoints, scorePick } from "@/lib/pickScoring";
import { ALL_MONOLOGUE_LINES, isPlayoffsStarted } from "@/data/buttonMonologue";

const rounds = [
  { value: "all", label: "All Rounds" },
  { value: "First Round", label: "First Round" },
  { value: "Conference Semifinals", label: "Conference Semifinals" },
  { value: "Conference Finals", label: "Conference Finals" },
  { value: "Finals", label: "Finals" },
];

const ONES = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
const TENS = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
function numberToWords(n: number): string {
  if (n < 0) return `negative ${numberToWords(-n)}`;
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : "");
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` ${numberToWords(n % 100)}` : ""}`;
  return String(n);
}

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
    <div className="rounded-lg bg-[#1A1E24]/80 backdrop-blur-md p-3.5">
      <p className="text-[11px] text-muted-foreground font-body font-medium uppercase tracking-wider mb-2.5">
        {round} · {conference}
      </p>

      <div className="flex items-center gap-3 mb-2 pb-[4px]">
        <div
          className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
            bet?.winner === topTeam?.abbreviation
              ? "border-primary"
              : "border-transparent opacity-50"
          }`}
          style={
            bet?.winner === topTeam?.abbreviation && topTeam
              ? { backgroundColor: `${topTeam.color}66` }
              : undefined
          }
        >
          {topTeam ? (
            <span className="tracking-wide text-lg" style={{ fontFamily: "'Saira Stencil One', sans-serif" }}>
              {isPlayInPlaceholder(topTeam.abbreviation) ? topTeam.name : topTeam.abbreviation}
            </span>
          ) : (
            <span className="font-display text-base tracking-wide text-muted-foreground/50">TBD</span>
          )}
        </div>

        <span className="text-muted-foreground font-body text-xs">VS</span>

        <div
          className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
            bet?.winner === bottomTeam?.abbreviation
              ? "border-primary"
              : "border-transparent opacity-50"
          }`}
          style={
            bet?.winner === bottomTeam?.abbreviation && bottomTeam
              ? { backgroundColor: `${bottomTeam.color}66` }
              : undefined
          }
        >
          {bottomTeam ? (
            <span className="tracking-wide text-lg" style={{ fontFamily: "'Saira Stencil One', sans-serif" }}>
              {isPlayInPlaceholder(bottomTeam.abbreviation) ? bottomTeam.name : bottomTeam.abbreviation}
            </span>
          ) : (
            <span className="font-display text-base tracking-wide text-muted-foreground/50">TBD</span>
          )}
        </div>
      </div>

      {bet && winnerTeam ? (
        <p className="font-body text-primary text-center pt-0 text-sm">
          Your Pick: <span className="font-bold">{bet.winner}</span> in <span className="font-bold">{bet.gamesInSeries}</span>
        </p>
      ) : (
        <p className="text-center text-[11px] text-muted-foreground/60 font-body italic">
          No pick made
        </p>
      )}
    </div>
  );
};

const MyPicks = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: resolvedBracket } = useBracketData();
  const { data: seriesResults = [] } = useAllSeriesResults();
  const activeBracket = resolvedBracket ?? bracketSeries;
  const [betsOpen, setBetsOpen] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [bets, setBets] = useState<BetSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRound, setSelectedRound] = useState("all");
  
  const [downloading, setDownloading] = useState(false);
  const [monologueIndex, setMonologueIndex] = useState(-1);
  const bracketRef = useRef<HTMLDivElement>(null);

  const locked = isPlayoffsStarted();

  const handleShareBracket = useCallback(async () => {
    if (!bracketRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;

      // Create a wrapper with the headline for capture
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "position:absolute;left:-9999px;top:0;background:#0a0a0a;padding:32px 40px 48px;";
      const headline = document.createElement("h1");
      headline.textContent = `${profileName ?? "My"}'s 2026 Playoffs`;
      headline.style.cssText = "font-family:'Bebas Neue',sans-serif;font-size:32px;color:#fff;letter-spacing:0.08em;text-align:center;margin-bottom:24px;";
      wrapper.appendChild(headline);

      const clone = bracketRef.current.cloneNode(true) as HTMLElement;
      // Remove overflow constraints so full bracket is captured
      clone.style.overflow = "visible";
      clone.style.width = "max-content";
      // Fix all overflow-hidden containers inside the clone
      clone.querySelectorAll("*").forEach((el) => {
        const htmlEl = el as HTMLElement;
        const cs = htmlEl.style.overflow || "";
        if (cs === "hidden" || cs === "auto" || cs === "scroll" || htmlEl.className?.includes?.("overflow")) {
          htmlEl.style.overflow = "visible";
        }
      });
      // Ensure the relative bracket area is fully visible (keep its explicit height since children are absolute)
      const relativeContainer = clone.querySelector("[class*='relative']") as HTMLElement | null;
      if (relativeContainer) {
        relativeContainer.style.overflow = "visible";
      }
      wrapper.style.width = "max-content";
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      const canvas = await html2canvas(wrapper, {
        backgroundColor: "#0a0a0a",
        scale: 2,
        useCORS: true,
        width: wrapper.scrollWidth,
        height: wrapper.scrollHeight,
      });

      document.body.removeChild(wrapper);

      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob((b) => res(b), "image/png")
      );

      if (!blob) throw new Error("Failed to create image");

      const file = new File([blob], `${profileName ?? "my"}-bracket.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${profileName}'s 2026 Playoffs`,
          files: [file],
        });
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Failed to share bracket", e);
    } finally {
      setDownloading(false);
    }
  }, [profileName]);

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
        <HeroBanner title={"MY\nPICKS"} subtitle="2026 Playoffs" />
        <section className="container py-10 text-center">
          <p className="text-muted-foreground font-body">Loading...</p>
        </section>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <HeroBanner title={"MY\nPICKS"} subtitle="2026 Playoffs" />
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

  const handleEditClick = () => {
    if (locked) {
      setMonologueIndex((prev) => {
        const next = prev + 1;
        return next >= ALL_MONOLOGUE_LINES.length ? 0 : next;
      });
    } else {
      setBetsOpen(true);
    }
  };

  const editPicksButton = (
    <div className="mb-10">
      <Button
        variant="outline"
        className="border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-display tracking-widest uppercase"
        onClick={handleEditClick}
      >
        {locked ? <Lock className="w-4 h-4" /> : <PenLine className="w-4 h-4" />}
        MAKE YOUR PICKS
      </Button>
      {locked && monologueIndex >= 0 && (
        <p className="mt-2 text-primary font-body text-xs animate-in fade-in slide-in-from-top-1">
          {ALL_MONOLOGUE_LINES[monologueIndex]}
        </p>
      )}
    </div>
  );


  if (bets.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <HeroBanner title={"MY\nPICKS"} subtitle="2026 Playoffs" />
        <section className="container py-10">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="font-display text-2xl tracking-wider mb-2">NO PICKS YET</p>
              <p className="text-muted-foreground font-body text-sm">
                Make your picks to see them here.
              </p>
            </div>
          </div>
        </section>
        {!locked && <BetsDrawer open={betsOpen} onOpenChange={setBetsOpen} onBetsSaved={() => setRefreshKey((k) => k + 1)} resolvedBracket={resolvedBracket} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <HeroBanner title={"MY\nPICKS"} subtitle={profileName ? `${profileName}'s ${bets.length}` : `2026 Playoffs · ${bets.length} picks`} />

      <section className="container py-8 pb-24">

        {/* Bracket section */}
        <div className="space-y-4 mb-12">
          <h2 className="font-display tracking-wider text-foreground text-2xl">The Bracket</h2>

          {seriesResults.length > 0 && (() => {
            const userBetsLite = bets.map((b) => ({
              series_id: b.seriesId,
              winner: b.winner,
              games_in_series: b.gamesInSeries,
            }));
            const totalPoints = totalUserPoints(userBetsLite, seriesResults);
            return (
              <div className="flex items-center justify-center gap-4 py-2 px-3 mb-2 rounded-lg bg-[#1A1E24] border border-border/50">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">The facts</p>
                  <p className="font-display text-2xl text-primary">{totalPoints}</p>
                  <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider mt-1">
                    that's mf {numberToWords(totalPoints)} points
                  </p>
                </div>
              </div>
            );
          })()}

          {(() => {
            const actualWinners: Record<string, string> = {};
            const seriesScores: Record<string, string> = {};
            const pickPoints: Record<string, import("@/lib/pickScoring").PickPointInfo> = {};
            const userPicksLite = bets.map((b) => ({
              series_id: b.seriesId,
              winner: b.winner,
              games_in_series: b.gamesInSeries,
            }));
            for (const r of seriesResults) {
              actualWinners[r.series_id] = r.winner;
              const { topTeam, bottomTeam } = resolveSeriesTeams(r.series_id, picks, activeBracket);
              const wWins = 4;
              const lWins = Math.max(0, r.games_played - 4);
              if (topTeam?.abbreviation === r.winner) {
                seriesScores[r.series_id] = `${wWins}-${lWins}`;
              } else if (bottomTeam?.abbreviation === r.winner) {
                seriesScores[r.series_id] = `${lWins}-${wWins}`;
              }
            }
            for (const p of userPicksLite) {
              pickPoints[p.series_id] = scorePick(p, userPicksLite, seriesResults);
            }
            return (
              <PlayoffBracket
                ref={bracketRef}
                picks={picks}
                bets={bets}
                seriesList={activeBracket}
                actualWinners={actualWinners}
                pickPoints={pickPoints}
                seriesScores={seriesScores}
                variant="badge"
              />
            );
          })()}

          <div className="flex justify-start mt-4">
            <button
              onClick={handleShareBracket}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 font-body text-white hover:text-white/80 underline underline-offset-2 disabled:opacity-50 text-sm font-medium"
            >
              <svg width="14" height="14" viewBox="0 0 40 41" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path fillRule="evenodd" clipRule="evenodd" d="M22 6.83754V26.003C22 27.1059 21.1123 28 20 28C18.8954 28 18 27.105 18 26.003V6.83106L15.7411 9.08998C14.9672 9.86383 13.7122 9.86343 12.9257 9.07694C12.1446 8.29589 12.1493 7.02495 12.9127 6.26155L18.5956 0.578616C18.9804 0.193832 19.4841 0.00047404 19.9901 0L20.0054 0.00597072C20.5133 0.00705428 21.0184 0.199037 21.3979 0.578616L27.0809 6.26155C27.8547 7.0354 27.8543 8.29045 27.0678 9.07694C26.2868 9.85799 25.0158 9.85338 24.2524 9.08998L22 6.83754ZM4 37H36V22.9908C36 21.8913 36.8877 21 38 21C39.1046 21 40 21.8982 40 22.9908V39.0092C40 39.5585 39.7784 40.0558 39.418 40.416C39.0521 40.7774 38.554 41 38.0027 41H1.99729C1.44728 41 0.949187 40.7793 0.587987 40.4201C0.223492 40.0524 0 39.555 0 39.0092V22.9908C0 21.8913 0.88773 21 2 21C3.10457 21 4 21.8982 4 22.9908V37Z" fill="white"/>
              </svg>
              {downloading ? "Generating..." : "Share Bracket"}
            </button>
          </div>
        </div>

        {/* Cards section */}
        <Accordion type="single" collapsible className="mb-12">
          <AccordionItem value="cards" className="border-none">
            <AccordionTrigger className="hover:no-underline py-2">
              <h2 className="font-display tracking-wider text-foreground text-2xl">That's what you've picked</h2>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <Select value={selectedRound} onValueChange={setSelectedRound}>
                <SelectTrigger className="w-[220px] mb-2">
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
                const roundSeries = activeBracket.filter((s) => s.round === round);
                const conferences = round === "Finals" ? ["Finals"] : ["West", "East"];

                return (
                  <div key={round} className="mb-10">
                    <h3 className="font-display text-2xl tracking-wider mb-4">{round.toUpperCase()}</h3>

                    {conferences.map((conf) => {
                      const confSeries = roundSeries.filter((s) => s.conference === conf);
                      if (!confSeries.length) return null;

                      return (
                        <div key={conf} className="mb-6">
                          {conf !== "Finals" && (
                            <h4 className="font-display text-lg tracking-wider text-foreground mb-3">
                              {conf === "East" ? "Eastern Conference" : "Western Conference"}
                            </h4>
                          )}
                          <div className="grid gap-4 md:grid-cols-2">
                            {confSeries.map((series) => {
                              const resolved = resolveSeriesTeams(series.id, picks, activeBracket);
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion type="single" collapsible className="mt-8">
          <AccordionItem value="scoring" className="rounded-lg border border-white/10 bg-[#22272E]/80 backdrop-blur-md px-5 py-0 border-none">
            <AccordionTrigger className="font-display text-sm tracking-wider text-foreground flex items-center gap-2 hover:no-underline py-4">
              <span className="flex items-center gap-2 text-base">
                SCORING SYSTEM
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-body text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-display text-primary text-base w-auto text-right whitespace-nowrap">3 pts</span>
                  <span className="text-foreground">Correct winner + correct game count on the right series</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-primary text-base w-auto text-right whitespace-nowrap">2 pts</span>
                  <span className="text-foreground">Correct winner on the right series (wrong game count)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-primary text-base w-auto text-right whitespace-nowrap">1 pt</span>
                  <span className="text-foreground">Picked a team that won, but assigned to the wrong series</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-primary text-base w-auto text-right whitespace-nowrap">4 pts</span>
                  <span className="text-foreground">Correctly predicted the Supreme Finals champion</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {!locked && <BetsDrawer open={betsOpen} onOpenChange={setBetsOpen} onBetsSaved={() => setRefreshKey((k) => k + 1)} resolvedBracket={resolvedBracket} />}
    </div>
  );
};

export default MyPicks;
