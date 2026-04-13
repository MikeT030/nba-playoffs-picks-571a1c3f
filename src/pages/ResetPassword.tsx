import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated successfully!");
      navigate("/my-picks", { replace: true });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="animate-pulse text-muted-foreground font-body text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8 text-center">
          <h1 className="font-display text-4xl tracking-wider">INVALID LINK</h1>
          <p className="text-muted-foreground font-body text-sm">
            This password reset link is invalid or has expired.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20"
          >
            BACK TO SIGN IN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="font-display text-4xl tracking-wider">NEW PASSWORD</h1>
          <p className="text-muted-foreground font-body text-sm mt-2">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <Input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="font-body"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20 disabled:opacity-50"
          >
            {loading ? "..." : "SAVE NEW PASSWORD"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
