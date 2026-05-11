import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Listener = () => void;

const STORAGE_KEY = "demoRecapStore.v2";

const store = new Map<string, string>();
const listeners = new Set<Listener>();
const hydrated = new Set<string>();

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

export interface RecapServerKey {
  seriesId: string;
  gameNumber?: number;
  source?: string;
}

/** Fetch the recap from the backend and update the local cache if found. */
export async function hydrateRecapFromServer(
  key: string,
  { seriesId, gameNumber, source = "demo" }: RecapServerKey,
): Promise<void> {
  if (gameNumber == null) return;
  try {
    const { data, error } = await supabase
      .from("demo_game_recaps")
      .select("summary")
      .eq("series_id", seriesId)
      .eq("game_number", gameNumber)
      .eq("source", source)
      .maybeSingle();
    if (error) return;
    if (data?.summary && data.summary !== store.get(key)) {
      store.set(key, data.summary);
      persist();
      listeners.forEach((l) => l());
    }
  } catch {
    /* network/Cloud outage — keep cached value */
  }
}

/** Upsert the recap to the backend. Mirrors to local cache on success. */
export async function saveDemoRecapRemote(
  key: string,
  payload: { seriesId: string; gameNumber: number; source?: string; summary: string },
): Promise<{ ok: boolean; error?: string }> {
  const { seriesId, gameNumber, source = "demo", summary } = payload;
  try {
    const { data: userData } = await supabase.auth.getUser();
    const created_by = userData.user?.id ?? null;
    const { error } = await supabase.from("demo_game_recaps").upsert(
      {
        series_id: seriesId,
        game_number: gameNumber,
        source,
        summary,
        created_by,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "series_id,game_number,source" },
    );
    if (error) return { ok: false, error: error.message };
    // Mirror to local
    store.set(key, summary);
    persist();
    listeners.forEach((l) => l());
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export function useDemoRecap(key: string, opts?: RecapServerKey): string | undefined {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  // Background hydrate once per key.
  useEffect(() => {
    if (!opts || opts.gameNumber == null) return;
    if (hydrated.has(key)) return;
    hydrated.add(key);
    hydrateRecapFromServer(key, opts);
  }, [key, opts?.seriesId, opts?.gameNumber, opts?.source]);

  return store.get(key);
}
