import westbrookImg from "@/assets/westbrook.jpeg";

interface PlayerCardProps {
  className?: string;
}

const PlayerCard = ({ className = "" }: PlayerCardProps) => {
  return (
    <div className={`relative w-full max-w-[280px] mx-auto ${className}`}>
      {/* Card outer frame — double border like Topps Now */}
      <div className="relative rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,100,255,0.3)]">
        {/* Red outer border */}
        <div className="p-[6px] bg-gradient-to-br from-red-600 via-red-700 to-red-800">
          {/* Blue inner border */}
          <div className="p-[4px] bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-sm">
            {/* Card content */}
            <div className="relative bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#0a1628] rounded-sm overflow-hidden">
              
              {/* Swirl/energy lines background effect */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(200,40,40,0.4)_0%,transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(30,60,180,0.4)_0%,transparent_60%)]" />
                {/* Curved lines */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 280 400" preserveAspectRatio="none">
                  {[...Array(8)].map((_, i) => (
                    <path
                      key={i}
                      d={`M ${280 + i * 15} ${400 - i * 20} Q ${140 - i * 10} ${300 - i * 15} ${-20 + i * 10} ${200 - i * 25}`}
                      stroke={i % 2 === 0 ? "rgba(200,40,40,0.3)" : "rgba(40,80,200,0.25)"}
                      strokeWidth="1"
                      fill="none"
                    />
                  ))}
                </svg>
              </div>

              {/* Top badge area */}
              <div className="relative px-3 pt-3 pb-1 flex items-start justify-between">
                <div className="bg-[#1a2744]/80 px-2 py-0.5 rounded text-[9px] font-display tracking-wider text-white/70 border border-white/10">
                  BUST NOW™
                </div>
              </div>

              {/* Player image */}
              <div className="relative px-4 flex justify-center">
                <img
                  src={westbrookImg}
                  alt="Russell Westbrook"
                  className="w-full h-[200px] object-cover object-top rounded-sm"
                />
                {/* Overlay gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent" />
              </div>

              {/* Stats overlay on image */}
              <div className="relative -mt-16 px-4 z-10">
                <div className="text-center">
                  <span className="font-display text-4xl tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    1
                  </span>
                  <span className="font-display text-lg tracking-tight text-white/80 ml-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    PT
                  </span>
                </div>
                <p className="text-center font-display text-[10px] tracking-[0.2em] text-amber-400/90 mt-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                  0/7 FG &bull; 0/4 3PT &bull; 19 MIN
                </p>
                <p className="text-center font-display text-[9px] tracking-[0.15em] text-white/60 mt-0.5">
                  CAREER LOWLIGHT
                </p>
              </div>

              {/* Player name area */}
              <div className="relative px-4 pt-3 pb-2">
                {/* Script-style first name */}
                <p className="font-body italic text-red-500 text-xl leading-none -mb-0.5 drop-shadow-[0_1px_6px_rgba(220,40,40,0.4)]">
                  Russell
                </p>
                {/* Bold last name */}
                <h3 className="font-display text-3xl tracking-wider text-white uppercase leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                  WESTBROOK
                </h3>
              </div>

              {/* Bottom bar */}
              <div className="relative flex justify-between items-end px-3 pb-3">
                <div className="bg-blue-800/60 border border-blue-500/30 rounded px-2 py-0.5">
                  <span className="font-display text-[9px] tracking-wider text-white/80">APR 26</span>
                </div>
                <div className="bg-blue-800/60 border border-blue-500/30 rounded px-2 py-0.5">
                  <span className="font-display text-[9px] tracking-wider text-white/80">2024</span>
                </div>
              </div>

              {/* Game context */}
              <div className="bg-[#0d1833]/80 border-t border-blue-900/40 px-3 py-2 text-center">
                <p className="font-body text-[8px] tracking-wider text-white/40 uppercase">
                  Western Conf First Round G3 &bull; LAC @ DAL
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
