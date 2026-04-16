import { useState, useEffect } from "react";

const TARGET = new Date("2026-04-18T17:00:00Z"); // 19:00 CET = 17:00 UTC

const CountdownTimer = () => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, TARGET.getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (diff <= 0) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-2 mb-6">
      {/* Scoreboard housing */}
      <div className="relative rounded-lg border-2 border-primary/30 bg-[#0a0a0a] px-5 py-4 shadow-[inset_0_0_30px_rgba(0,0,0,0.8),0_0_20px_hsl(var(--primary)/0.15)]">
        {/* Wire mesh overlay effect */}
        <div
          className="absolute inset-0 rounded-lg opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(0deg, transparent 49%, #fff 49%, #fff 51%, transparent 51%), linear-gradient(90deg, transparent 49%, #fff 49%, #fff 51%, transparent 51%)",
            backgroundSize: "6px 6px",
          }}
        />

        {/* Main clock display */}
        <div className="relative flex items-center justify-center gap-1">
          {[
            { val: days, label: "DAYS" },
            { val: hours, label: "HRS" },
            { val: minutes, label: "MIN" },
            { val: seconds, label: "SEC" },
          ].map(({ val, label }, i) => (
            <div key={label} className="flex items-center">
              {/* Separator colon */}
              {i > 0 && (
                <span className="font-digital text-2xl md:text-3xl text-amber-400 mx-1 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-pulse">
                  :
                </span>
              )}
              <div className="flex flex-col items-center">
                {/* LED-style digit panel */}
                <div className="bg-[#111] rounded border border-[#2a2a2a] px-2 py-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]">
                  <span className="font-digital text-3xl md:text-4xl text-amber-400 tracking-widest tabular-nums drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]"
                    style={{ textShadow: "0 0 10px rgba(251,191,36,0.6), 0 0 20px rgba(251,191,36,0.3)" }}
                  >
                    {pad(val)}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-[#888] tracking-[0.2em] mt-1 uppercase">
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
