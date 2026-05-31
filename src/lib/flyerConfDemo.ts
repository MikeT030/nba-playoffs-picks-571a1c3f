import { useCallback, useEffect, useState } from "react";

/**
 * Browser-only demo state for the Conference Finals "last unique card" reveal.
 * One winner, one card (Rex Chapman). Does NOT touch the database.
 */

const WINNER_KEY = "demo.confFinalsWinner";
const BURNED_KEY = "demo.confFinalsBurned";
const EVENT = "demo-conf-flyer-change";

export interface ConfDemoWinner {
  user_id: string;
  name: string;
}

const emit = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
};

export const getConfDemoWinner = (): ConfDemoWinner | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WINNER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setConfDemoWinner = (winner: ConfDemoWinner | null) => {
  if (!winner) {
    window.localStorage.removeItem(WINNER_KEY);
  } else {
    window.localStorage.setItem(WINNER_KEY, JSON.stringify(winner));
  }
  window.localStorage.removeItem(BURNED_KEY);
  emit();
};

export const isConfDemoBurned = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(BURNED_KEY) === "1";
};

export const markConfDemoBurned = () => {
  window.localStorage.setItem(BURNED_KEY, "1");
  emit();
};

export const clearConfDemo = () => {
  window.localStorage.removeItem(WINNER_KEY);
  window.localStorage.removeItem(BURNED_KEY);
  emit();
};

export const useConfDemoState = () => {
  const [winner, setWinnerState] = useState<ConfDemoWinner | null>(() => getConfDemoWinner());
  const [burned, setBurnedState] = useState<boolean>(() => isConfDemoBurned());

  const refresh = useCallback(() => {
    setWinnerState(getConfDemoWinner());
    setBurnedState(isConfDemoBurned());
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

  return { winner, burned, refresh };
};
