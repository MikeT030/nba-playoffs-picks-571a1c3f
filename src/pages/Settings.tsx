import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Mail, ArrowLeft } from "lucide-react";
import { useEffect } from "react";

const Settings = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) return null;

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
      </div>
    </div>
  );
};

export default Settings;
