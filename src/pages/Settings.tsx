import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LogOut, Mail, ArrowLeft, LogIn, PenLine, Pencil, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BetsDrawer from "@/components/BetsDrawer";

const Settings = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [betsOpen, setBetsOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

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

        <h1 className="font-display text-3xl tracking-wider">SETTINGS</h1>

        {!loading && user && hasPicks && (
          <div className="flex items-center gap-2">
            {editingName ? (
              <>
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
              </>
            ) : (
              <>
                <p className="font-display text-xl tracking-wider">
                  {displayName || "Set your name"}
                </p>
                <button
                  onClick={() => { setNameInput(displayName); setEditingName(true); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil size={16} />
                </button>
              </>
            )}
          </div>
        )}

        <button
          onClick={() => setBetsOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20 w-full"
        >
          <PenLine size={18} />
          Make Your Picks
        </button>

        {loading ? null : user ? (
          <>
            <Card>
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

            <Button
              variant="destructive"
              className="w-full font-display tracking-wider"
              onClick={handleSignOut}
            >
              <LogOut size={18} />
              SIGN OUT
            </Button>
          </>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-muted-foreground font-body text-sm">
                Sign in to manage your account and view your picks.
              </p>
              <Button asChild className="w-full font-display tracking-wider">
                <Link to="/auth">
                  <LogIn size={18} />
                  SIGN IN / SIGN UP
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <BetsDrawer open={betsOpen} onOpenChange={setBetsOpen} />
    </div>
  );
};

export default Settings;