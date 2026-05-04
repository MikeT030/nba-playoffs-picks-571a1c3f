import { useState, type ReactNode } from "react";
import flyerCouchClubLogo from "@/assets/flyer-couch-club-logo.png";
import flyerCouchCrewLogo from "@/assets/flyer-couch-crew-logo.png";

export type SealedPackVariant = "v3" | "v4";

interface SealedPackCardProps {
  children: ReactNode;
  /** Aspect ratio for the sealed pack. Default matches the flyer card. */
  aspectClass?: string;
  /** Top banner line (small caps, e.g. "FLYER · CLUB"). */
  topBanner?: string;
  /** Big title (e.g. "Supreme Platinum"). */
  title?: string;
  /** Year range (e.g. "1996-97"). */
  yearLabel?: string;
  /** Mid line under the basketball (e.g. "FLYER SUPER COLOR"). */
  midLine?: string;
  /** Bottom-left tier line (e.g. "1 PREMIUM FLYER CARD"). */
  tierLine?: string[];
  /** Bottom banner (e.g. "Sizzling hot 2026 series"). */
  seriesLabel?: string;
  /** Start opened (skip animation, used for already-burned demo state). */
  defaultOpened?: boolean;
  /** Fired the first time the user taps the pack to open it. */
  onOpen?: () => void;
  /** Pack face layout variant. Default "v3". */
  variant?: SealedPackVariant;
}

/**
 * A sealed trading-card pack inspired by 90s Topps Supreme wax packs.
 * Click to "burn" the pack from the top-left corner to the bottom-right,
 * revealing the player card underneath. The burn edge sparkles with a
 * Miami Vice palette (cyan, magenta, hot pink) glitter.
 */
const SealedPackCard = ({
  children,
  aspectClass = "aspect-[3/4]",
  topBanner = "PLATINUM · CLUB",
  title = "Supreme Premium Platinum Player Cards",
  yearLabel = "1996-97",
  midLine = "PLATINUM SUPER COLOR",
  tierLine = ["1", "PREMIUM", "PLATINUM", "CARD"],
  seriesLabel = "Sizzling hot 2026 series",
  defaultOpened = false,
  onOpen,
  variant = "v3",
}: SealedPackCardProps) => {
  const [opened, setOpened] = useState(defaultOpened);

  const handleOpen = () => {
    if (opened) return;
    setOpened(true);
    onOpen?.();
  };

  return (
    <div className={`relative w-full ${aspectClass} select-none`}>
      {/* Card underneath — revealed as the pack burns away */}
      <div className="absolute inset-0">{children}</div>

      {/* Sealed pack overlay (burns away on click) */}
      <button
        type="button"
        onClick={handleOpen}
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
            {variant === "v4" ? (
              <FullPackFaceV4
                topBanner={topBanner}
                title={title}
                yearLabel={yearLabel}
                midLine={midLine}
                tierLine={tierLine}
                seriesLabel={seriesLabel}
              />
            ) : (
              <FullPackFace
                topBanner={topBanner}
                title={title}
                yearLabel={yearLabel}
                midLine={midLine}
                tierLine={tierLine}
                seriesLabel={seriesLabel}
              />
            )}
          </div>

          {/* Miami Vice burn edge — only visible while burning */}
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
              transparent 38%,
              rgba(0,0,0,0.4) 40%,
              #000 44%,
              #000 100%
            );
            mask-image: linear-gradient(
              135deg,
              transparent 0%,
              transparent 38%,
              rgba(0,0,0,0.4) 40%,
              #000 44%,
              #000 100%
            );
            -webkit-mask-size: 260% 260%;
            mask-size: 260% 260%;
            -webkit-mask-position: 100% 100%; /* fully covered */
            mask-position: 100% 100%;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            transition: -webkit-mask-position 4390ms cubic-bezier(0.65, 0, 0.35, 1),
                        mask-position 4390ms cubic-bezier(0.65, 0, 0.35, 1);
          }
          .sealed-pack-burn.is-open {
            -webkit-mask-position: -100% -100%; /* fully burned away past top-left */
            mask-position: -100% -100%;
          }

          /* Miami Vice ember band sweeping diagonally from top-left to bottom-right. */
          .sealed-pack-ember {
            background:
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
            background-size: 260% 260%;
            background-repeat: no-repeat;
            background-position: 100% 100%;
            mix-blend-mode: screen;
            filter: drop-shadow(0 0 6px rgba(236, 72, 153, 0.9))
                    drop-shadow(0 0 10px rgba(34, 211, 238, 0.6));
            animation: ember-sweep 4390ms cubic-bezier(0.65, 0, 0.35, 1) forwards;
          }

          @keyframes ember-sweep {
            from {
              background-position: 100% 100%;
              opacity: 1;
            }
            85% { opacity: 1; }
            to {
              background-position: -100% -100%;
              opacity: 0;
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
  const BLUE = "#1e2761"; // lighter navy background (Memphis hallmark)
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

      {/* Top banner — PLATINUM Couch Club logo */}
      <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[19.87%] flex justify-center">
        <img
          src={flyerCouchClubLogo}
          alt={topBanner}
          className="w-full h-auto"
          style={{
            filter: `drop-shadow(3px 3px 0 ${PINK}) drop-shadow(0 2px 4px rgba(0,0,0,0.4))`,
          }}
        />
      </div>

      {/* Big title — Memphis stacked shadow, words stacked into a block */}
      <div className="absolute left-0 right-0 text-center px-2 z-10" style={{ top: "55.75%", transform: "translateY(-50%)" }}>
        <h1
          className="font-display italic leading-[0.95] tracking-tight flex flex-col items-center"
          style={{
            fontSize: "clamp(24px, 10.5cqw, 62px)",
            color: YELLOW,
            WebkitTextStroke: `1px ${INK}`,
            textShadow: `2px 2px 0 ${PINK}, 4px 4px 0 ${CYAN}, 6px 6px 0 ${INK}`,
            transform: "skew(-6deg)",
          }}
        >
          {title.split(" ").map((word, i) => (
            <span key={i} className="block">{word}</span>
          ))}
          <span className="block">Premium</span>
          <span className="block">Cards</span>
        </h1>
      </div>

      {/* Year ribbon hidden */}

      {/* Basketball icon hidden */}

      {/* (Memphis triangle/dot accents removed — replaced by basketball line-art icons) */}

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
          <span className="inline-block text-base" style={{ transform: "skew(8deg)" }}>
            {seriesLabel}
          </span>
        </div>
      </div>

      {/* Bottom serrated edge */}
      <SerratedEdge position="bottom" />
    </div>
  );
};

/* Basketball line-art icons scattered across the pack, Memphis-colored.
   Each icon is drawn in a 24x24 viewBox and placed at various positions/rotations. */
const BasketballIcon = ({ name, color }: { name: string; color: string }) => {
  const sw = 1.6;
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth: sw,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "clipboard": // playbook clipboard with X/O strategy
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
          <rect x="4" y="4" width="16" height="18" rx="1.2" {...common} />
          <rect x="9" y="2.5" width="6" height="3" rx="0.6" {...common} />
          <path d="M 8 10 L 11 13 M 11 10 L 8 13" {...common} />
          <circle cx="15" cy="11.5" r="1.6" {...common} />
          <path d="M 9.5 16 Q 12 14 14.5 17.5" {...common} strokeDasharray="1.2 1.2" />
          <circle cx="14.5" cy="17.5" r="0.6" fill={color} stroke="none" />
        </svg>
      );
    case "dribble": // hand dribbling a ball with arrows
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
          <path d="M 4 8 Q 7 6 10 8 L 14 8 Q 16 8 16 10" {...common} />
          <circle cx="11" cy="14" r="3.2" {...common} />
          <path d="M 11 10.8 V 17.2 M 7.8 14 H 14.2 M 8.7 11.7 Q 11 14 8.7 16.3 M 13.3 11.7 Q 11 14 13.3 16.3" {...common} strokeWidth="1.1" />
          <path d="M 5 18 V 22 M 4 21 L 5 22 L 6 21" {...common} />
          <path d="M 17 11 V 7 M 16 8 L 17 7 L 18 8" {...common} />
        </svg>
      );
    case "shot": // figure shooting an arc to hoop
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
          <circle cx="6" cy="6" r="1.4" {...common} />
          <path d="M 6 7.4 V 13 L 4 18 M 6 13 L 9 17" {...common} />
          <path d="M 6 11 L 9 9" {...common} />
          <path d="M 9 9 Q 16 4 20 12" {...common} strokeDasharray="1.4 1.4" />
          <path d="M 19 13 H 22 M 20.5 13 V 16" {...common} />
        </svg>
      );
    case "whistle": // basketball sneaker silhouette
      return (
        <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden>
          <path
            fill={color}
            stroke="none"
            d="M2 44 C2 40 6 38 10 38 L18 38 L22 30 C24 26 28 24 32 24 L36 24 C39 24 41 26 42 28 L44 33 L52 36 C58 38 62 41 62 46 L62 50 C62 52 60 54 58 54 L6 54 C3 54 2 52 2 50 Z M22 44 L26 44 M30 44 L34 44 M38 44 L42 44 M46 46 L50 46 M14 48 L18 48"
          />
          <path
            d="M22 44 L26 44 M30 44 L34 44 M38 44 L42 44"
            stroke="white"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    case "hoop": // backboard, rim, net, post
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
          <rect x="4" y="3" width="16" height="9" {...common} />
          <path d="M 9 12 H 15 L 14 17 H 10 Z" {...common} />
          <path d="M 10 17 L 10.5 19 M 12 17 V 19.3 M 14 17 L 13.5 19" {...common} strokeWidth="1.1" />
          <path d="M 12 7.5 V 12 M 12 19.3 V 22 M 10 22 H 14" {...common} />
        </svg>
      );
    case "court":
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
          <rect x="3" y="6" width="18" height="12" rx="0.6" {...common} />
          <line x1="12" y1="6" x2="12" y2="18" {...common} />
          <circle cx="12" cy="12" r="2" {...common} />
          <path d="M 3 9 H 6 V 15 H 3" {...common} />
          <path d="M 21 9 H 18 V 15 H 21" {...common} />
          <circle cx="6" cy="12" r="0.7" fill={color} stroke="none" />
          <circle cx="18" cy="12" r="0.7" fill={color} stroke="none" />
        </svg>
      );
    case "ballhand": // ball balanced on a hand
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
          <circle cx="12" cy="9" r="4.5" {...common} />
          <path d="M 7.6 9 H 16.4 M 12 4.5 V 13.5 M 8.4 6.4 Q 12 9 8.4 11.6 M 15.6 6.4 Q 12 9 15.6 11.6" {...common} strokeWidth="1.1" />
          <path d="M 4 17 Q 7 15 9 17 Q 12 19 15 17 Q 17 15 20 17" {...common} />
          <path d="M 5 18 V 21 M 19 18 V 21" {...common} />
        </svg>
      );
    case "play": // tactic board on easel
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
          <rect x="3.5" y="5" width="17" height="11" rx="0.6" {...common} />
          <path d="M 6 16 L 4 21 M 18 16 L 20 21 M 12 16 V 21" {...common} />
          <path d="M 7 9 L 9 11 M 9 9 L 7 11" {...common} />
          <circle cx="13" cy="10" r="1.2" {...common} />
          <path d="M 8 13 Q 12 11 16 13.5" {...common} strokeDasharray="1.2 1.2" />
          <path d="M 16 13.5 L 17 12.5 M 16 13.5 L 17 14.5" {...common} />
        </svg>
      );
    case "jump": // figure jumping with ball
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
          <circle cx="9" cy="5" r="1.4" {...common} />
          <path d="M 9 6.5 L 8 11 L 5 14 M 8 11 L 12 13 L 14 17 M 12 13 L 11 18" {...common} />
          <circle cx="15" cy="8" r="1.8" {...common} />
          <path d="M 13.4 8 H 16.6 M 15 6.4 V 9.6" {...common} strokeWidth="1" />
        </svg>
      );
    default:
      return null;
  }
};

const MemphisPattern = () => {
  const PINK = "#ff4fa3";
  const CYAN = "#3ddad7";
  const YELLOW = "#ffd23f";
  const CORAL = "#ff7a5c";
  const LILAC = "#b39ddb";

  // Scattered icon placements — top zone, mid sides (around ball), bottom zone.
  // Avoid the central column (title/ball/tier) and bottom banner area.
  const icons: Array<{
    name: string;
    color: string;
    top: string;
    left: string;
    size: string;
    rotate: number;
  }> = [
    // Top row (under serrated edge, above title)
    { name: "clipboard", color: YELLOW, top: "5%", left: "6%", size: "13%", rotate: -12 },
    { name: "whistle", color: CYAN, top: "5.5%", left: "82%", size: "14%", rotate: 10 },

    // Upper-mid corners (flanking title)
    { name: "play", color: PINK, top: "17%", left: "4%", size: "13%", rotate: 8 },
    { name: "court", color: LILAC, top: "16%", left: "83%", size: "14%", rotate: -6 },

    // Mid sides (flanking the basketball)
    { name: "hoop", color: PINK, top: "40%", left: "3%", size: "14%", rotate: -8 },
    { name: "shot", color: YELLOW, top: "40%", left: "83%", size: "14%", rotate: 6 },
    { name: "dribble", color: CYAN, top: "55%", left: "3%", size: "13%", rotate: 10 },
    { name: "ballhand", color: CORAL, top: "55%", left: "83%", size: "14%", rotate: -10 },

    // Lower zone (above bottom banner)
    { name: "jump", color: YELLOW, top: "76%", left: "8%", size: "13%", rotate: -6 },
    { name: "court", color: CYAN, top: "76%", left: "78%", size: "14%", rotate: 8 },
  ];

  // Tonal repeating watermark pattern (Panini-pack style): large
  // skewed "FLYER" wordmark tiled across the background.
  const tile = encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='220' height='120' viewBox='0 0 220 120'>
      <g font-family='Impact, Bebas Neue, Oswald, sans-serif' font-weight='900'
         font-size='72' font-style='italic' fill='hsl(200, 80%, 60%)' fill-opacity='0.35'
         transform='skewX(-12)'>
        <text x='-10' y='70'>FLYER</text>
        <text x='110' y='30'>FLYER</text>
        <text x='110' y='110'>FLYER</text>
      </g>
    </svg>
  `);

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,${tile}")`,
        backgroundRepeat: "repeat",
        backgroundSize: "55% auto",
        mixBlendMode: "overlay",
      }}
    />
  );

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
      {icons.map((ic, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: ic.top,
            left: ic.left,
            width: ic.size,
            transform: `rotate(${ic.rotate}deg)`,
          }}
        >
          <BasketballIcon name={ic.name} color={ic.color} />
        </div>
      ))}
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

/* ──────────────────────────────────────────────────────────────
   V4 — Hero dunker layout.
   Reuses MemphisPattern + SerratedEdge + color tokens.
   ────────────────────────────────────────────────────────────── */
const FullPackFaceV4 = ({
  title,
  seriesLabel,
}: {
  topBanner: string;
  title: string;
  yearLabel: string;
  midLine: string;
  tierLine: string[];
  seriesLabel: string;
}) => {
  const PINK = "#ff4fa3";
  const CYAN = "#3ddad7";
  const YELLOW = "#ffd23f";
  const BLUE = "#1e2761";
  const INK = "#0f0f1a";

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: BLUE }}
    >
      <MemphisPattern />
      <SerratedEdge position="top" />

      {/* Left — hero dunker silhouette */}
      <div className="absolute left-[-4%] top-[10%] bottom-[16%] w-[58%] pointer-events-none">
        <DunkerSilhouette color={INK} />
      </div>

      {/* Right column — headline */}
      <div
        className="absolute right-[3%] z-10"
        style={{ top: "12%", width: "44%" }}
      >
        <h1
          className="font-display italic leading-[0.92] tracking-tight flex flex-col items-center text-center"
          style={{
            fontSize: "clamp(18px, 8.5cqw, 48px)",
            color: YELLOW,
            WebkitTextStroke: `1px ${INK}`,
            textShadow: `2px 2px 0 ${PINK}, 4px 4px 0 ${CYAN}, 6px 6px 0 ${INK}`,
            transform: "skew(-6deg)",
          }}
        >
          {title.split(" ").slice(0, 3).map((word, i) => (
            <span key={i} className="block">{word}</span>
          ))}
        </h1>
      </div>

      {/* Right — "1 CARD" chunky badge */}
      <div
        className="absolute right-[6%] z-10 text-center"
        style={{ top: "58%" }}
      >
        <div
          className="font-display italic leading-[0.95] px-3 py-2"
          style={{
            background: INK,
            color: YELLOW,
            border: `2.5px solid ${INK}`,
            boxShadow: `4px 4px 0 ${PINK}, 7px 7px 0 ${CYAN}`,
            transform: "skew(-6deg)",
            fontSize: "clamp(14px, 5.5cqw, 30px)",
            fontWeight: 900,
            letterSpacing: "0.04em",
          }}
        >
          <span className="block" style={{ transform: "skew(6deg)" }}>1</span>
          <span className="block" style={{ transform: "skew(6deg)" }}>CARD</span>
        </div>
      </div>

      {/* Bottom-left — series banner */}
      <div className="absolute bottom-[6%] left-[3%] w-[52%] z-10">
        <div
          className="text-center font-display italic tracking-[0.12em] py-1.5 px-2"
          style={{
            background: PINK,
            color: INK,
            fontSize: "clamp(10px, 3.2cqw, 18px)",
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

      {/* Bottom-right — FLYER Couch Crew logo */}
      <div className="absolute bottom-[5%] right-[4%] w-[34%] z-10 flex justify-end">
        <img
          src={flyerCouchCrewLogo}
          alt="FLYER Couch Crew"
          className="w-full h-auto"
          style={{
            filter: `drop-shadow(3px 3px 0 ${PINK}) drop-shadow(0 2px 4px rgba(0,0,0,0.4))`,
          }}
        />
      </div>

      <SerratedEdge position="bottom" />
    </div>
  );
};

/* Inline silhouette of a player dunking on a hoop with backboard. */
const DunkerSilhouette = ({ color }: { color: string }) => (
  <svg
    viewBox="0 0 200 260"
    width="100%"
    height="100%"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden
  >
    <g fill={color}>
      {/* Backboard */}
      <rect x="10" y="40" width="70" height="55" rx="2" />
      {/* Pole */}
      <rect x="6" y="40" width="6" height="200" />
      {/* Rim */}
      <rect x="78" y="92" width="34" height="4" />
      {/* Net strands */}
      <path d="M80 96 L86 124 L92 96 Z" />
      <path d="M92 96 L98 124 L104 96 Z" />
      <path d="M104 96 L110 122 L112 96 Z" />
      {/* Head */}
      <circle cx="118" cy="78" r="10" />
      {/* Torso */}
      <path d="M112 88 Q108 110 116 130 L132 132 Q140 116 134 92 Z" />
      {/* Right arm dunking */}
      <path d="M126 92 Q120 78 110 70 L102 72 Q98 80 108 88 Z" />
      {/* Left arm */}
      <path d="M118 100 Q132 108 150 102 L152 110 Q138 120 120 114 Z" />
      {/* Hips */}
      <path d="M114 128 Q116 144 128 146 L138 142 Q140 130 132 126 Z" />
      {/* Right leg tucked */}
      <path d="M120 142 Q108 158 110 178 L122 182 Q132 166 130 148 Z" />
      {/* Left leg trailing */}
      <path d="M132 142 Q150 168 158 200 L148 210 Q132 188 124 152 Z" />
      {/* Shoes */}
      <ellipse cx="116" cy="186" rx="14" ry="6" />
      <ellipse cx="154" cy="208" rx="14" ry="6" />
      {/* Basketball */}
      <circle cx="100" cy="68" r="11" />
    </g>
  </svg>
);

export default SealedPackCard;
