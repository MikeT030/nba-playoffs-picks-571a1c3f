import rexChapmanImg from "@/assets/rex-chapman.jpg";
import flyerLogo from "@/assets/flyer-the-shot.png";
import TeamLogo from "@/components/TeamLogo";
import { teamMeta } from "@/lib/nbaApi";

const DemoFlyerCard = () => {
  return (
    <div className="space-y-2">
      <h2 className="font-display text-lg tracking-wider text-muted-foreground">
        FLYER — THE SHOT
      </h2>

      <article className="relative overflow-hidden rounded-xl bg-[#1A1E24] border border-white/5 shadow-xl">
        {/* Hero image */}
        <div className="relative aspect-video w-full overflow-hidden">
          <img
            src={rexChapmanImg}
            alt="Rex Chapman launching a fading three-pointer against the Seattle SuperSonics, 1997 NBA Playoffs"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Gradient overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1E24] via-[#1A1E24]/30 to-transparent" />

          {/* FLYER logo, top-left */}
          <img
            src={flyerLogo}
            alt="FLYER The Shot logo"
            className="absolute top-3 left-3 w-24 sm:w-28 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
            loading="lazy"
          />

          {/* Matchup badge, top-right */}
          <div className="absolute top-3 right-3 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1.5 border border-white/10">
            <TeamLogo
              src={teamMeta.PHO?.logo ?? teamMeta.PHX.logo}
              alt="Phoenix Suns"
              className="w-5 h-5"
            />
            <span className="font-display text-xs tracking-wider text-white/80">
              vs
            </span>
            <TeamLogo
              src={teamMeta.SEA?.logo ?? "https://cdn.nba.com/logos/nba/1610612745/primary/L/logo.svg"}
              alt="Seattle SuperSonics"
              className="w-5 h-5"
            />
          </div>
        </div>

        {/* Body */}
        <div className="px-4 pb-4 pt-2 space-y-3">
          {/* Player name */}
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-2xl tracking-wider text-[#ededed] leading-none">
              REX CHAPMAN
            </h3>
            <span className="font-display text-xs tracking-widest text-primary">
              PHX · #5
            </span>
          </div>

          {/* Game info */}
          <div className="flex items-center gap-2 text-[11px] font-body uppercase tracking-wider text-muted-foreground">
            <span>1997 West First Round</span>
            <span className="text-white/20">•</span>
            <span>Game 4</span>
            <span className="text-white/20">•</span>
            <span className="text-[#ededed]">PHO vs SEA</span>
          </div>

          {/* Quote / story */}
          <blockquote className="relative pl-3 border-l-2 border-primary/60">
            <p className="font-body text-sm leading-relaxed text-[#ededed]/90">
              Down three with seconds left, Chapman caught a deflected pass
              while flying out of bounds and flung a one-legged, fading
              three-pointer that somehow tied the game.
            </p>
          </blockquote>
        </div>
      </article>
    </div>
  );
};

export default DemoFlyerCard;
