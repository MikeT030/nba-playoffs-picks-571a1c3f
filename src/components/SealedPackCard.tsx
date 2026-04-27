import { useState, type ReactNode } from "react";
import flyerCouchClubLogo from "@/assets/flyer-couch-club-logo.png";

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
  title = "Supreme Premium Cards",
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
  // Memphis palette
  const PINK = "#ff4fa3";
  const CYAN = "#3ddad7";
  const YELLOW = "#ffd23f";
  const CORAL = "#ff7a5c";
  const LILAC = "#b39ddb";
  const BLUE = "#4f5bd5"; // background blue (Memphis hallmark)
  const INK = "#0f0f1a";

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: BLUE,
      }}
    >
      {/* Memphis confetti pattern: squiggles, triangles, dots, zigzags */}
      <MemphisPattern />

      {/* Top serrated edge */}
      <SerratedEdge position="top" />

      {/* Top banner — Flyer Couch Club logo */}
      <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[12%] flex justify-center">
        <img
          src={flyerCouchClubLogo}
          alt={topBanner}
          className="w-full h-auto"
          style={{
            filter: `drop-shadow(3px 3px 0 ${PINK}) drop-shadow(0 2px 4px rgba(0,0,0,0.4))`,
          }}
        />
      </div>

      {/* Big title — Memphis stacked shadow */}
      <div className="absolute top-[13%] left-0 right-0 text-center px-2">
        <h1
          className="font-display italic leading-none tracking-tight text-2xl"
          style={{
            fontSize: "clamp(28px, 10cqw, 64px)",
            color: YELLOW,
            WebkitTextStroke: `1.5px ${INK}`,
            textShadow: `3px 3px 0 ${PINK}, 6px 6px 0 ${CYAN}, 9px 9px 0 ${INK}`,
            transform: "skew(-6deg)",
          }}
        >
          {title}
        </h1>
      </div>

      {/* Year ribbon — angled cyan tab */}
      <div className="absolute top-[27%] left-1/2 -translate-x-1/2">
        <div
          className="font-display text-[11px] tracking-[0.25em] px-4 py-1"
          style={{
            background: CYAN,
            color: INK,
            fontWeight: 800,
            transform: "skew(-10deg) rotate(-2deg)",
            boxShadow: `3px 3px 0 ${INK}`,
            border: `2px solid ${INK}`,
          }}
        >
          <span className="inline-block" style={{ transform: "skew(10deg)" }}>{yearLabel}</span>
        </div>
      </div>

      {/* Basketball — kept but framed by Memphis shapes */}
      <div className="absolute top-[34%] left-1/2 -translate-x-1/2 w-[58%] aspect-square">
        {/* squiggle accent behind ball */}
        <svg viewBox="0 0 100 100" className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] pointer-events-none" aria-hidden>
          <path d="M 5 20 Q 15 5 25 20 T 45 20" fill="none" stroke={PINK} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 60 90 Q 70 75 80 90 T 100 90" fill="none" stroke={YELLOW} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 38% 35%, #fdba74 0%, ${CORAL} 50%, #9a3412 95%)`,
            boxShadow: `inset -8px -10px 22px rgba(0,0,0,0.5), 6px 6px 0 ${INK}`,
            border: `3px solid ${INK}`,
          }}
        />
        {/* Seams */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden>
          <g fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round">
            <line x1="50" y1="2" x2="50" y2="98" />
            <line x1="2" y1="50" x2="98" y2="50" />
            <path d="M 12 18 Q 50 50 12 82" />
            <path d="M 88 18 Q 50 50 88 82" />
          </g>
        </svg>

        {/* Mid label across basketball */}
        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 w-[115%]">
          <div
            className="text-center font-display tracking-[0.18em] py-0.5"
            style={{
              fontSize: "clamp(8px, 2.6cqw, 14px)",
              background: YELLOW,
              color: INK,
              fontWeight: 800,
              border: `2px solid ${INK}`,
              boxShadow: `2px 2px 0 ${PINK}`,
            }}
          >
            {midLine}
          </div>
        </div>

        {/* Tier panel */}
        <div className="absolute top-[56%] left-1/2 -translate-x-1/2 w-[55%]">
          <div
            className="text-center font-display tracking-[0.1em] py-1 px-1 leading-[1.05]"
            style={{
              background: "#fff",
              color: INK,
              fontWeight: 800,
              fontSize: "clamp(7px, 1.9cqw, 11px)",
              border: `2px solid ${INK}`,
              boxShadow: `2px 2px 0 ${CYAN}`,
            }}
          >
            {tierLine.map((t, i) => (
              <div key={i}>{t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Memphis triangle accent bottom-left */}
      <div
        className="absolute bottom-[20%] left-[6%] w-[12%] aspect-square pointer-events-none"
        style={{
          background: CYAN,
          clipPath: "polygon(0 100%, 100% 100%, 50% 0)",
          filter: `drop-shadow(2px 2px 0 ${INK})`,
        }}
      />
      {/* Memphis dot cluster bottom-right */}
      <div
        className="absolute bottom-[22%] right-[6%] w-[14%] aspect-square pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, ${PINK} 1.5px, transparent 2.5px)`,
          backgroundSize: "8px 8px",
        }}
      />

      {/* Bottom series banner — chunky Memphis tab */}
      <div className="absolute bottom-[7%] left-0 right-0">
        <div
          className="mx-auto w-[88%] text-center font-display italic tracking-[0.14em] py-1.5"
          style={{
            background: PINK,
            color: INK,
            fontSize: "clamp(14px, 4.5cqw, 28px)",
            transform: "skew(-8deg)",
            fontWeight: 800,
            border: `2.5px solid ${INK}`,
            boxShadow: `4px 4px 0 ${YELLOW}`,
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

/* Memphis-style background pattern: triangles, squiggles, dots, zigzags. */
const MemphisPattern = () => {
  const PINK = "#ff4fa3";
  const CYAN = "#3ddad7";
  const YELLOW = "#ffd23f";
  const CORAL = "#ff7a5c";
  const LILAC = "#b39ddb";
  const INK = "#0f0f1a";
  return (
    <svg
      viewBox="0 0 200 280"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full opacity-90 pointer-events-none"
      aria-hidden
    >
      {/* squiggles */}
      <path d="M 8 50 q 6 -10 12 0 t 12 0 t 12 0" fill="none" stroke={PINK} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 150 30 q 6 -10 12 0 t 12 0" fill="none" stroke={YELLOW} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 20 220 q 6 -10 12 0 t 12 0 t 12 0" fill="none" stroke={CYAN} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 140 250 q 6 -10 12 0 t 12 0" fill="none" stroke={CORAL} strokeWidth="2.5" strokeLinecap="round" />

      {/* zigzags */}
      <polyline points="170,80 175,72 180,80 185,72 190,80" fill="none" stroke={YELLOW} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="10,160 15,152 20,160 25,152 30,160" fill="none" stroke={PINK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="110,265 115,257 120,265 125,257 130,265" fill="none" stroke={CYAN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* triangles */}
      <polygon points="180,180 192,180 186,168" fill={LILAC} stroke={INK} strokeWidth="0.8" />
      <polygon points="6,90 18,90 12,78" fill={CORAL} stroke={INK} strokeWidth="0.8" />
      <polygon points="160,140 170,140 165,132" fill={YELLOW} stroke={INK} strokeWidth="0.8" />

      {/* dots / circles */}
      <circle cx="40" cy="20" r="3" fill={YELLOW} />
      <circle cx="180" cy="220" r="3" fill={PINK} />
      <circle cx="100" cy="10" r="2.5" fill={CYAN} />
      <circle cx="14" cy="270" r="2.5" fill={LILAC} />

      {/* small rings */}
      <circle cx="170" cy="200" r="3" fill="none" stroke={CYAN} strokeWidth="1.2" />
      <circle cx="30" cy="120" r="3" fill="none" stroke={YELLOW} strokeWidth="1.2" />
    </svg>
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
