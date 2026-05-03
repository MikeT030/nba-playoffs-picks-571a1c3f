import { useEffect, useState, useCallback } from "react";

export const FLYER_CARD_IDS = ["chapman", "paxson", "miller", "davis"] as const;
export type FlyerCardId = (typeof FLYER_CARD_IDS)[number];

export interface DemoWinner {
  user_id: string;
  name: string;
  cardId: FlyerCardId;
}

const WINNERS_KEY = "demo.flyerWinners";
const burnKey = (cardId: string) => `demo.flyerBurned.${cardId}`;
const EVENT = "demo-flyer-change";

const emit = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
};

export const getDemoWinners = (): DemoWinner[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WINNERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const setDemoWinners = (winners: DemoWinner[]) => {
  window.localStorage.setItem(WINNERS_KEY, JSON.stringify(winners));
  // Reset burn states when winners change
  for (const id of FLYER_CARD_IDS) {
    window.localStorage.removeItem(burnKey(id));
  }
  emit();
};

export const clearDemo = () => {
  window.localStorage.removeItem(WINNERS_KEY);
  for (const id of FLYER_CARD_IDS) {
    window.localStorage.removeItem(burnKey(id));
  }
  emit();
};

export const isDemoCardBurned = (cardId: string): boolean => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(burnKey(cardId)) === "1";
};

export const markDemoCardBurned = (cardId: string) => {
  window.localStorage.setItem(burnKey(cardId), "1");
  emit();
};

export const useDemoFlyerState = () => {
  const [winners, setWinnersState] = useState<DemoWinner[]>(() => getDemoWinners());
  const [burned, setBurnedState] = useState<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    for (const id of FLYER_CARD_IDS) out[id] = isDemoCardBurned(id);
    return out;
  });

  const refresh = useCallback(() => {
    setWinnersState(getDemoWinners());
    const out: Record<string, boolean> = {};
    for (const id of FLYER_CARD_IDS) out[id] = isDemoCardBurned(id);
    setBurnedState(out);
  }, []);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, [refresh]);

  return { winners, burned, refresh };
};
