import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import splashLogo from "@/assets/splash-logo.png";

const SESSION_KEY = "splash-shown";

/**
 * Once-per-session intro splash.
 *  0–900ms  : logo gently pulses, headline blurred (milky glass)
 *  900ms    : headline blur clears, logo starts scaling up
 *  1700ms   : logo zoom-bursts to fill screen, headline fades
 *  2000ms   : splash unmounts → /auth (signed-out) or / (signed-in)
 */
const SplashScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.location.pathname === "/reset-password") return false;
    return sessionStorage.getItem(SESSION_KEY) !== "1";
  });
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    if (!show) return;
    sessionStorage.setItem(SESSION_KEY, "1");

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      const t = window.setTimeout(() => {
        finish();
        setShow(false);
      }, 600);
      return () => clearTimeout(t);
    }

    const t1 = window.setTimeout(() => setPhase(1), 900);
    const t2 = window.setTimeout(() => setPhase(2), 1700);
    const t3 = window.setTimeout(() => {
      finish();
      setShow(false);
    }, 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    function finish() {
      if (loading) return;
      // Only redirect if the user landed on a "default" entry route.
      const onEntry =
        location.pathname === "/" || location.pathname === "/auth";
      if (!onEntry) return;
      const target = user ? "/" : "/auth";
      if (location.pathname !== target) {
        navigate(target, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!show) return null;

  const imgTransform =
    phase === 0 ? "scale(1)" : phase === 1 ? "scale(1.35)" : "scale(28)";
  const imgTransition =
    phase === 1
      ? "transform 800ms cubic-bezier(0.45, 0, 0.55, 1)"
      : phase === 2
        ? "transform 320ms cubic-bezier(0.7, 0, 0.84, 0)"
        : undefined;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center px-4 overflow-hidden pointer-events-none"
    >
      <div
        className={phase === 0 ? "splash-pulse" : ""}
        style={{
          willChange: "transform",
          transition: imgTransition,
          transform: imgTransform,
        }}
      >
        <img
          src={splashLogo}
          alt=""
          draggable={false}
          className="w-40 h-40 md:w-48 md:h-48 object-cover rounded-2xl"
        />
      </div>

      <h1
        className="md:text-4xl tracking-wider leading-tight text-center text-4xl mt-8"
        style={{
          fontFamily: "'Archivo Black', sans-serif",
          filter: phase === 0 ? "blur(14px)" : "blur(0px)",
          opacity: phase === 2 ? 0 : phase === 0 ? 0.85 : 1,
          transition:
            "filter 600ms ease-out, opacity 250ms ease-out",
        }}
      >
        <span
          className="font-thin"
          style={{ fontFamily: "'Barlow', sans-serif" }}
        >
          2026
        </span>
        <br />
        <span
          className="font-bold text-5xl block leading-[1.15]"
          style={{ fontFamily: "'Claymale', 'Archivo Black', sans-serif" }}
        >
          Playoffs
        </span>
        <span
          className="font-bold text-5xl block leading-[1.15]"
          style={{ fontFamily: "'Claymale', 'Archivo Black', sans-serif" }}
        >
          Picks
        </span>
      </h1>

      <style>{`
        @keyframes splashPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        .splash-pulse { animation: splashPulse 1.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default SplashScreen;
