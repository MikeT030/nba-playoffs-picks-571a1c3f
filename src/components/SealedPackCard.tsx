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
      <div className="absolute top-[16%] left-0 right-0 text-center px-2">
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

      {/* Center: line-icon basketball (matches reference icon style) */}
      <div className="absolute top-[34%] left-1/2 -translate-x-1/2 w-[58%] aspect-square">
        <BasketballIcon className="absolute inset-0 w-full h-full" stroke={INK} />

        {/* Mid label across basketball */}
        <div className="absolute top-[42%] left-1/2 -translate-x-1/2 w-[115%]">
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
        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-[55%]">
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

      {/* Decorative line-icons bottom corners (replaces triangle + dot cluster) */}
      <div className="absolute bottom-[20%] left-[5%] w-[14%] aspect-square pointer-events-none">
        <HoopIcon className="w-full h-full" stroke={INK} />
      </div>
      <div className="absolute bottom-[21%] right-[5%] w-[14%] aspect-square pointer-events-none">
        <SneakerIcon className="w-full h-full" stroke={INK} />
      </div>

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

/* Background pattern: scattered hand-drawn line-icons (basketball / hoop /
   whistle / sneaker / jersey / scoreboard / trophy / court). */
const MemphisPattern = () => {
  const INK = "#0f0f1a";
  return (
    <svg
      viewBox="0 0 200 280"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full opacity-[0.18] pointer-events-none"
      aria-hidden
    >
      <g fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {/* basketball — top left */}
        <g transform="translate(14 22)">
          <circle cx="9" cy="9" r="9" />
          <path d="M 0 9 H 18 M 9 0 V 18 M 2 3 Q 9 9 2 15 M 16 3 Q 9 9 16 15" />
        </g>
        {/* hoop — top right */}
        <g transform="translate(168 14)">
          <rect x="0" y="0" width="18" height="10" />
          <path d="M 4 10 Q 9 22 14 10" />
          <path d="M 6 10 L 7 20 M 12 10 L 11 20 M 9 10 V 22" />
        </g>
        {/* whistle — middle left */}
        <g transform="translate(8 130)">
          <circle cx="6" cy="6" r="5" />
          <path d="M 11 6 H 18 L 18 10 H 11" />
          <path d="M 6 1 Q 11 -3 14 0" />
        </g>
        {/* sneaker — middle right */}
        <g transform="translate(170 132)">
          <path d="M 0 10 L 0 6 L 6 4 L 10 0 L 14 4 L 20 6 L 20 10 Z" />
          <path d="M 4 6 L 6 8 M 8 4 L 10 6 M 12 4 L 14 6" />
        </g>
        {/* jersey — top middle */}
        <g transform="translate(95 4)">
          <path d="M 4 2 L 0 6 L 3 9 L 5 7 V 16 H 13 V 7 L 15 9 L 18 6 L 14 2 L 11 4 Q 9 6 7 4 Z" />
        </g>
        {/* scoreboard — bottom left */}
        <g transform="translate(10 240)">
          <rect x="0" y="0" width="22" height="14" rx="1.5" />
          <path d="M 0 7 H 22 M 11 0 V 14" />
          <text x="5.5" y="5.5" fontSize="4" fill={INK} stroke="none" textAnchor="middle">17</text>
          <text x="16.5" y="5.5" fontSize="4" fill={INK} stroke="none" textAnchor="middle">30</text>
        </g>
        {/* trophy — bottom right */}
        <g transform="translate(170 248)">
          <path d="M 4 0 H 14 V 5 Q 14 9 9 9 Q 4 9 4 5 Z" />
          <path d="M 4 2 H 1 V 4 Q 1 7 4 7 M 14 2 H 17 V 4 Q 17 7 14 7" />
          <path d="M 9 9 V 12 M 6 14 H 12 M 9 12 L 6 14 M 9 12 L 12 14" />
        </g>
        {/* small basketball — bottom middle */}
        <g transform="translate(95 252)">
          <circle cx="6" cy="6" r="6" />
          <path d="M 0 6 H 12 M 6 0 V 12" />
        </g>
      </g>
    </svg>
  );
};

/* Center basketball drawn as a thin line-icon. */
const BasketballIcon = ({ className, stroke }: { className?: string; stroke: string }) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden>
    <g fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="50" r="44" />
      <line x1="50" y1="6" x2="50" y2="94" />
      <line x1="6" y1="50" x2="94" y2="50" />
      <path d="M 14 18 Q 50 50 14 82" />
      <path d="M 86 18 Q 50 50 86 82" />
    </g>
  </svg>
);

/* Hoop line-icon (matches reference style). */
const HoopIcon = ({ className, stroke }: { className?: string; stroke: string }) => (
  <svg viewBox="0 0 60 60" className={className} aria-hidden>
    <g fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="6" width="44" height="22" rx="1" />
      <line x1="30" y1="28" x2="30" y2="36" />
      <path d="M 14 36 Q 30 56 46 36 Z" />
      <path d="M 18 36 L 22 52 M 30 36 V 54 M 42 36 L 38 52 M 24 36 L 26 53 M 36 36 L 34 53" />
    </g>
  </svg>
);

/* Sneaker line-icon. */
const SneakerIcon = ({ className, stroke }: { className?: string; stroke: string }) => (
  <svg viewBox="0 0 60 40" className={className} aria-hidden>
    <g fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 4 30 L 4 22 Q 10 22 14 18 L 22 10 Q 26 6 30 10 L 36 16 Q 42 22 52 22 Q 58 22 58 28 V 32 Q 58 34 56 34 H 6 Q 4 34 4 32 Z" />
      <path d="M 16 18 L 20 22 M 24 14 L 28 18 M 30 12 L 34 16 M 38 18 L 42 22" />
      <line x1="4" y1="34" x2="58" y2="34" />
    </g>
  </svg>
);


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
