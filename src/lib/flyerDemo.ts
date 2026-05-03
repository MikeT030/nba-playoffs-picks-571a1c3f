import { useEffect, useState, useCallback } from "react";

export const FLYER_CARD_IDS = ["chapman", "paxson", "miller", "davis"] as const;
export type FlyerCardId = (typeof FLYER_CARD_IDS)[number];

export interface DemoWinner {
  user_id: string;
  name: string;
  /** Pre-assigned card (kept for back-compat). Receiver mode now uses free-choice claims instead. */
  cardId: FlyerCardId;
}

const WINNERS_KEY = "demo.flyerWinners";
const CLAIMS_KEY = "demo.flyerClaims"; // { [cardId]: user_id }
const burnKey = (cardId: string) => `demo.flyerBurned.${cardId}`;
const EVENT = "demo-flyer-change";

const emit = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
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
  window.localStorage.removeItem(CLAIMS_KEY);
  for (const id of FLYER_CARD_IDS) window.localStorage.removeItem(burnKey(id));
  emit();
};

export const clearDemo = () => {
  window.localStorage.removeItem(WINNERS_KEY);
  window.localStorage.removeItem(CLAIMS_KEY);
  for (const id of FLYER_CARD_IDS) window.localStorage.removeItem(burnKey(id));
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

export const getDemoClaims = (): Partial<Record<FlyerCardId, string>> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CLAIMS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) ?? {};
  } catch {
    return {};
  }
};

/**
 * Try to claim a card for a user (first-come, first-served).
 * Returns true if the claim succeeded, false otherwise (card already claimed,
 * or this user has already claimed another card).
 */
export const claimDemoCard = (cardId: FlyerCardId, userId: string): boolean => {
  const claims = getDemoClaims();
  if (claims[cardId]) return false;
  if (Object.values(claims).includes(userId)) return false;
  claims[cardId] = userId;
  window.localStorage.setItem(CLAIMS_KEY, JSON.stringify(claims));
  emit();
  return true;
};

export const unclaimDemoCard = (userId: string) => {
  const claims = getDemoClaims();
  let changed = false;
  for (const id of FLYER_CARD_IDS) {
    if (claims[id] === userId) {
      delete claims[id];
      changed = true;
    }
  }
  if (changed) {
    window.localStorage.setItem(CLAIMS_KEY, JSON.stringify(claims));
    emit();
  }
};

export const getCardForUser = (userId: string): FlyerCardId | null => {
  const claims = getDemoClaims();
  for (const id of FLYER_CARD_IDS) {
    if (claims[id] === userId) return id;
  }
  return null;
};

export const useDemoFlyerState = () => {
  const [winners, setWinnersState] = useState<DemoWinner[]>(() => getDemoWinners());
  const [burned, setBurnedState] = useState<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    for (const id of FLYER_CARD_IDS) out[id] = isDemoCardBurned(id);
    return out;
  });
  const [claims, setClaimsState] = useState<Partial<Record<FlyerCardId, string>>>(() => getDemoClaims());

  const refresh = useCallback(() => {
    setWinnersState(getDemoWinners());
    const out: Record<string, boolean> = {};
    for (const id of FLYER_CARD_IDS) out[id] = isDemoCardBurned(id);
    setBurnedState(out);
    setClaimsState(getDemoClaims());
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

  return { winners, burned, claims, refresh };
};
