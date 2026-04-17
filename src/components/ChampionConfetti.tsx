import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface ChampionConfettiProps {
  active: boolean;
}

const ChampionConfetti = ({ active }: ChampionConfettiProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasFiredRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    const el = containerRef.current;
    if (!el) return;

    hasFiredRef.current = false;

    const checkPosition = () => {
      if (hasFiredRef.current) return;
      const rect = el.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      // Fire when the top of the card is at or above the viewport center
      if (rect.top <= viewportCenter && rect.top > -rect.height) {
        hasFiredRef.current = true;
        fireConfetti(el);
        window.removeEventListener("scroll", checkPosition);
      }
    };

    // Check immediately in case it's already in position
    checkPosition();
    window.addEventListener("scroll", checkPosition, { passive: true });
    return () => window.removeEventListener("scroll", checkPosition);
  }, [active]);

  const fireConfetti = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const originX = (rect.left + rect.width / 2) / window.innerWidth;
    const originY = Math.max(rect.top / window.innerHeight, 0.05);

    const defaults = {
      origin: { x: originX, y: originY },
      colors: ["#fbbf24", "#3b82f6", "#ffffff", "#f59e0b"],
      gravity: 0.8,
      scalar: 0.9,
      ticks: 200,
      zIndex: 9999,
    };

    confetti({ ...defaults, particleCount: 80, spread: 70, startVelocity: 35 });
    setTimeout(() => {
      confetti({ ...defaults, particleCount: 50, spread: 100, startVelocity: 25, angle: 60 });
      confetti({ ...defaults, particleCount: 50, spread: 100, startVelocity: 25, angle: 120 });
    }, 200);
  };

  return <div ref={containerRef} className="absolute inset-x-0 top-0 h-1 pointer-events-none" aria-hidden />;
};

export default ChampionConfetti;
