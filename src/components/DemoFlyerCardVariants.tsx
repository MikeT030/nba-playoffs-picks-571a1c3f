import rexChapmanImg from "@/assets/rex-chapman.png";
import johnPaxsonImg from "@/assets/john-paxson.png";
import glenDavisImg from "@/assets/glen-davis.jpg";
import mikeMillerImg from "@/assets/mike-miller.png";
import flyerLogo from "@/assets/flyer-the-shot.png";
import seaSonicsLogo from "@/assets/sea-sonics-logo.png";
import phoenixSunsLogo from "@/assets/phoenix-suns-logo.png";
import TeamLogo from "@/components/TeamLogo";
import SealedPackCard from "@/components/SealedPackCard";
import SealedPackCardToppsStyle from "@/components/SealedPackCardToppsStyle";
import { teamMeta } from "@/lib/nbaApi";

const PHX_LOGO = phoenixSunsLogo;
const SEA_LOGO = seaSonicsLogo;
const CHI_LOGO = teamMeta.CHI.logo;
const BOS_LOGO = teamMeta.BOS.logo;
const ORL_LOGO = teamMeta.ORL.logo;
const MIA_LOGO = teamMeta.MIA.logo;
const OKC_LOGO = teamMeta.OKC.logo;

const MILLER_QUOTE =
  "Miller was barely able to walk due to back injuries. He came off the bench and went 7-for-8 from three, destroying the Thunder's spirit and securing LeBron's first ring.";

const DAVIS_QUOTE =
  "With Kevin Garnett out, Glen \"Big Baby\" Davis stepped out to the perimeter and hit a walk-off jumper as time expired to beat the Magic, then proceeded to nearly tackle a small child in the front row during his celebration.";

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
        PLATINUM — V2 (CARD)
      </h2>

      <article className="relative rounded-xl bg-[#ededed] text-[#1A1E24] shadow-2xl p-3 pb-4 rotate-[-1deg]">
        {/* PLATINUM sticker */}
        <img
          src={flyerLogo}
          alt="PLATINUM The Shot logo"
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
interface StatItem {
  label: string;
  value: string | number;
}

interface FlyerCardV3Props {
  heading: string;
  image: string;
  imageAlt: string;
  awayLogo: string;
  awayAlt: string;
  homeLogo: string;
  homeAlt: string;
  era: string;
  matchup: string;
  game: string;
  firstName: string;
  lastName: string;
  quote: string;
  quoteBgColor?: string;
  borderColor?: string;
  borderWidth?: string;
  stats?: StatItem[];
  /** Wrap the card in a sealed pack that the user clicks to rip open. */
  sealed?: boolean;
  /** Pack starts already opened (skip the burn animation). */
  defaultOpened?: boolean;
  /** Hide the section heading above the card. */
  hideHeading?: boolean;
  /** Fired the first time the user taps to burn the pack. */
  onBurn?: () => void;
  sealedConfig?: {
    topBanner?: string;
    title?: string;
    yearLabel?: string;
    midLine?: string;
    tierLine?: string[];
    seriesLabel?: string;
  };
  /** Use the alternate Topps-style wax pack wrapper. */
  sealedToppsStyle?: boolean;
  sealedToppsConfig?: {
    sportLabel?: string;
    yearLabel?: string;
    seriesLabel?: string;
    picturesLabel?: string;
    qualityLabel?: string;
  };
}

const FlyerCardV3 = ({
  heading,
  image,
  imageAlt,
  awayLogo,
  awayAlt,
  homeLogo,
  homeAlt,
  era,
  matchup,
  game,
  firstName,
  lastName,
  quote,
  quoteBgColor = "hsl(var(--background) / 0.55)",
  borderColor,
  borderWidth,
  stats,
  sealed,
  defaultOpened,
  hideHeading,
  onBurn,
  sealedConfig,
  sealedToppsStyle,
  sealedToppsConfig,
}: FlyerCardV3Props) => {
  const cardArticle = (
    <article
      className="relative overflow-hidden rounded-xl bg-black border shadow-xl h-full"
      style={{
        borderColor: borderColor ?? "hsl(var(--border))",
        borderWidth: borderWidth,
      }}
    >
      <div className="relative aspect-[3/4] w-full">
        <img
          src={image}
          alt={imageAlt}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        {/* Letterbox + heavy gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/10 to-black/95" />

        {/* Vertical stat line on right edge */}
        {stats && stats.length > 0 && (
          <div className="absolute top-0 bottom-0 right-0 w-6 flex items-center justify-center pointer-events-none">
            <div
              className="flex items-center gap-3 font-display text-xs tracking-[0.25em] text-amber-400 whitespace-nowrap"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              {stats.map((s) => (
                <span key={s.label}>
                  <span className="text-amber-400/60">{s.label}</span> {s.value}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Top: PLATINUM logo only */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-start">
          <img
            src={flyerLogo}
            alt="PLATINUM The Shot"
            className="w-20 drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)]"
            loading="lazy"
          />
        </div>

        {/* Bottom: large title block */}
        <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
          <p className="font-body text-[10px] uppercase tracking-[0.25em] font-bold text-primary-foreground">
            {era}
            <br />
            {matchup}
            <br />
            {game} · {awayAlt} vs. {homeAlt}
          </p>
          <h3 className="font-display text-4xl leading-[0.9] tracking-wider text-[#ededed]">
            {firstName}
            <br />
            <span className="text-primary">{lastName}</span>
          </h3>
          <div className="relative w-[200px]">
            <div
              className="absolute inset-0 -inset-x-2 -inset-y-1.5"
              style={{ backgroundColor: quoteBgColor }}
            />
            <p className="relative font-body text-[12px] leading-relaxed text-white/80 font-medium">
              {quote}
            </p>
          </div>
        </div>
      </div>
    </article>
  );

  return (
    <div className="space-y-2">
      {!hideHeading && (
        <h2 className="font-display text-lg tracking-wider text-muted-foreground">
          {heading}
        </h2>
      )}

      {sealedToppsStyle ? (
        <SealedPackCardToppsStyle
          {...sealedToppsConfig}
          defaultOpened={defaultOpened}
          onOpen={onBurn}
        >
          {cardArticle}
        </SealedPackCardToppsStyle>
      ) : sealed ? (
        <SealedPackCard
          {...sealedConfig}
          defaultOpened={defaultOpened}
          onOpen={onBurn}
        >
          {cardArticle}
        </SealedPackCard>
      ) : (
        cardArticle
      )}
    </div>
  );
};

type FlyerSlug = "chapman" | "paxson" | "miller" | "davis";

type FlyerPreset = Omit<FlyerCardV3Props, "sealed" | "sealedToppsStyle" | "defaultOpened" | "onBurn" | "hideHeading">;

const CHAPMAN_PRESET: FlyerPreset = {
  heading: "PLATINUM — CHAPMAN",
  borderColor: "#FF5C00",
  borderWidth: "2px",
  image: rexChapmanImg,
  imageAlt: "Rex Chapman fading three-pointer, 1997 Playoffs",
  awayLogo: PHX_LOGO,
  awayAlt: "PHX",
  homeLogo: SEA_LOGO,
  homeAlt: "SEA",
  era: "1997",
  matchup: "West First Round",
  game: "Game 4",
  firstName: "REX",
  lastName: "CHAPMAN",
  quote: QUOTE,
  stats: [
    { label: "PTS", value: 22 },
    { label: "AST", value: 4 },
    { label: "TRB", value: 5 },
    { label: "3P", value: 4 },
    { label: "3PA", value: 12 },
    { label: "MP", value: "44:20" },
  ],
  sealedConfig: {
    topBanner: "PLATINUM · CLUB",
    title: "Supreme Platinum",
    yearLabel: "1996-97",
    midLine: "PLATINUM SUPER COLOR",
    tierLine: ["1", "PREMIUM", "PLATINUM", "CARD"],
    seriesLabel: "SIZZLING HOT 2026 SERIES",
  },
};

const PAXSON_PRESET: FlyerPreset = {
  heading: "PLATINUM — PAXSON",
  borderColor: "#CE1141",
  borderWidth: "2px",
  image: johnPaxsonImg,
  imageAlt: "John Paxson hitting the championship-winning three-pointer, 1993 Supreme Finals Game 6",
  awayLogo: CHI_LOGO,
  awayAlt: "CHI",
  homeLogo: PHX_LOGO,
  homeAlt: "PHX",
  era: "1993",
  matchup: "Finals",
  game: "Game 6",
  firstName: "JOHN",
  lastName: "PAXSON",
  quote: PAXSON_QUOTE,
  quoteBgColor: "rgba(206, 17, 65, 0.6)",
  stats: [
    { label: "PTS", value: 8 },
    { label: "AST", value: 1 },
    { label: "TRB", value: 1 },
    { label: "3P", value: 2 },
    { label: "3PA", value: 3 },
    { label: "MP", value: "22:00" },
  ],
  sealedToppsConfig: {
    sportLabel: "Playoffs",
    yearLabel: "2026",
    seriesLabel: "SERIES 1",
    picturesLabel: "15 PICTURE CARDS",
    qualityLabel: "PREMIUM QUALITY",
  },
};

const MILLER_PRESET: FlyerPreset = {
  heading: "PLATINUM — MILLER",
  borderColor: "#98002E",
  borderWidth: "2px",
  image: mikeMillerImg,
  imageAlt: "Mike Miller shooting a three-pointer in the 2012 Supreme Finals Game 5",
  awayLogo: OKC_LOGO,
  awayAlt: "OKC",
  homeLogo: MIA_LOGO,
  homeAlt: "MIA",
  era: "2012",
  matchup: "Finals",
  game: "Game 5",
  firstName: "MIKE",
  lastName: "MILLER",
  quote: MILLER_QUOTE,
  quoteBgColor: "rgba(152, 1, 46, 0.4)",
  stats: [
    { label: "PTS", value: 23 },
    { label: "TRB", value: 5 },
    { label: "3P", value: 7 },
    { label: "3PA", value: 8 },
    { label: "MP", value: "23:14" },
  ],
  sealedConfig: {
    topBanner: "PLATINUM · CLUB",
    title: "Supreme Platinum",
    yearLabel: "2011-12",
    midLine: "PLATINUM SUPER COLOR",
    tierLine: ["1", "PREMIUM", "PLATINUM", "CARD"],
    seriesLabel: "SIZZLING HOT 2026 SERIES",
  },
};

const DAVIS_PRESET: FlyerPreset = {
  heading: "PLATINUM — DAVIS",
  borderColor: "#007A33",
  borderWidth: "2px",
  image: glenDavisImg,
  imageAlt: "Glen 'Big Baby' Davis driving in the 2009 Eastern Conference Semifinals",
  awayLogo: ORL_LOGO,
  awayAlt: "ORL",
  homeLogo: BOS_LOGO,
  homeAlt: "BOS",
  era: "2009",
  matchup: "East Conf. Semifinals",
  game: "Game 4",
  firstName: "GLEN",
  lastName: "DAVIS",
  quote: DAVIS_QUOTE,
  quoteBgColor: "rgba(0, 122, 51, 0.4)",
  stats: [
    { label: "PTS", value: 21 },
    { label: "TRB", value: 6 },
    { label: "FG", value: 9 },
    { label: "FGA", value: 14 },
    { label: "MP", value: "33:11" },
  ],
  sealedToppsConfig: {
    sportLabel: "Playoffs",
    yearLabel: "2026",
    seriesLabel: "SERIES 1",
    picturesLabel: "15 PICTURE CARDS",
    qualityLabel: "PREMIUM QUALITY",
  },
};

const PRESETS: Record<FlyerSlug, { preset: FlyerPreset; toppsStyle: boolean }> = {
  chapman: { preset: CHAPMAN_PRESET, toppsStyle: false },
  paxson: { preset: { ...PAXSON_PRESET, sealedConfig: CHAPMAN_PRESET.sealedConfig }, toppsStyle: false },
  miller: { preset: MILLER_PRESET, toppsStyle: false },
  davis: { preset: { ...DAVIS_PRESET, sealedConfig: CHAPMAN_PRESET.sealedConfig }, toppsStyle: false },
};

export interface FlyerCardForIdProps {
  cardId: FlyerSlug;
  sealed?: boolean;
  defaultOpened?: boolean;
  hideHeading?: boolean;
  onBurn?: () => void;
}

export const FlyerCardForId = ({ cardId, sealed = false, defaultOpened, hideHeading, onBurn }: FlyerCardForIdProps) => {
  const { preset, toppsStyle } = PRESETS[cardId];
  return (
    <FlyerCardV3
      {...preset}
      sealed={sealed && !toppsStyle}
      sealedToppsStyle={sealed && toppsStyle}
      defaultOpened={defaultOpened}
      hideHeading={hideHeading}
      onBurn={onBurn}
    />
  );
};

export const DemoFlyerCardV3 = () => <FlyerCardForId cardId="chapman" sealed />;
export const DemoFlyerCardPaxson = () => <FlyerCardForId cardId="paxson" sealed />;
export const DemoFlyerCardMiller = () => <FlyerCardForId cardId="miller" />;
export const DemoFlyerCardDavis = () => <FlyerCardForId cardId="davis" />;

/* ──────────────────────────────────────────────────────────────
   V4 — Newspaper / box-score vibe
   Two-column layout: image left, structured stat block right.
   ────────────────────────────────────────────────────────────── */
export const DemoFlyerCardV4 = () => {
  return (
    <div className="space-y-2">
      <h2 className="font-display text-lg tracking-wider text-muted-foreground">
        PLATINUM — V4 (BOX SCORE)
      </h2>

      <article className="relative overflow-hidden rounded-xl bg-[#1A1E24] border border-white/10 shadow-xl">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-white/10 bg-black/30">
          <img
            src={flyerLogo}
            alt="PLATINUM The Shot"
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
              1997 · Western First Round
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
