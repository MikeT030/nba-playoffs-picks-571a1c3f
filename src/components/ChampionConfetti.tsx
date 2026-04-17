import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface ChampionConfettiProps {
  active: boolean;
}

const ChampionConfetti = ({ active }: ChampionConfettiProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasFiredRef = useRef(false);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const el = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Fire when the top of the card reaches the top of the viewport
          if (entry.boundingClientRect.top <= 8 && !hasFiredRef.current) {
            hasFiredRef.current = true;
            fireConfetti(el);
          }
        });
      },
      { threshold: [0, 0.01, 0.1, 0.25, 0.5, 1], rootMargin: "0px 0px -100% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [active]);

  const fireConfetti = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const originX = (rect.left + rect.width / 2) / window.innerWidth;
    const originY = rect.top / window.innerHeight;

    const defaults = {
      origin: { x: originX, y: Math.max(originY, 0.05) },
      colors: ["#fbbf24", "#3b82f6", "#ffffff", "#f59e0b"],
      gravity: 0.8,
      scalar: 0.9,
      ticks: 200,
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
