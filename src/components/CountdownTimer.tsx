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
    <div className="flex items-center justify-center gap-3 mb-6">
      {[
        { val: days, label: "DAYS" },
        { val: hours, label: "HRS" },
        { val: minutes, label: "MIN" },
        { val: seconds, label: "SEC" },
      ].map(({ val, label }) => (
        <div key={label} className="flex flex-col items-center">
          <span className="font-digital text-3xl md:text-4xl text-neon tracking-widest tabular-nums drop-shadow-[0_0_8px_hsl(var(--neon))]">
            {pad(val)}
          </span>
          <span className="text-[10px] font-body text-muted-foreground tracking-wider">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CountdownTimer;
