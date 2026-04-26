import { useState, type ReactNode } from "react";
import flyerLogo from "@/assets/flyer-the-shot.png";

interface SealedPackCardProps {
  children: ReactNode;
  /** Aspect ratio for the sealed pack. Default matches a typical flyer card. */
  aspectClass?: string;
  /** Color of the foil. Tailwind gradient stops or CSS color. */
  foilFromColor?: string;
  foilViaColor?: string;
  foilToColor?: string;
  /** Optional small label printed at the bottom of the pack. */
  label?: string;
}

/**
 * Sealed trading-card pack. Shows a foil wrapper that the user clicks
 * to "rip open" — the pack splits down the middle and the wrapped
 * card is revealed underneath.
 */
const SealedPackCard = ({
  children,
  aspectClass = "aspect-[3/4]",
  foilFromColor = "#FF5C00",
  foilViaColor = "#B23A00",
  foilToColor = "#1A1E24",
  label = "FLYER · SERIES 1 · 1 OF 1",
}: SealedPackCardProps) => {
  const [opened, setOpened] = useState(false);

  return (
    <div className={`relative w-full ${aspectClass}`}>
      {/* Card underneath — fades in on open */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          opened ? "opacity-100 delay-300" : "opacity-0 pointer-events-none"
        }`}
      >
        {children}
      </div>

      {/* Sealed pack overlay */}
      <button
        type="button"
        onClick={() => !opened && setOpened(true)}
        aria-label={opened ? "Pack opened" : "Tap to rip open the pack"}
        disabled={opened}
        className={`absolute inset-0 group ${
          opened ? "pointer-events-none" : "cursor-pointer"
        }`}
      >
        {/* Two halves of the foil. They split apart when opened. */}
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          {/* LEFT half */}
          <div
            className={`absolute inset-y-0 left-0 w-1/2 transition-all ease-[cubic-bezier(0.7,0,0.3,1)] origin-left ${
              opened
                ? "duration-[900ms] -translate-x-[120%] -rotate-[18deg] opacity-0"
                : "duration-300 group-hover:-translate-x-[2px] group-hover:-rotate-[0.5deg]"
            }`}
            style={{
              background: `linear-gradient(135deg, ${foilFromColor} 0%, ${foilViaColor} 55%, ${foilToColor} 100%)`,
              boxShadow: "inset -8px 0 18px rgba(0,0,0,0.45)",
              clipPath: "polygon(0 0, 100% 0, 96% 25%, 100% 50%, 96% 75%, 100% 100%, 0 100%)",
            }}
          >
            <PackArtwork side="left" label={label} />
          </div>

          {/* RIGHT half */}
          <div
            className={`absolute inset-y-0 right-0 w-1/2 transition-all ease-[cubic-bezier(0.7,0,0.3,1)] origin-right ${
              opened
                ? "duration-[900ms] translate-x-[120%] rotate-[18deg] opacity-0"
                : "duration-300 group-hover:translate-x-[2px] group-hover:rotate-[0.5deg]"
            }`}
            style={{
              background: `linear-gradient(225deg, ${foilFromColor} 0%, ${foilViaColor} 55%, ${foilToColor} 100%)`,
              boxShadow: "inset 8px 0 18px rgba(0,0,0,0.45)",
              clipPath: "polygon(4% 0, 100% 0, 100% 100%, 4% 100%, 0 75%, 4% 50%, 0 25%)",
            }}
          >
            <PackArtwork side="right" label={label} />
          </div>

          {/* Tear hint chevron — pulses while sealed */}
          {!opened && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
              <div className="font-display text-[10px] tracking-[0.3em] text-white/90 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 animate-pulse">
                TAP TO RIP
              </div>
            </div>
          )}

          {/* Subtle holographic shine sweeping across */}
          {!opened && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-60"
              style={{
                background:
                  "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.45) 50%, transparent 65%)",
                backgroundSize: "200% 100%",
                animation: "shine 3.5s ease-in-out infinite",
              }}
            />
          )}
        </div>

        <style>{`
          @keyframes shine {
            0%, 100% { background-position: 200% 0; }
            50% { background-position: -100% 0; }
          }
        `}</style>
      </button>
    </div>
  );
};

const PackArtwork = ({ side, label }: { side: "left" | "right"; label: string }) => {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* FLYER logo, centered across the two halves (each side shows one half) */}
      <img
        src={flyerLogo}
        alt=""
        aria-hidden
        className="absolute top-1/2 -translate-y-1/2 w-[160%] max-w-none drop-shadow-[0_4px_14px_rgba(0,0,0,0.6)] opacity-95"
        style={{
          left: side === "left" ? "0" : "auto",
          right: side === "right" ? "0" : "auto",
          transform: `translateY(-50%) ${side === "left" ? "translateX(0)" : "translateX(0)"}`,
        }}
      />

      {/* Bottom label — only meaningful on one side, but rendered on both for symmetry */}
      <div
        className={`absolute bottom-3 ${
          side === "left" ? "left-3 text-left" : "right-3 text-right"
        } font-display text-[8px] tracking-[0.25em] text-white/70`}
      >
        {side === "left" ? label.split(" · ").slice(0, 1).join(" · ") : label.split(" · ").slice(1).join(" · ")}
      </div>

      {/* Top corner stamp */}
      {side === "left" && (
        <div className="absolute top-3 left-3 font-display text-[9px] tracking-[0.25em] text-white/80">
          SEALED
        </div>
      )}
      {side === "right" && (
        <div className="absolute top-3 right-3 font-display text-[9px] tracking-[0.25em] text-white/80">
          ★ RARE
        </div>
      )}
    </div>
  );
};

export default SealedPackCard;
