import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import splashLogo from "@/assets/splash-logo.png";

const SESSION_KEY = "splash-shown";

/**
 * Once-per-session intro splash.
 *  0–3150ms  : logo (20% smaller) gently pulses, headline blurred (milky glass)
 *  3200ms    : headline blur clears, logo grows to natural size
 *  3600ms    : logo morphs into /auth hero position (top, full-width, 40vh)
 *  4000ms    : splash unmounts → /auth (signed-out) or / (signed-in)
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
    const handler = () => {
      setPhase(0);
      setShow(true);
    };
    window.addEventListener("splash:replay", handler);
    return () => window.removeEventListener("splash:replay", handler);
  }, []);

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

    const t1 = window.setTimeout(() => setPhase(1), 3200);
    const t2 = window.setTimeout(() => setPhase(2), 3600);
    const t3 = window.setTimeout(() => {
      finish();
      setShow(false);
    }, 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    function finish() {
      if (loading) return;
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

  // Phase 0: pulsing at 80% size, centered
  // Phase 1: clear blur, scale to 100%, still centered
  // Phase 2: morph to /auth hero position — fixed top, full-width, 40vh
  const isHero = phase === 2;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] bg-background overflow-hidden pointer-events-none"
    >
      {/* Image wrapper — animates from centered small box to top hero strip */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "20vh",
          width: isHero ? "100vw" : "10rem",
          height: isHero ? "40vh" : "10rem",
          transform: "translate(-50%, -50%)",
          transition:
            "top 700ms cubic-bezier(0.65, 0, 0.35, 1), width 700ms cubic-bezier(0.65, 0, 0.35, 1), height 700ms cubic-bezier(0.65, 0, 0.35, 1)",
          willChange: "top, width, height",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: phase === 0 ? "scale(0.7)" : "scale(1)",
            transition: phase === 0
              ? "transform 3200ms cubic-bezier(0.33, 0, 0.67, 1)"
              : "transform 600ms cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
        >
          <img
            src={splashLogo}
            alt=""
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: isHero ? 0 : "1rem",
              transition: "border-radius 500ms ease-out",
            }}
          />
        </div>
      </div>

      {/* Headline — sits below where the centered image was */}
      <h1
        className="md:text-4xl tracking-wider leading-tight text-center text-4xl absolute left-1/2 -translate-x-1/2"
        style={{
          top: "calc(40vh - 78px)",
          fontFamily: "'Archivo Black', sans-serif",
          filter: phase === 0 ? "blur(14px)" : "blur(0px)",
          opacity: phase === 0 ? 0.85 : 1,
          transition: "filter 600ms ease-out, opacity 400ms ease-out",
        }}
      >
        <span className="font-thin" style={{ fontFamily: "'Barlow', sans-serif" }}>
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
        @keyframes heartbeat {
          0%, 32%, 100% { transform: scale(0.8); }
          8%  { transform: scale(0.92); }
          16% { transform: scale(0.8); }
          24% { transform: scale(0.92); }
        }
        .splash-pulse {
          animation: heartbeat 1050ms ease-in-out 3;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
