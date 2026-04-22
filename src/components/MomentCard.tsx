import flairBustsLogo from "@/assets/flyer-busts-logo.png";
import { momentImages } from "@/lib/momentImages";
import type { MomentCardData } from "@/data/momentCards";

interface MomentCardProps {
  moment: MomentCardData;
  className?: string;
}

const MomentCard = ({ moment, className = "" }: MomentCardProps) => {
  const img = momentImages[moment.image];

  return (
    <div className={`relative w-full max-w-[444px] mx-auto ${className}`}>
      <div className="relative rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,100,255,0.3)]">
        {/* Outer border */}
        <div className={`p-[6px] bg-gradient-to-br ${moment.accentPrimary}`}>
          {/* Inner border */}
          <div className={`p-[4px] bg-gradient-to-br ${moment.accentSecondary} rounded-sm`}>
            {/* Card content */}
            <div className="relative bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#0a1628] rounded-sm overflow-hidden">

              {/* Top badge */}
              <div className="relative px-3 pt-3 pb-0 flex items-center justify-center z-20">
                <div className="flex items-center gap-1">
                  <img
                    src={flairBustsLogo}
                    alt="Flyer"
                    className="h-12 w-auto drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
                  />
                  <span className="font-display text-2xl tracking-wider text-white italic drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                    {moment.badgeLabel}
                  </span>
                </div>
              </div>

              {/* Hero image with vertical name overlay */}
              <div className="relative mx-3 mt-2 rounded overflow-hidden">
                <img
                  src={img}
                  alt={`${moment.firstName} ${moment.lastName}`}
                  className="w-full h-[260px] object-cover object-center"
                />
                {/* Subtle vignette for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/10 pointer-events-none" />

                {/* Vertical player name (rotated -90deg, reads bottom-to-top) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex items-center gap-2" style={{ transform: "rotate(-90deg)" }}>
                    <span
                      className={`font-body italic text-3xl leading-none ${moment.nameColor} drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]`}
                    >
                      {moment.firstName}
                    </span>
                    <span className="font-display text-5xl tracking-wider text-white uppercase leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                      {moment.lastName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Narrative description */}
              <div className="relative px-4 pt-4 pb-2">
                <p className="font-body text-sm text-white/90 leading-relaxed">
                  {moment.description}
                </p>
              </div>

              {/* Game context ribbon */}
              <div className="relative mx-3 mb-3 mt-2 rounded px-3 py-2">
                <p className="font-body text-xs text-white/80 leading-snug">
                  {moment.gameContext}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MomentCard;
