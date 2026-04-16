import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LogOut, Mail, ArrowLeft, LogIn, PenLine, CheckCircle, Pencil, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BetsDrawer from "@/components/BetsDrawer";
import PlayerCard from "@/components/PlayerCard";
import { playerCards } from "@/data/playerCards";
import TeamLogo from "@/components/TeamLogo";
import { bracketSeries, resolveSeriesTeams, isPlayInPlaceholder } from "@/data/playoffsData";
import { teamMeta } from "@/lib/nbaApi";
import { useBracketData } from "@/hooks/useBracketData";

const Settings = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: resolvedBracket } = useBracketData();
  const activeBracket = resolvedBracket ?? bracketSeries;
  const [betsOpen, setBetsOpen] = useState(false);
  const [hasPicks, setHasPicks] = useState(false);
  const [picks, setPicks] = useState<{ seriesId: string; winner: string; gamesInSeries: number }[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [selectedCard, setSelectedCard] = useState(playerCards[0].id);

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
          <h1 className="font-display text-3xl tracking-wider">
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

        {!loading && user && (
          <Card className="mt-3 mb-3">
            <CardHeader>
              <CardTitle className="font-display text-lg tracking-wider">THAT'S YOU</CardTitle>
            </CardHeader>
            <CardContent>
              <PlayerCard />
            </CardContent>
          </Card>
        )}

        {!loading && user && (
          <Card className="mt-3 mb-3">
            <CardHeader>
              <CardTitle className="font-display text-lg tracking-wider">YOUR PICKS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {picks.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {picks
                    .filter((p) => {
                      const series = activeBracket.find((s) => s.id === p.seriesId);
                      return series && series.round === "First Round";
                    })
                    .concat(
                      picks.filter((p) => {
                        const series = activeBracket.find((s) => s.id === p.seriesId);
                        return series && series.round !== "First Round";
                      })
                    )
                    .map((p) => {
                      const meta = teamMeta[p.winner];
                      const logo = meta?.logo || "";
                      const isPlaceholder = isPlayInPlaceholder(p.winner);
                      return (
                        <div
                          key={p.seriesId}
                          className="flex flex-col items-center gap-1 w-12"
                          title={`${p.winner} in ${p.gamesInSeries}`}
                        >
                          {isPlaceholder || !logo ? (
                            <span className="w-10 h-10 inline-flex items-center justify-center text-2xl">🏀</span>
                          ) : (
                            <TeamLogo src={logo} alt={p.winner} className="w-10 h-10" />
                          )}
                          <span className="font-display text-[11px] tracking-wide text-muted-foreground">
                            {p.winner}
                          </span>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground font-body">No picks yet.</p>
              )}

              <button
                onClick={() => setBetsOpen(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20 w-full"
              >
                {hasPicks ? (
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
            </CardContent>
          </Card>
        )}

        {loading ? null : user ? (
          <>
            <Card className="mt-3 mb-3">
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

      <BetsDrawer open={betsOpen} onOpenChange={(open) => { setBetsOpen(open); if (!open) { fetchDisplayName(); fetchPicks(); } }} />
    </div>
  );
};

export default Settings;