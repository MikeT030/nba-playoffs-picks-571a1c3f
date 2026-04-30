import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LogOut, Mail, ArrowLeft, LogIn, PenLine, CheckCircle, Pencil, Check, Lock, Shield } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { ALL_MONOLOGUE_LINES } from "@/data/buttonMonologue";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BetsDrawer from "@/components/BetsDrawer";
import CardRouletteOverlay from "@/components/CardRouletteOverlay";
import ChampionConfetti from "@/components/ChampionConfetti";
import PlayerCard from "@/components/PlayerCard";
import DemoBracketPreview from "@/components/DemoBracketPreview";
import { playerCards } from "@/data/playerCards";
import { usePlayerCard } from "@/hooks/usePlayerCard";
import TeamLogo from "@/components/TeamLogo";
import { bracketSeries, resolveSeriesTeams, isPlayInPlaceholder } from "@/data/playoffsData";
import { teamMeta } from "@/lib/nbaApi";
import { useBracketData } from "@/hooks/useBracketData";

const Settings = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const { data: resolvedBracket } = useBracketData();
  const activeBracket = resolvedBracket ?? bracketSeries;
  const { assignedCardId, loading: cardLoading, assignRandomCard } = usePlayerCard();
  const [betsOpen, setBetsOpen] = useState(false);
  const [hasPicks, setHasPicks] = useState(false);
  const [picks, setPicks] = useState<{ seriesId: string; winner: string; gamesInSeries: number }[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [rouletteCardId, setRouletteCardId] = useState<string | null>(null);
  const [monologueIndex, setMonologueIndex] = useState(-1);

  const locked = false; // Picks button active — opens BetsDrawer
  const TOTAL_GAMES = 15;
  const pickCount = picks.length;
  const gamesLeft = TOTAL_GAMES - pickCount;

  const handlePicksButtonClick = () => {
    if (locked) {
      setMonologueIndex((prev) => {
        const next = prev + 1;
        return next >= ALL_MONOLOGUE_LINES.length ? 0 : next;
      });
    } else {
      setBetsOpen(true);
    }
  };

  const getPicksButtonContent = () => {
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
        ? "Go, bro. You have games to pick."
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

  const assignedCard = assignedCardId ? playerCards.find((c) => c.id === assignedCardId) : null;

  const fetchPicks = async () => {
    if (!user) return;
    const { data } = await supabase.from("picks").select("*").eq("user_id", user.id);
    setHasPicks(!!(data && data.length > 0));
    setPicks(
      (data || []).map((row: any) => ({
        seriesId: row.series_id,
        winner: row.winner,
        gamesInSeries: row.games_in_series,
      }))
    );
  };

  const fetchDisplayName = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data?.display_name) {
      setDisplayName(data.display_name);
    }
  };

  useEffect(() => {
    fetchDisplayName();
    fetchPicks();
  }, [user]);

  const handleSaveName = async () => {
    if (!user || !nameInput.trim()) return;
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: user.id, display_name: nameInput.trim() }, { onConflict: "user_id" });
    setSavingName(false);
    if (error) {
      toast.error("Failed to save name");
    } else {
      setDisplayName(nameInput.trim());
      setEditingName(false);
      toast.success("Name updated");
    }
  };

  const handleCardRoulette = async () => {
    if (assignedCardId || cardLoading) return;
    const cardId = await assignRandomCard();
    if (cardId) {
      setRouletteCardId(cardId);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background px-4 pt-16 pb-28">
      <div className="max-w-sm mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex items-center gap-2">
          <h1 className="tracking-wider text-2xl" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            {!loading && user && displayName
              ? <>YOUR PROFILE <span className="text-primary">{displayName.toUpperCase()}</span></>
              : "SETTINGS"}
          </h1>
          {!loading && user && displayName && !editingName && (
            <button
              onClick={() => { setNameInput(displayName); setEditingName(true); }}
              className="text-muted-foreground hover:text-foreground transition-colors mt-1"
            >
              <Pencil size={16} />
            </button>
          )}
        </div>
        {editingName && (
          <div className="flex items-center gap-2">
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter your name"
              className="font-body text-lg"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            />
            <Button size="icon" variant="ghost" onClick={handleSaveName} disabled={savingName}>
              <Check size={18} />
            </Button>
          </div>
        )}

        {/* That's You — only the user's assigned card */}
        {!loading && user && assignedCard && (
          <div className="mt-3 mb-3">
            <h2 className="font-display text-lg tracking-wider mb-3">THAT'S YOU</h2>
            <PlayerCard
              player={assignedCard}
              selected
              className="!opacity-100"
            />
          </div>
        )}

        {!loading && user && (() => {
          const championPick = picks.find((p) => p.seriesId === "nba-finals");
          const championAbbr = championPick?.winner;
          const championFullName = championAbbr
            ? activeBracket.find((s) => s.topTeam?.abbreviation === championAbbr)?.topTeam?.name
              ?? activeBracket.find((s) => s.bottomTeam?.abbreviation === championAbbr)?.bottomTeam?.name
              ?? championAbbr
            : null;
          const championLogo = championAbbr ? teamMeta[championAbbr]?.logo : null;
          const isPlaceholder = championAbbr ? isPlayInPlaceholder(championAbbr) : false;

          return (
            <Card className="mt-3 mb-3 border-0 bg-[#181C23] relative">
              <ChampionConfetti active={!!(championPick && championFullName)} />
              <CardHeader>
                <CardTitle className="font-display text-lg tracking-wider">YOUR CHAMPION</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {championPick && championFullName ? (
                  <div className="flex flex-col items-center gap-4 text-center pb-4">
                    {isPlaceholder || !championLogo ? (
                      <span className="w-36 h-36 inline-flex items-center justify-center text-7xl">🏀</span>
                    ) : (
                      <TeamLogo src={championLogo} alt={championFullName} className="w-36 h-36" />
                    )}
                    <div>
                      <p className="font-display text-xl tracking-wider">{championFullName}</p>
                      <p className="text-xs text-muted-foreground font-body">in {championPick.gamesInSeries} games</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground font-body">No champion picked yet.</p>
                )}

                <button
                  onClick={handlePicksButtonClick}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-muted/50 text-muted-foreground border border-border hover:bg-muted/70 w-full"
                >
                  {getPicksButtonContent()}
                </button>
              </CardContent>
            </Card>
          );
        })()}

        {loading ? null : user ? (
          <>
            <Card className="mt-3 mb-3 border-0 bg-[#181C23]">
              <CardHeader>
                <CardTitle className="font-display text-lg tracking-wider">ACCOUNT</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground font-body">Email</p>
                    <p className="font-body text-sm">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-[18px]" />
                  <div>
                    <p className="text-xs text-muted-foreground font-body">Member since</p>
                    <p className="font-body text-sm">
                      {new Date(user.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isAdmin && (
              <button
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20"
                onClick={() => navigate("/admin")}
              >
                <Shield size={18} />
                ADMIN AREA
              </button>
            )}

            <button
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-destructive/15 text-destructive border border-destructive/40 hover:bg-destructive/20"
              onClick={handleSignOut}
            >
              <LogOut size={18} />
              SIGN OUT
            </button>
          </>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-muted-foreground font-body text-sm">
                Sign in to manage your account and view your picks.
              </p>
              <Link
                to="/auth"
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20"
              >
                <LogIn size={18} />
                SIGN IN / SIGN UP
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <BetsDrawer
        open={betsOpen}
        onOpenChange={(open) => { setBetsOpen(open); if (!open) { fetchDisplayName(); fetchPicks(); } }}
        onCardRoulette={handleCardRoulette}
      />

      {rouletteCardId && (
        <CardRouletteOverlay
          targetCardId={rouletteCardId}
          onDismiss={() => setRouletteCardId(null)}
        />
      )}
    </div>
  );
};

export default Settings;
