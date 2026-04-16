import flairBustsLogo from "@/assets/flair-busts-logo.png";
import westbrookImg from "@/assets/westbrook.jpeg";
import ewingImg from "@/assets/ewing.png";
import millerImg from "@/assets/miller.png";
import starksImg from "@/assets/starks.png";
import lebronImg from "@/assets/lebron.png";
import pippenImg from "@/assets/pippen.png";
import kmartinImg from "@/assets/kmartin.png";
import bsimmonsImg from "@/assets/bsimmons.png";
import curryImg from "@/assets/curry.webp";
import kobeImg from "@/assets/kobe.png";
import type { PlayerCardData } from "@/data/playerCards";

const images: Record<string, string> = {
  westbrook: westbrookImg,
  ewing: ewingImg,
  miller: millerImg,
  starks: starksImg,
  lebron: lebronImg,
  pippen: pippenImg,
  kmartin: kmartinImg,
  bsimmons: bsimmonsImg,
  curry: curryImg,
  kobe: kobeImg,
};

interface PlayerCardProps {
  player: PlayerCardData;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const PlayerCard = ({ player, selected = false, onClick, className = "" }: PlayerCardProps) => {
  const img = images[player.image] || westbrookImg;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full max-w-[322px] mx-auto block text-left transition-all duration-200 ${
        selected
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg scale-[1.02]"
          : "opacity-70 hover:opacity-100 hover:scale-[1.01]"
      } ${className}`}
    >
      {/* Card outer frame */}
      <div className="relative rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,100,255,0.3)]">
        {/* Outer border */}
        <div className={`p-[6px] bg-gradient-to-br ${player.accentPrimary}`}>
          {/* Inner border */}
          <div className={`p-[4px] bg-gradient-to-br ${player.accentSecondary} rounded-sm`}>
            {/* Card content */}
            <div className="relative bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#0a1628] rounded-sm overflow-hidden">

              {/* Background swirls */}
              <div className="absolute inset-0 opacity-30">
                <div
                  className="absolute inset-0"
                  style={{ background: `radial-gradient(ellipse at bottom right, ${player.swirlPrimary} 0%, transparent 60%)` }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: `radial-gradient(ellipse at top left, ${player.swirlSecondary} 0%, transparent 60%)` }}
                />
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 280 400" preserveAspectRatio="none">
                  {[...Array(8)].map((_, i) => (
                    <path
                      key={i}
                      d={`M ${280 + i * 15} ${400 - i * 20} Q ${140 - i * 10} ${300 - i * 15} ${-20 + i * 10} ${200 - i * 25}`}
                      stroke={i % 2 === 0 ? player.swirlPrimary.replace("0.4", "0.3") : player.swirlSecondary.replace("0.4", "0.25")}
                      strokeWidth="1"
                      fill="none"
                    />
                  ))}
                </svg>
              </div>

              {/* Top badge */}
              <div className="relative px-3 pt-3 pb-0 flex items-start justify-between z-20">
                <img src={flairBustsLogo} alt="Flair Busts" className="h-10 w-auto drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] mb-[-14px]" />
              </div>

              {/* Player image */}
              <div className="relative px-4 flex justify-center">
                <img
                  src={img}
                  alt={`${player.firstName} ${player.lastName}`}
                  className="w-full h-[230px] object-cover object-top rounded-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent" />
              </div>

              {/* Stats overlay */}
              <div className="relative -mt-16 px-4 z-10">
                <div className="text-center">
                  <span className="font-display text-4xl tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    {player.stat}
                  </span>
                  <span className="font-display text-lg tracking-tight text-white/80 ml-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    {player.statLabel}
                  </span>
                </div>
                <p className="text-center font-display text-[10px] tracking-[0.2em] text-amber-400/90 mt-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                  {player.statLine}
                </p>
                <p className="text-center font-display text-[9px] tracking-[0.15em] text-white/60 mt-0.5">
                  {player.subtitle}
                </p>
              </div>

              {/* Player name */}
              <div className="relative px-4 pt-3 pb-[12px]">
                <p className={`font-body italic ${player.nameColor} text-xl leading-none -mb-0.5 drop-shadow-[0_1px_6px_rgba(220,40,40,0.4)]`}>
                  {player.firstName}
                </p>
                <h3 className="font-display text-3xl tracking-wider text-white uppercase leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                  {player.lastName}
                </h3>
              </div>

              {/* Game context ribbon */}
              <div className={`relative mx-3 mb-3 rounded px-3 py-1.5 bg-gradient-to-r ${player.accentPrimary} pb-[6px]`}>
                <p className="font-display text-[9px] tracking-[0.15em] text-white/90 uppercase text-center leading-tight font-bold">
                  {player.gameContext}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default PlayerCard;
