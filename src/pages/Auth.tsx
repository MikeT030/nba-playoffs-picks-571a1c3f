import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import authHero from "@/assets/auth-hero.png";

type Step = "email" | "password" | "forgot";

const Auth = () => {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-email", {
        body: { email },
      });
      if (error) throw error;
      setIsExistingUser(!!data.exists);
      setStep("password");
    } catch (err: any) {
      toast.error("Could not verify email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isExistingUser) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Check your email for a password reset link!");
      setStep("password");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const subtitle =
    step === "email"
      ? "Enter your email to get started"
      : step === "forgot"
        ? "Enter your email to receive a reset link"
        : isExistingUser
          ? "Welcome back"
          : "A newbie.";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero image */}
      <div className="relative w-full h-[40vh] min-h-[260px] max-h-[420px] overflow-hidden">
        <img
          src={authHero}
          alt="NBA Championship trophy with confetti"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background" />
      </div>

      {/* Form */}
      <div className="flex-1 flex items-start justify-center px-4 -mt-[68px] relative z-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h1
              className="md:text-4xl tracking-wider leading-tight text-center text-4xl"
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
            >
              THE 2026 PLAYOFFS PICKS
            </h1>
            <p className="font-body mt-3 text-lg font-normal text-secondary-foreground whitespace-pre-line">{subtitle}</p>
          </div>

          {step === "forgot" ? (
            <form key="forgot-form" onSubmit={handleForgotPassword} className="space-y-8">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="font-body border-0 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-center text-xl font-normal text-primary-foreground fade-underline md:text-lg"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20 disabled:opacity-50"
              >
                {loading ? "..." : "SEND RESET LINK"}
              </button>
              <p className="text-center text-sm text-muted-foreground font-body">
                <button
                  type="button"
                  onClick={() => setStep("password")}
                  className="text-primary underline"
                >
                  Back to sign in
                </button>
              </p>
            </form>
          ) : step === "email" ? (
            <form key="email-form" onSubmit={handleEmailSubmit} className="space-y-8">
              <Input
                type="email"
                placeholder="Type your email, buddy."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="font-body border-0 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-center font-normal fade-underline md:text-lg text-xl text-primary-foreground opacity-90"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20 disabled:opacity-50"
              >
                {loading ? "..." : "CONTINUE"}
              </button>
            </form>
          ) : (
            <form key="password-form" onSubmit={handlePasswordSubmit} className="space-y-8">
              <div className="text-center">
                <p className="text-muted-foreground font-body text-xl">{email}</p>
                <button
                  type="button"
                  onClick={() => { setStep("email"); setPassword(""); }}
                  className="text-primary underline text-xs font-body mt-1"
                >
                  Change email
                </button>
              </div>
              {isExistingUser && (
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="font-body border-0 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-center text-xl font-normal text-primary-foreground fade-underline md:text-lg"
                  autoFocus
                />
              )}
              <button
                type="submit"
                disabled={loading || !isExistingUser}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "..." : isExistingUser ? "SIGN IN" : "SORRY, SIGNUPS ARE CLOSED"}
              </button>
              {isExistingUser && (
                <p className="text-center text-sm text-muted-foreground font-body">
                  <button
                    type="button"
                    onClick={() => setStep("forgot")}
                    className="text-primary underline"
                  >
                    Forgot password?
                  </button>
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;