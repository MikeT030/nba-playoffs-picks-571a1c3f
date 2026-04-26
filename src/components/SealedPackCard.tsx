import { useState, type ReactNode } from "react";

interface SealedPackCardProps {
  children: ReactNode;
  /** Aspect ratio for the sealed pack. Default matches the flyer card. */
  aspectClass?: string;
  /** Top banner line (small caps, e.g. "FLYER · CLUB"). */
  topBanner?: string;
  /** Big title (e.g. "NBA Flyer"). */
  title?: string;
  /** Year range (e.g. "1996-97"). */
  yearLabel?: string;
  /** Mid line under the basketball (e.g. "FLYER SUPER COLOR"). */
  midLine?: string;
  /** Bottom-left tier line (e.g. "1 PREMIUM FLYER CARD"). */
  tierLine?: string[];
  /** Bottom banner (e.g. "SERIES 2"). */
  seriesLabel?: string;
}

/**
 * A sealed trading-card pack inspired by 90s Topps NBA wax packs.
 * Click to "burn" the pack from the top-left corner to the bottom-right,
 * revealing the player card underneath. The burn edge sparkles with a
 * Miami Vice palette (cyan, magenta, hot pink) glitter.
 */
const SealedPackCard = ({
  children,
  aspectClass = "aspect-[3/4]",
  topBanner = "FLYER · CLUB",
  title = "NBA Flyer",
  yearLabel = "1996-97",
  midLine = "FLYER SUPER COLOR",
  tierLine = ["1", "PREMIUM", "FLYER", "CARD"],
  seriesLabel = "SERIES 2",
}: SealedPackCardProps) => {
  const [opened, setOpened] = useState(false);

  return (
    <div className={`relative w-full ${aspectClass} select-none`}>
      {/* Card underneath — revealed as the pack burns away */}
      <div className="absolute inset-0">{children}</div>

      {/* Sealed pack overlay (burns away on click) */}
      <button
        type="button"
        onClick={() => !opened && setOpened(true)}
        aria-label={opened ? "Pack opened" : "Tap to burn the pack open"}
        disabled={opened}
        className={`absolute inset-0 ${opened ? "pointer-events-none" : "cursor-pointer"}`}
      >
        <div className="absolute inset-0 overflow-hidden rounded-md">
          {/* Full pack face — masked diagonally so it disappears from
              top-left to bottom-right when `opened` flips on. */}
          <div
            className={`absolute inset-0 sealed-pack-burn ${opened ? "is-open" : ""}`}
          >
            <FullPackFace
              topBanner={topBanner}
              title={title}
              yearLabel={yearLabel}
              midLine={midLine}
              tierLine={tierLine}
              seriesLabel={seriesLabel}
            />
          </div>

          {/* Glittering Miami Vice burn edge — only visible while burning */}
          {opened && (
            <div className="absolute inset-0 pointer-events-none sealed-pack-ember" aria-hidden />
          )}

          {/* Tap hint */}
          {!opened && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <div className="font-display text-[10px] tracking-[0.3em] text-white bg-black/55 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/25 animate-pulse">
                TAP TO BURN
              </div>
            </div>
          )}

          {/* Holographic shine */}
          {!opened && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-60"
              style={{
                background:
                  "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)",
                backgroundSize: "220% 100%",
                animation: "pack-shine 3.5s ease-in-out infinite",
              }}
            />
          )}
        </div>

        <style>{`
          @keyframes pack-shine {
            0%, 100% { background-position: 220% 0; }
            50% { background-position: -120% 0; }
          }

          /* The pack face is masked with a diagonal gradient. The mask's
             "position" slides from before the top-left corner all the way
             past the bottom-right, eating the foil away as it goes. */
          .sealed-pack-burn {
            -webkit-mask-image: linear-gradient(
              135deg,
              transparent 0%,
              transparent 6%,
              rgba(0,0,0,0.4) 8%,
              #000 12%,
              #000 100%
            );
            mask-image: linear-gradient(
              135deg,
              transparent 0%,
              transparent 6%,
              rgba(0,0,0,0.4) 8%,
              #000 12%,
              #000 100%
            );
            -webkit-mask-size: 260% 260%;
            mask-size: 260% 260%;
            -webkit-mask-position: 100% 100%; /* fully covered */
            mask-position: 100% 100%;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            transition: -webkit-mask-position 1600ms cubic-bezier(0.65, 0, 0.35, 1),
                        mask-position 1600ms cubic-bezier(0.65, 0, 0.35, 1);
          }
          .sealed-pack-burn.is-open {
            -webkit-mask-position: 0% 0%; /* fully burned away */
            mask-position: 0% 0%;
          }

          /* Miami Vice glittering ember sliding along the same diagonal. */
          .sealed-pack-ember {
            background:
              /* sparkle dots layer */
              radial-gradient(circle at 20% 30%, #fff 0 1px, transparent 2px),
              radial-gradient(circle at 70% 60%, #22d3ee 0 1px, transparent 2px),
              radial-gradient(circle at 40% 80%, #ec4899 0 1px, transparent 2px),
              radial-gradient(circle at 85% 20%, #f0abfc 0 1px, transparent 2px),
              radial-gradient(circle at 10% 70%, #fff 0 1px, transparent 2px),
              /* glowing ember band — cyan -> magenta -> hot pink */
              linear-gradient(
                135deg,
                transparent 0%,
                transparent 4%,
                rgba(34, 211, 238, 0.9) 6%,
                rgba(236, 72, 153, 1) 9%,
                rgba(244, 114, 182, 0.9) 11%,
                rgba(255, 200, 120, 0.6) 13%,
                transparent 16%,
                transparent 100%
              );
            background-size: 18px 18px, 22px 22px, 26px 26px, 20px 20px, 24px 24px, 260% 260%;
            background-repeat: repeat, repeat, repeat, repeat, repeat, no-repeat;
            background-position:
              0 0, 0 0, 0 0, 0 0, 0 0,
              100% 100%;
            mix-blend-mode: screen;
            filter: drop-shadow(0 0 6px rgba(236, 72, 153, 0.9))
                    drop-shadow(0 0 10px rgba(34, 211, 238, 0.6));
            animation: ember-sweep 1600ms cubic-bezier(0.65, 0, 0.35, 1) forwards;
          }

          @keyframes ember-sweep {
            from {
              background-position:
                0 0, 0 0, 0 0, 0 0, 0 0,
                100% 100%;
              opacity: 1;
            }
            85% { opacity: 1; }
            to {
              background-position:
                0 0, 0 0, 0 0, 0 0, 0 0,
                0% 0%;
              opacity: 0;
            }
          }
          }
        `}</style>
      </button>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   The actual printed face of the wax pack.
   Both halves render the SAME full face — each half is then
   clipped, so when sealed the artwork lines up across the rip.
   ────────────────────────────────────────────────────────────── */
const PackFace = ({
  side,
  topBanner,
  title,
  yearLabel,
  midLine,
  tierLine,
  seriesLabel,
}: {
  side: "left" | "right";
  topBanner: string;
  title: string;
  yearLabel: string;
  midLine: string;
  tierLine: string[];
  seriesLabel: string;
}) => {
  // Each half is 60% of the pack's width, so the full face must be
  // rendered at 100/60 ≈ 166.667% of the half so it spans the whole pack.
  // The left half pins the artwork to its left edge; the right half pins
  // it to its right edge so the design stays aligned across the rip.
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute top-0 h-full"
        style={{
          width: "166.667%",
          left: side === "left" ? "0%" : "-66.667%",
        }}
      >
        <FullPackFace
          topBanner={topBanner}
          title={title}
          yearLabel={yearLabel}
          midLine={midLine}
          tierLine={tierLine}
          seriesLabel={seriesLabel}
        />
      </div>

      {/* Edge shading along the rip */}
      <div
        className="absolute inset-y-0 w-6 pointer-events-none"
        style={{
          [side === "left" ? "right" : "left"]: 0,
          background:
            side === "left"
              ? "linear-gradient(to right, transparent, rgba(0,0,0,0.55))"
              : "linear-gradient(to left, transparent, rgba(0,0,0,0.55))",
        }}
      />
    </div>
  );
};

const FullPackFace = ({
  topBanner,
  title,
  yearLabel,
  midLine,
  tierLine,
  seriesLabel,
}: {
  topBanner: string;
  title: string;
  yearLabel: string;
  midLine: string;
  tierLine: string[];
  seriesLabel: string;
}) => {
  return (
    <div
      className="relative w-full h-full"
      style={{
        // Magenta/purple foil base with darker edges (matches the reference pack)
        background:
          "radial-gradient(ellipse at 50% 45%, #d946ef 0%, #a21caf 35%, #4a044e 78%, #1a0322 100%)",
      }}
    >
      {/* Foil noise / grain */}
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, rgba(255,255,255,0.12) 0 1px, transparent 1px 3px), repeating-linear-gradient(25deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 4px)",
        }}
      />

      {/* Crinkles */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 30% at 30% 20%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(ellipse 50% 25% at 70% 80%, rgba(0,0,0,0.4), transparent 60%)",
        }}
      />

      {/* Top serrated edge */}
      <SerratedEdge position="top" />

      {/* Top banner — TOPPS STADIUM CLUB style */}
      <div className="absolute top-[7%] left-1/2 -translate-x-1/2 w-[78%]">
        <div
          className="text-center font-display tracking-[0.18em] text-white py-1 px-2 text-[11px]"
          style={{
            background: "linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)",
            boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.25)",
            color: "#3b0764",
            fontWeight: 800,
          }}
        >
          {topBanner}
        </div>
      </div>

      {/* Big title in italic display style */}
      <div className="absolute top-[14%] left-0 right-0 text-center">
        <h1
          className="font-display italic text-white leading-none tracking-tight"
          style={{
            fontSize: "clamp(28px, 9.5cqw, 64px)",
            textShadow: "2px 3px 0 rgba(0,0,0,0.55), 0 0 18px rgba(255,255,255,0.25)",
            transform: "skew(-6deg)",
          }}
        >
          {title}
        </h1>
      </div>

      {/* Year ribbon */}
      <div className="absolute top-[27%] left-1/2 -translate-x-1/2">
        <div
          className="font-display text-[11px] tracking-[0.2em] text-white px-3 py-0.5"
          style={{
            background: "linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)",
            boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.3)",
            transform: "skew(-8deg)",
          }}
        >
          <span className="inline-block" style={{ transform: "skew(8deg)" }}>{yearLabel}</span>
        </div>
      </div>

      {/* Basketball */}
      <div className="absolute top-[33%] left-1/2 -translate-x-1/2 w-[58%] aspect-square">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle at 38% 35%, #fdba74 0%, #ea580c 45%, #9a3412 90%)",
            boxShadow: "inset -8px -10px 24px rgba(0,0,0,0.55), 0 6px 14px rgba(0,0,0,0.45)",
          }}
        />
        {/* Seams */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden>
          <g fill="none" stroke="#3b0a02" strokeWidth="1.5" strokeLinecap="round">
            <line x1="50" y1="2" x2="50" y2="98" />
            <line x1="2" y1="50" x2="98" y2="50" />
            <path d="M 12 18 Q 50 50 12 82" />
            <path d="M 88 18 Q 50 50 88 82" />
          </g>
        </svg>

        {/* Mid label across basketball */}
        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 w-[110%]">
          <div
            className="text-center font-display text-white tracking-[0.15em] py-0.5"
            style={{
              fontSize: "clamp(8px, 2.6cqw, 14px)",
              background: "linear-gradient(180deg, #fde68a 0%, #f59e0b 100%)",
              color: "#3b0764",
              fontWeight: 800,
              boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.25)",
            }}
          >
            {midLine}
          </div>
        </div>

        {/* Tier panel */}
        <div className="absolute top-[55%] left-1/2 -translate-x-1/2 w-[55%]">
          <div
            className="text-center font-display tracking-[0.1em] py-1 px-1 leading-[1.05]"
            style={{
              background: "rgba(254, 243, 199, 0.95)",
              color: "#7c2d12",
              fontWeight: 800,
              fontSize: "clamp(7px, 1.9cqw, 11px)",
            }}
          >
            {tierLine.map((t, i) => (
              <div key={i}>{t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* NBA logo placeholder (small mark) */}
      <div className="absolute top-[78%] left-[10%] w-[10%] aspect-[3/5] opacity-90">
        <div
          className="w-full h-full"
          style={{
            background: "linear-gradient(180deg, #1e3a8a 0%, #1e3a8a 50%, #b91c1c 50%, #b91c1c 100%)",
            clipPath: "polygon(20% 0, 80% 0, 100% 100%, 0 100%)",
          }}
        >
          <div className="w-1/2 h-full bg-white/95" style={{ clipPath: "polygon(40% 15%, 70% 15%, 60% 85%, 30% 85%)" }} />
        </div>
      </div>

      {/* Bottom series banner */}
      <div className="absolute bottom-[7%] left-0 right-0">
        <div
          className="mx-auto w-[88%] text-center font-display italic tracking-[0.12em] text-white py-1.5"
          style={{
            background: "linear-gradient(180deg, #14b8a6 0%, #0f766e 100%)",
            boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.3)",
            fontSize: "clamp(14px, 4.5cqw, 28px)",
            transform: "skew(-8deg)",
            fontWeight: 800,
          }}
        >
          <span className="inline-block" style={{ transform: "skew(8deg)" }}>
            {seriesLabel}
          </span>
        </div>
      </div>

      {/* Bottom serrated edge */}
      <SerratedEdge position="bottom" />
    </div>
  );
};

const SerratedEdge = ({ position }: { position: "top" | "bottom" }) => {
  return (
    <div
      className="absolute left-0 right-0 h-3"
      style={{
        [position]: 0,
        background: "rgba(0,0,0,0.5)",
        WebkitMaskImage:
          position === "top"
            ? "linear-gradient(180deg, black 60%, transparent)"
            : "linear-gradient(0deg, black 60%, transparent)",
        maskImage:
          position === "top"
            ? "linear-gradient(180deg, black 60%, transparent)"
            : "linear-gradient(0deg, black 60%, transparent)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0 6px, rgba(0,0,0,0.4) 6px 7px)",
        }}
      />
    </div>
  );
};

export default SealedPackCard;
