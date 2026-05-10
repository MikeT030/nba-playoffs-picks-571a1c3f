import { useEffect, useState } from "react";

type Listener = () => void;

const store = new Map<string, string>();
const listeners = new Set<Listener>();

export function recapKey(
  awayAbbr: string,
  homeAbbr: string,
  gameNumber?: number,
): string {
  return `${awayAbbr}-${homeAbbr}-G${gameNumber ?? "x"}`;
}

export function setDemoRecap(key: string, summary: string) {
  store.set(key, summary);
  listeners.forEach((l) => l());
}

export function getDemoRecap(key: string): string | undefined {
  return store.get(key);
}

export function useDemoRecap(key: string): string | undefined {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return store.get(key);
}
