import { useState, useEffect, useRef, useCallback } from "react";
import PlayerCard from "@/components/PlayerCard";
import { playerCards, type PlayerCardData } from "@/data/playerCards";

interface CardRouletteOverlayProps {
  targetCardId: string;
  onDismiss: () => void;
}

const CardRouletteOverlay = ({ targetCardId, onDismiss }: CardRouletteOverlayProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"spinning" | "slowing" | "stopped">("spinning");
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetIndex = playerCards.findIndex((c) => c.id === targetCardId);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Phase 1: Fast spin (60ms) for ~2 seconds
    let tick = 0;
    const totalFastTicks = 30;
    const totalSlowTicks = 12;
    let speed = 60;

    const spinOnce = () => {
      tick++;
      setCurrentIndex((prev) => (prev + 1) % playerCards.length);

      if (tick < totalFastTicks) {
        // Fast phase
        intervalRef.current = setTimeout(spinOnce, speed);
      } else if (tick < totalFastTicks + totalSlowTicks) {
        // Slowing phase - increase delay each tick
        setPhase("slowing");
        const slowTick = tick - totalFastTicks;
        const delay = 100 + slowTick * 60 + slowTick * slowTick * 8;
        intervalRef.current = setTimeout(spinOnce, delay);
      } else {
        // Land on target
        setCurrentIndex(targetIndex >= 0 ? targetIndex : 0);
        setPhase("stopped");
      }
    };

    intervalRef.current = setTimeout(spinOnce, speed);

    return clearTimer;
  }, [targetIndex, clearTimer]);

  const currentCard = playerCards[currentIndex];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
      {/* Title */}
      <div className="mb-6 text-center">
        <h2 className="font-display text-2xl tracking-wider text-white">
          {phase === "stopped" ? "YOUR CARD" : "FINDING YOUR CARD..."}
        </h2>
      </div>

      {/* Card display */}
      <div className="relative w-[322px]">
        <div
          className={`transition-all ${
            phase === "stopped"
              ? "duration-500 scale-105"
              : phase === "slowing"
                ? "duration-200"
                : "duration-75"
          }`}
        >
          <PlayerCard
            player={currentCard}
            selected={phase === "stopped"}
            className={phase === "stopped" ? "!opacity-100" : "!opacity-90"}
          />
        </div>
      </div>

      {/* Dismiss button */}
      {phase === "stopped" && (
        <button
          onClick={onDismiss}
          className="mt-8 px-8 py-3 rounded-full font-display text-lg tracking-wider bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20 transition-all duration-200 animate-fade-in"
        >
          Dang, bro
        </button>
      )}
    </div>
  );
};

export default CardRouletteOverlay;
