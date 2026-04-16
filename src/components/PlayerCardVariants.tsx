import flairBustsLogo from "@/assets/flair-busts-logo.png";
import bsimmonsImg from "@/assets/bsimmons.png";
import type { PlayerCardData } from "@/data/playerCards";

interface VariantProps {
  player: PlayerCardData;
  variant: 1 | 2 | 3;
}

const img = bsimmonsImg;

const SharedTop = ({ player }: { player: PlayerCardData }) => (
  <>
    {/* Background swirls */}
    <div className="absolute inset-0 opacity-30">
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at bottom right, ${player.swirlPrimary} 0%, transparent 60%)` }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at top left, ${player.swirlSecondary} 0%, transparent 60%)` }} />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 280 400" preserveAspectRatio="none">
        {[...Array(8)].map((_, i) => (
          <path key={i} d={`M ${280 + i * 15} ${400 - i * 20} Q ${140 - i * 10} ${300 - i * 15} ${-20 + i * 10} ${200 - i * 25}`} stroke={i % 2 === 0 ? player.swirlPrimary.replace("0.4", "0.3") : player.swirlSecondary.replace("0.4", "0.25")} strokeWidth="1" fill="none" />
        ))}
      </svg>
    </div>

    {/* Top badge */}
    <div className="relative px-3 pt-3 pb-0 flex items-start justify-between z-20">
      <img src={flairBustsLogo} alt="Flair Busts" className="h-10 w-auto drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] mb-[-14px]" />
    </div>

    {/* Player image */}
    <div className="relative px-4 flex justify-center">
      <img src={img} alt={`${player.firstName} ${player.lastName}`} className="w-full h-[200px] object-cover object-top rounded-sm" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent" />
    </div>

    {/* Stats overlay */}
    <div className="relative -mt-16 px-4 z-10">
      <div className="text-center">
        <span className="font-display text-4xl tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{player.stat}</span>
        <span className="font-display text-lg tracking-tight text-white/80 ml-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{player.statLabel}</span>
      </div>
      <p className="text-center font-display text-[10px] tracking-[0.2em] text-amber-400/90 mt-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">{player.statLine}</p>
      <p className="text-center font-display text-[9px] tracking-[0.15em] text-white/60 mt-0.5">{player.subtitle}</p>
    </div>
  </>
);

/** V1: Game context as a bold banner integrated below the name */
const Variant1 = ({ player }: { player: PlayerCardData }) => (
  <div className="relative w-full max-w-[280px] mx-auto block text-left">
    <div className="relative rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,100,255,0.3)]">
      <div className={`p-[6px] bg-gradient-to-br ${player.accentPrimary}`}>
        <div className={`p-[4px] bg-gradient-to-br ${player.accentSecondary} rounded-sm`}>
          <div className="relative bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#0a1628] rounded-sm overflow-hidden">
            <SharedTop player={player} />
            {/* Player name + context inline */}
            <div className="relative px-4 pt-3 pb-3">
              <p className={`font-body italic ${player.nameColor} text-xl leading-none -mb-0.5 drop-shadow-[0_1px_6px_rgba(220,40,40,0.4)]`}>{player.firstName}</p>
              <h3 className="font-display text-3xl tracking-wider text-white uppercase leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">{player.lastName}</h3>
              <p className="font-display text-[10px] tracking-[0.15em] text-amber-400/80 mt-1.5 leading-tight uppercase">
                {player.gameContext}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <p className="text-center text-[10px] text-muted-foreground mt-2 font-body">Version A — Below name, gold accent</p>
  </div>
);

/** V2: Game context as a side badge rotated vertically next to the name */
const Variant2 = ({ player }: { player: PlayerCardData }) => (
  <div className="relative w-full max-w-[280px] mx-auto block text-left">
    <div className="relative rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,100,255,0.3)]">
      <div className={`p-[6px] bg-gradient-to-br ${player.accentPrimary}`}>
        <div className={`p-[4px] bg-gradient-to-br ${player.accentSecondary} rounded-sm`}>
          <div className="relative bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#0a1628] rounded-sm overflow-hidden">
            <SharedTop player={player} />
            {/* Player name with context on the right side */}
            <div className="relative px-4 pt-3 pb-3 flex items-end gap-2">
              <div className="flex-1">
                <p className={`font-body italic ${player.nameColor} text-xl leading-none -mb-0.5 drop-shadow-[0_1px_6px_rgba(220,40,40,0.4)]`}>{player.firstName}</p>
                <h3 className="font-display text-3xl tracking-wider text-white uppercase leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">{player.lastName}</h3>
              </div>
              <div className="flex-shrink-0 self-stretch flex items-center">
                <div className="writing-vertical-lr rotate-180 font-display text-[8px] tracking-[0.2em] text-white/60 uppercase leading-none"
                  style={{ writingMode: "vertical-lr" }}>
                  {player.gameContext}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <p className="text-center text-[10px] text-muted-foreground mt-2 font-body">Version B — Vertical text beside name</p>
  </div>
);

/** V3: Game context as a gradient ribbon between name and card bottom */
const Variant3 = ({ player }: { player: PlayerCardData }) => (
  <div className="relative w-full max-w-[280px] mx-auto block text-left">
    <div className="relative rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,100,255,0.3)]">
      <div className={`p-[6px] bg-gradient-to-br ${player.accentPrimary}`}>
        <div className={`p-[4px] bg-gradient-to-br ${player.accentSecondary} rounded-sm`}>
          <div className="relative bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#0a1628] rounded-sm overflow-hidden">
            <SharedTop player={player} />
            {/* Player name */}
            <div className="relative px-4 pt-3 pb-1">
              <p className={`font-body italic ${player.nameColor} text-xl leading-none -mb-0.5 drop-shadow-[0_1px_6px_rgba(220,40,40,0.4)]`}>{player.firstName}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="font-display text-3xl tracking-wider text-white uppercase leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">{player.lastName}</h3>
              </div>
            </div>
            {/* Gradient ribbon with game context */}
            <div className={`relative mx-3 mb-3 rounded px-3 py-1.5 bg-gradient-to-r ${player.accentPrimary}`}>
              <p className="font-display text-[9px] tracking-[0.15em] text-white/90 uppercase text-center leading-tight">
                {player.gameContext}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <p className="text-center text-[10px] text-muted-foreground mt-2 font-body">Version C — Gradient ribbon banner</p>
  </div>
);

const PlayerCardVariants = ({ player }: { player: PlayerCardData }) => (
  <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
    <div className="snap-center shrink-0"><Variant1 player={player} /></div>
    <div className="snap-center shrink-0"><Variant2 player={player} /></div>
    <div className="snap-center shrink-0"><Variant3 player={player} /></div>
  </div>
);

export default PlayerCardVariants;
