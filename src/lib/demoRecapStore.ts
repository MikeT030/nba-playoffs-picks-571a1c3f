import { useEffect, useState } from "react";

type Listener = () => void;

const STORAGE_KEY = "demoRecapStore.v2";

const store = new Map<string, string>();
const listeners = new Set<Listener>();

// Hydrate from localStorage on module load.
try {
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const obj = JSON.parse(raw) as Record<string, string>;
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "string") store.set(k, v);
      }
    }
  }
} catch {
  /* ignore corrupt storage */
}

function persist() {
  try {
    if (typeof window === "undefined") return;
    const obj: Record<string, string> = {};
    store.forEach((v, k) => {
      obj[k] = v;
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    /* quota or unavailable — silently ignore */
  }
}

export function recapKey(seriesId: string, gameNumber?: number): string {
  return `${seriesId}::G${gameNumber ?? "x"}`;
}

export function setDemoRecap(key: string, summary: string) {
  store.set(key, summary);
  persist();
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
