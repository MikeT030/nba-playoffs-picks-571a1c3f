import { useMemo } from "react";

interface Props {
  count?: number;
  durationMs?: number;
}

/**
 * Golden glitter that falls from the top once.
 * Pure CSS, GPU-friendly, pointer-events-none overlay.
 */
const GoldenGlitter = ({ count = 60, durationMs = 3500 }: Props) => {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 800;
        const duration = durationMs * (0.7 + Math.random() * 0.6);
        const size = 4 + Math.random() * 6;
        const drift = (Math.random() - 0.5) * 80;
        const rotate = Math.random() * 720 - 360;
        const colors = ["#FFD700", "#FFC832", "#FFE066", "#E6B800", "#FFEFA1"];
        const color = colors[i % colors.length];
        const shape = Math.random() > 0.5 ? "50%" : "1px";
        return { left, delay, duration, size, drift, rotate, color, shape, i };
      }),
    [count, durationMs]
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
    >
      {pieces.map((p) => (
        <span
          key={p.i}
          style={{
            position: "absolute",
            top: "-20px",
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.6}px`,
            background: `linear-gradient(180deg, ${p.color}, #FFF6C7)`,
            borderRadius: p.shape,
            boxShadow: `0 0 6px ${p.color}, 0 0 12px ${p.color}55`,
            opacity: 0,
            animation: `glitterFall ${p.duration}ms cubic-bezier(0.4, 0.05, 0.6, 1) ${p.delay}ms forwards`,
            ["--drift" as any]: `${p.drift}px`,
            ["--rotate" as any]: `${p.rotate}deg`,
            willChange: "transform, opacity",
          }}
        />
      ))}
      <style>{`
        @keyframes glitterFall {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          85% { opacity: 1; }
          100% {
            transform: translate3d(var(--drift), 105vh, 0) rotate(var(--rotate));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default GoldenGlitter;
