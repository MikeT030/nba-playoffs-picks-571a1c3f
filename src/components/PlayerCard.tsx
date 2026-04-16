import westbrookImg from "@/assets/westbrook.jpeg";
import ewingImg from "@/assets/ewing.png";
import millerImg from "@/assets/miller.png";
import type { PlayerCardData } from "@/data/playerCards";

const images: Record<string, string> = {
  westbrook: westbrookImg,
  ewing: ewingImg,
  miller: millerImg,
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
      className={`relative w-full max-w-[280px] mx-auto block text-left transition-all duration-200 ${
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
              <div className="relative px-3 pt-3 pb-1 flex items-start justify-between">
                <div className="bg-[#1a2744]/80 px-2 py-0.5 rounded text-[9px] font-display tracking-wider text-white/70 border border-white/10">
                  BUST NOW™
                </div>
              </div>

              {/* Player image */}
              <div className="relative px-4 flex justify-center">
                <img
                  src={img}
                  alt={`${player.firstName} ${player.lastName}`}
                  className="w-full h-[200px] object-cover object-top rounded-sm"
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
              <div className="relative px-4 pt-3 pb-2">
                <p className={`font-body italic ${player.nameColor} text-xl leading-none -mb-0.5 drop-shadow-[0_1px_6px_rgba(220,40,40,0.4)]`}>
                  {player.firstName}
                </p>
                <h3 className="font-display text-3xl tracking-wider text-white uppercase leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                  {player.lastName}
                </h3>
              </div>

              {/* Bottom bar */}
              <div className="relative flex justify-between items-end px-3 pb-3">
                <div className="bg-blue-800/60 border border-blue-500/30 rounded px-2 py-0.5">
                  <span className="font-display text-[9px] tracking-wider text-white/80">{player.date}</span>
                </div>
                <div className="bg-blue-800/60 border border-blue-500/30 rounded px-2 py-0.5">
                  <span className="font-display text-[9px] tracking-wider text-white/80">{player.year}</span>
                </div>
              </div>

              {/* Game context */}
              <div className="bg-[#0d1833]/80 border-t border-blue-900/40 px-3 py-2 text-center">
                <p className="font-body text-[8px] tracking-wider text-white/40 uppercase">
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
