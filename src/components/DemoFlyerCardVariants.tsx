import rexChapmanImg from "@/assets/rex-chapman.jpg";
import johnPaxsonImg from "@/assets/john-paxson.png";
import flyerLogo from "@/assets/flyer-the-shot.png";
import seaSonicsLogo from "@/assets/sea-sonics-logo.png";
import phoenixSunsLogo from "@/assets/phoenix-suns-logo.png";
import TeamLogo from "@/components/TeamLogo";
import { teamMeta } from "@/lib/nbaApi";

const PHX_LOGO = phoenixSunsLogo;
const SEA_LOGO = seaSonicsLogo;
const CHI_LOGO = teamMeta.CHI.logo;

const QUOTE =
  "Trailing by three points with only seconds left in the fourth quarter, Chapman caught a deflected pass while flying out of bounds and launched a one-legged, fading three-pointer that somehow tied the game and took it into overtime.";

const PAXSON_QUOTE =
  "With the Bulls trailing late in Game 6, Paxson spotted up beyond the arc, caught the kick-out from Horace Grant, and calmly drained a three-pointer with 3.9 seconds left to clinch Chicago's third straight championship.";

/* ──────────────────────────────────────────────────────────────
   V2 — Polaroid / trading-card vibe
   Image with a thick light frame, logo as a sticker, story below.
   ────────────────────────────────────────────────────────────── */
export const DemoFlyerCardV2 = () => {
  return (
    <div className="space-y-2">
      <h2 className="font-display text-lg tracking-wider text-muted-foreground">
        FLYER — V2 (CARD)
      </h2>

      <article className="relative rounded-xl bg-[#ededed] text-[#1A1E24] shadow-2xl p-3 pb-4 rotate-[-1deg]">
        {/* FLYER sticker */}
        <img
          src={flyerLogo}
          alt="FLYER The Shot logo"
          className="absolute -top-4 -right-3 w-20 rotate-[8deg] drop-shadow-[0_6px_12px_rgba(0,0,0,0.4)] z-10"
          loading="lazy"
        />

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-black">
          <img
            src={rexChapmanImg}
            alt="Rex Chapman fading three-pointer, 1997 Playoffs"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Team strip on the image */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/70 px-2 py-1">
            <TeamLogo src={PHX_LOGO} alt="PHX" className="w-4 h-4" />
            <span className="font-display text-[10px] tracking-wider text-white/80">
              vs
            </span>
            <TeamLogo src={SEA_LOGO} alt="SEA" className="w-4 h-4" />
          </div>
        </div>

        <div className="pt-3 px-1 space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display text-xl tracking-wider leading-none">
              REX CHAPMAN
            </h3>
            <span className="font-display text-[10px] tracking-widest text-[#1A1E24]/60">
              PHX · #5
            </span>
          </div>
          <p className="font-body text-[11px] uppercase tracking-wider text-[#1A1E24]/60">
            1997 W. First Round · Game 4 · PHO vs SEA
          </p>
          <p className="font-body text-sm leading-snug text-[#1A1E24]/90 italic">
            “{QUOTE}”
          </p>
        </div>
      </article>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   V3 — Cinematic letterbox
   Tall hero with letterbox bars, large overlay typography.
   ────────────────────────────────────────────────────────────── */
export const DemoFlyerCardV3 = () => {
  return (
    <div className="space-y-2">
      <h2 className="font-display text-lg tracking-wider text-muted-foreground">
        FLYER — V3 (CINEMATIC)
      </h2>

      <article className="relative overflow-hidden rounded-xl bg-black border border-white/10 shadow-xl">
        <div className="relative aspect-[3/4] w-full">
          <img
            src={rexChapmanImg}
            alt="Rex Chapman fading three-pointer, 1997 Playoffs"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          {/* Letterbox + heavy gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/10 to-black/95" />

          {/* Top: matchup pill */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="rounded-l-full rounded-r-none bg-[#E4E2F1]/65 px-3 py-2 shadow-md">
                <TeamLogo src={PHX_LOGO} alt="PHX" className="w-8 h-8" />
              </div>
              <div className="rounded-r-full rounded-l-none bg-[#E4E2F1]/65 px-3 py-2 shadow-md">
                <TeamLogo src={SEA_LOGO} alt="SEA" className="w-8 h-8" />
              </div>
            </div>
            <img
              src={flyerLogo}
              alt="FLYER The Shot"
              className="w-20 drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)]"
              loading="lazy"
            />
          </div>

          {/* Bottom: large title block */}
          <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
            <p className="font-body text-[10px] uppercase tracking-[0.25em] font-bold text-primary-foreground">
              1997
              <br />
              West First Round · Game 4
            </p>
            <h3 className="font-display text-4xl leading-[0.9] tracking-wider text-[#ededed]">
              REX
              <br />
              <span className="text-primary">CHAPMAN</span>
            </h3>
            <div className="relative max-w-[34ch]">
              <div className="absolute inset-0 -inset-x-2 -inset-y-1.5 rounded-md bg-[#141129]/55" />
              <p className="relative font-body text-xs leading-relaxed text-white/80 font-medium">
                {QUOTE}
              </p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   V4 — Newspaper / box-score vibe
   Two-column layout: image left, structured stat block right.
   ────────────────────────────────────────────────────────────── */
export const DemoFlyerCardV4 = () => {
  return (
    <div className="space-y-2">
      <h2 className="font-display text-lg tracking-wider text-muted-foreground">
        FLYER — V4 (BOX SCORE)
      </h2>

      <article className="relative overflow-hidden rounded-xl bg-[#1A1E24] border border-white/10 shadow-xl">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-white/10 bg-black/30">
          <img
            src={flyerLogo}
            alt="FLYER The Shot"
            className="h-7 w-auto"
            loading="lazy"
          />
          <span className="font-display text-[10px] tracking-[0.25em] text-primary">
            ENTRY · 001
          </span>
        </div>

        {/* Body */}
        <div className="grid grid-cols-5 gap-3 p-3">
          {/* Image */}
          <div className="col-span-2 relative aspect-[3/4] overflow-hidden rounded-md bg-black">
            <img
              src={rexChapmanImg}
              alt="Rex Chapman fading three-pointer, 1997 Playoffs"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Info */}
          <div className="col-span-3 space-y-2.5">
            <div>
              <h3 className="font-display text-xl tracking-wider text-[#ededed] leading-none">
                REX CHAPMAN
              </h3>
              <p className="font-body text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                Phoenix Suns · Guard · #5
              </p>
            </div>

            {/* Matchup row */}
            <div className="flex items-center justify-between rounded-md bg-black/30 border border-white/5 px-2.5 py-2">
              <div className="flex items-center gap-1.5">
                <TeamLogo src={PHX_LOGO} alt="PHX" className="w-5 h-5" />
                <span className="font-display text-xs tracking-wider text-[#ededed]">
                  PHO
                </span>
              </div>
              <span className="font-display text-[10px] tracking-widest text-muted-foreground">
                G4
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-xs tracking-wider text-[#ededed]">
                  SEA
                </span>
                <TeamLogo src={SEA_LOGO} alt="SEA" className="w-5 h-5" />
              </div>
            </div>

            <p className="font-body text-[10px] uppercase tracking-wider text-muted-foreground">
              1997 NBA · Western First Round
            </p>

            <p className="font-body text-xs leading-snug text-[#ededed]/90">
              {QUOTE}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
};
