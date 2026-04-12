import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Mail, ArrowLeft, LogIn, PenLine } from "lucide-react";
import BetsDrawer from "@/components/BetsDrawer";

const Settings = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [betsOpen, setBetsOpen] = useState(false);

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
    </div>
  );
};

export default Settings;
