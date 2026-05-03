import { useState, type ReactNode } from "react";
import flyerLogo from "@/assets/flyer-logo-single.png";

interface SealedPackCardToppsStyleProps {
  children: ReactNode;
  aspectClass?: string;
  /** Big sport label, e.g. "Playoffs". */
  sportLabel?: string;
  /** Year label, e.g. "2026". */
  yearLabel?: string;
  /** Series sub-label, e.g. "SERIES 1". */
  seriesLabel?: string;
  /** Bottom-left small line, e.g. "15 PICTURE CARDS". */
  picturesLabel?: string;
  /** Top-left badge, e.g. "PREMIUM QUALITY". */
  qualityLabel?: string;
  defaultOpened?: boolean;
  onOpen?: () => void;
}

/**
 * Sealed pack inspired by 1992-93 Topps Basketball wax wrappers.
 * Click the pack to "burn" it open from top-left to bottom-right,
 * revealing the player card underneath.
 */
const SealedPackCardToppsStyle = ({
  children,
  aspectClass = "aspect-[3/4]",
  sportLabel = "Playoffs",
  yearLabel = "2026",
  seriesLabel = "SERIES 1",
  picturesLabel = "15 PICTURE CARDS",
  qualityLabel = "PREMIUM QUALITY",
  defaultOpened = false,
  onOpen,
}: SealedPackCardToppsStyleProps) => {
  const [opened, setOpened] = useState(defaultOpened);
  const handleOpen = () => {
    if (opened) return;
    setOpened(true);
    onOpen?.();
  };

  return (
    <div className={`relative w-full ${aspectClass} select-none`}>
      <div className="absolute inset-0">{children}</div>

      <button
        type="button"
        onClick={handleOpen}
        aria-label={opened ? "Pack opened" : "Tap to burn the pack open"}
        disabled={opened}
        className={`absolute inset-0 ${opened ? "pointer-events-none" : "cursor-pointer"}`}
      >
        <div className="absolute inset-0 overflow-hidden rounded-md">
          <div className={`absolute inset-0 sealed-pack-burn-tps ${opened ? "is-open" : ""}`}>
            <PackFace
              sportLabel={sportLabel}
              yearLabel={yearLabel}
              seriesLabel={seriesLabel}
              picturesLabel={picturesLabel}
              qualityLabel={qualityLabel}
            />
          </div>

          {opened && (
            <div className="absolute inset-0 pointer-events-none sealed-pack-ember-tps" aria-hidden />
          )}

          {!opened && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <div className="font-display text-[10px] tracking-[0.3em] text-white bg-black/55 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/25 animate-pulse">
                TAP TO BURN
              </div>
            </div>
          )}

          {!opened && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-60"
              style={{
                background:
                  "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)",
                backgroundSize: "220% 100%",
                animation: "pack-shine-tps 3.5s ease-in-out infinite",
              }}
            />
          )}
        </div>

        <style>{`
          @keyframes pack-shine-tps {
            0%, 100% { background-position: 220% 0; }
            50% { background-position: -120% 0; }
          }
          .sealed-pack-burn-tps {
            -webkit-mask-image: linear-gradient(135deg, transparent 0%, transparent 38%, rgba(0,0,0,0.4) 40%, #000 44%, #000 100%);
            mask-image: linear-gradient(135deg, transparent 0%, transparent 38%, rgba(0,0,0,0.4) 40%, #000 44%, #000 100%);
            -webkit-mask-size: 260% 260%;
            mask-size: 260% 260%;
            -webkit-mask-position: 100% 100%;
            mask-position: 100% 100%;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            transition: -webkit-mask-position 4390ms cubic-bezier(0.65, 0, 0.35, 1),
                        mask-position 4390ms cubic-bezier(0.65, 0, 0.35, 1);
          }
          .sealed-pack-burn-tps.is-open {
            -webkit-mask-position: -100% -100%;
            mask-position: -100% -100%;
          }
          .sealed-pack-ember-tps {
            background: linear-gradient(135deg,
              transparent 0%, transparent 4%,
              rgba(34, 211, 238, 0.9) 6%,
              rgba(236, 72, 153, 1) 9%,
              rgba(244, 114, 182, 0.9) 11%,
              rgba(255, 200, 120, 0.6) 13%,
              transparent 16%, transparent 100%);
            background-size: 260% 260%;
            background-repeat: no-repeat;
            background-position: 100% 100%;
            mix-blend-mode: screen;
            filter: drop-shadow(0 0 6px rgba(236, 72, 153, 0.9))
                    drop-shadow(0 0 10px rgba(34, 211, 238, 0.6));
            animation: ember-sweep-tps 4390ms cubic-bezier(0.65, 0, 0.35, 1) forwards;
          }
          @keyframes ember-sweep-tps {
            from { background-position: 100% 100%; opacity: 1; }
            85% { opacity: 1; }
            to { background-position: -100% -100%; opacity: 0; }
          }
        `}</style>
      </button>
    </div>
  );
};

/* Speckled cyan/blue ice-crystal background like the original wrapper. */
const IceTexture = () => (
  <svg
    className="absolute inset-0 w-full h-full"
    viewBox="0 0 200 280"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden
  >
    <defs>
      <radialGradient id="iceBase" cx="50%" cy="40%" r="80%">
        <stop offset="0%" stopColor="#cfe9f7" />
        <stop offset="55%" stopColor="#7ebfe0" />
        <stop offset="100%" stopColor="#3a8fc0" />
      </radialGradient>
      <filter id="speckle">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
        <feColorMatrix
          values="0 0 0 0 1
                  0 0 0 0 1
                  0 0 0 0 1
                  0 0 0 1.4 -0.4"
        />
      </filter>
      <filter id="speckle2">
        <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="3" seed="3" />
        <feColorMatrix
          values="0 0 0 0 0.05
                  0 0 0 0 0.25
                  0 0 0 0 0.55
                  0 0 0 0.9 -0.2"
        />
      </filter>
    </defs>
    <rect width="200" height="280" fill="url(#iceBase)" />
    <rect width="200" height="280" filter="url(#speckle)" opacity="0.85" />
    <rect width="200" height="280" filter="url(#speckle2)" opacity="0.55" />
  </svg>
);

const SerratedEdge = ({ position }: { position: "top" | "bottom" }) => (
  <svg
    className={`absolute left-0 right-0 w-full h-3 ${position === "top" ? "top-0" : "bottom-0"}`}
    viewBox="0 0 100 6"
    preserveAspectRatio="none"
    aria-hidden
    style={position === "bottom" ? { transform: "scaleY(-1)" } : undefined}
  >
    <path
      d="M 0 0 L 100 0 L 100 3 L 97 6 L 94 3 L 91 6 L 88 3 L 85 6 L 82 3 L 79 6 L 76 3 L 73 6 L 70 3 L 67 6 L 64 3 L 61 6 L 58 3 L 55 6 L 52 3 L 49 6 L 46 3 L 43 6 L 40 3 L 37 6 L 34 3 L 31 6 L 28 3 L 25 6 L 22 3 L 19 6 L 16 3 L 13 6 L 10 3 L 7 6 L 4 3 L 1 6 L 0 3 Z"
      fill="rgba(0,0,0,0.35)"
    />
  </svg>
);

const PackFace = ({
  sportLabel,
  yearLabel,
  seriesLabel,
  picturesLabel,
  qualityLabel,
}: {
  sportLabel: string;
  yearLabel: string;
  seriesLabel: string;
  picturesLabel: string;
  qualityLabel: string;
}) => {
  const ORANGE = "#ee5a1f";
  const ORANGE_DARK = "#c93f10";
  const YELLOW = "#ffd23f";
  const YELLOW_DARK = "#d99a1a";
  const NAVY = "#1d2a6b";
  const WHITE = "#ffffff";

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#9bd2ee" }}>
      {/* Ice/crystal speckled blue background */}
      <IceTexture />

      {/* Faint ghosted basketball ball outline behind, top-right */}
      <svg
        viewBox="0 0 100 100"
        className="absolute -top-[10%] -right-[15%] w-[85%] h-auto opacity-30 mix-blend-multiply"
        aria-hidden
      >
        <circle cx="50" cy="50" r="46" fill="none" stroke="#1d2a6b" strokeWidth="1.4" />
        <path d="M 4 50 H 96" stroke="#1d2a6b" strokeWidth="1.4" fill="none" />
        <path d="M 50 4 V 96" stroke="#1d2a6b" strokeWidth="1.4" fill="none" />
        <path d="M 14 18 Q 50 50 14 82" stroke="#1d2a6b" strokeWidth="1.4" fill="none" />
        <path d="M 86 18 Q 50 50 86 82" stroke="#1d2a6b" strokeWidth="1.4" fill="none" />
      </svg>

      <SerratedEdge position="top" />

      {/* PREMIUM QUALITY badge with stars (top-left) */}
      <div className="absolute top-[6%] left-[5%] w-[34%]">
        <div
          className="font-display italic leading-[0.95] tracking-tight text-center"
          style={{
            color: NAVY,
            fontSize: "clamp(10px, 4.4cqw, 22px)",
            fontWeight: 900,
            textShadow: `1px 1px 0 ${WHITE}`,
            transform: "rotate(-4deg)",
          }}
        >
          <div>{qualityLabel.split(" ")[0]}</div>
          <div>{qualityLabel.split(" ").slice(1).join(" ")}</div>
        </div>
        {/* Star arc */}
        <svg viewBox="0 0 100 30" className="w-full h-auto mt-1" aria-hidden>
          {[10, 28, 46, 64, 82].map((cx, i) => (
            <g key={i} transform={`translate(${cx} ${18 - Math.sin((i / 4) * Math.PI) * 8}) rotate(${(i - 2) * 8})`}>
              <path
                d="M 0 -6 L 1.7 -1.8 L 6 -1.8 L 2.5 1 L 4 5.5 L 0 2.7 L -4 5.5 L -2.5 1 L -6 -1.8 L -1.7 -1.8 Z"
                fill={YELLOW}
                stroke={NAVY}
                strokeWidth="0.6"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Center diagonal orange band with FLYER logo */}
      <div
        className="absolute left-0 right-0 z-10"
        style={{
          top: "33%",
          height: "20%",
          background: `linear-gradient(180deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)`,
          transform: "rotate(-8deg) scale(1.18)",
          boxShadow: `0 3px 0 rgba(0,0,0,0.35), inset 0 -3px 0 rgba(0,0,0,0.25)`,
          borderTop: `2px solid ${NAVY}`,
          borderBottom: `2px solid ${NAVY}`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={flyerLogo}
            alt="FLYER"
            className="h-[78%] w-auto object-contain"
            style={{
              filter: "drop-shadow(2px 3px 0 rgba(0,0,0,0.55))",
            }}
          />
        </div>
      </div>

      {/* Yellow band underneath with the sport label */}
      <div
        className="absolute left-0 right-0 z-10"
        style={{
          top: "53%",
          height: "13%",
          background: `linear-gradient(180deg, ${YELLOW} 0%, ${YELLOW_DARK} 100%)`,
          transform: "rotate(-8deg) scale(1.18)",
          boxShadow: `0 3px 0 rgba(0,0,0,0.35), inset 0 -2px 0 rgba(0,0,0,0.25)`,
          borderTop: `2px solid ${NAVY}`,
          borderBottom: `2px solid ${NAVY}`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <span
            className="font-display italic"
            style={{
              color: WHITE,
              WebkitTextStroke: `1.5px ${NAVY}`,
              fontSize: "clamp(22px, 11cqw, 60px)",
              fontWeight: 900,
              letterSpacing: "0.01em",
              lineHeight: 1,
              textShadow: `2px 3px 0 ${NAVY}`,
              transform: "skew(-6deg)",
              whiteSpace: "nowrap",
            }}
          >
            {sportLabel}
          </span>
        </div>
      </div>

      {/* SERIES + YEAR row (rotated to follow the band) */}
      <div
        className="absolute left-0 right-0 z-10 flex items-center justify-between px-[6%]"
        style={{
          top: "67%",
          transform: "rotate(-8deg)",
        }}
      >
        <span
          className="font-display italic"
          style={{
            color: ORANGE,
            WebkitTextStroke: `0.6px ${NAVY}`,
            fontSize: "clamp(11px, 4.6cqw, 24px)",
            fontWeight: 900,
            letterSpacing: "0.05em",
            textShadow: `1px 1px 0 ${WHITE}`,
          }}
        >
          {seriesLabel}
        </span>
        <span
          className="font-display italic"
          style={{
            color: NAVY,
            fontSize: "clamp(14px, 6cqw, 34px)",
            fontWeight: 900,
            letterSpacing: "0.02em",
            textShadow: `1px 1px 0 ${WHITE}`,
          }}
        >
          {yearLabel}
        </span>
      </div>

      {/* Bottom-left: pictures label */}
      <div
        className="absolute z-10 text-center leading-[1]"
        style={{
          left: "5%",
          bottom: "6%",
          width: "30%",
          color: NAVY,
          fontWeight: 900,
        }}
      >
        <div
          className="font-display italic"
          style={{ fontSize: "clamp(9px, 3.6cqw, 18px)" }}
        >
          {picturesLabel.split(" ").map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
      </div>

      {/* Bottom-right: gold-stamp badge */}
      <div
        className="absolute z-10"
        style={{
          right: "5%",
          bottom: "5%",
          width: "48%",
        }}
      >
        <div
          className="relative rounded-full px-2 py-1.5 flex items-center gap-1.5"
          style={{
            background: `linear-gradient(180deg, ${YELLOW} 0%, ${YELLOW_DARK} 100%)`,
            border: `2px solid ${NAVY}`,
            boxShadow: `2px 2px 0 rgba(0,0,0,0.35)`,
          }}
        >
          <div className="flex-1 text-center leading-[1]">
            <div
              className="font-display italic"
              style={{
                fontSize: "clamp(9px, 3.4cqw, 16px)",
                color: NAVY,
                fontWeight: 900,
              }}
            >
              FLYER GOLD
            </div>
            <div
              className="font-display italic"
              style={{
                fontSize: "clamp(6px, 2.4cqw, 11px)",
                color: NAVY,
                fontWeight: 800,
              }}
            >
              CARD IN EVERY PACK!
            </div>
          </div>
          {/* Mini ball */}
          <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden>
            <circle cx="12" cy="12" r="10" fill={ORANGE} stroke={NAVY} strokeWidth="1.4" />
            <path d="M 2 12 H 22 M 12 2 V 22" stroke={NAVY} strokeWidth="1.4" fill="none" />
            <path d="M 5 5 Q 12 12 5 19" stroke={NAVY} strokeWidth="1.4" fill="none" />
            <path d="M 19 5 Q 12 12 19 19" stroke={NAVY} strokeWidth="1.4" fill="none" />
          </svg>
        </div>
      </div>

      <SerratedEdge position="bottom" />
    </div>
  );
};

export default SealedPackCardToppsStyle;
