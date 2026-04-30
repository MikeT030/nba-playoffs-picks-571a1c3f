import { User } from "lucide-react";
import { usePlayerCard } from "@/hooks/usePlayerCard";
import { playerCards } from "@/data/playerCards";

import westbrookImg from "@/assets/westbrook.jpeg";
import ewingImg from "@/assets/ewing.webp";
import millerImg from "@/assets/miller.webp";
import starksImg from "@/assets/starks.webp";
import lebronImg from "@/assets/lebron.webp";
import pippenImg from "@/assets/pippen.webp";
import kmartinImg from "@/assets/kmartin.webp";
import bsimmonsImg from "@/assets/bsimmons.webp";
import curryImg from "@/assets/curry.webp";
import kobeImg from "@/assets/kobe.webp";
import wadeImg from "@/assets/wade.jpg";

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
  wade: wadeImg,
};

interface HeroBannerMinimalProps {
  title: string;
  /**
   * When true, renders a demo profile avatar in the top-right corner of the
   * header itself (for Admin previews). In real page usage the global
   * TopRightAuth avatar already covers this, so leave it off there.
   */
  showDemoAvatar?: boolean;
}

/**
 * Minimal hero header variant.
 * - No trophy thumbnail, no subtitle, no divider lines.
 * - Just a large H1 on the page background.
 * - H1 typography matches HeroBanner (Claymale display font).
 */
const HeroBannerMinimal = ({ title, showDemoAvatar = false }: HeroBannerMinimalProps) => {
  const { assignedCardId } = usePlayerCard();
  const card = assignedCardId ? playerCards.find((c) => c.id === assignedCardId) : null;
  const playerImage = card ? images[card.image] : null;

  return (
    <div className="relative w-full bg-background">
      {showDemoAvatar && (
        <div className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#22272E]/80 backdrop-blur-md overflow-hidden">
          {playerImage ? (
            <img
              src={playerImage}
              alt={card?.lastName ?? "Player"}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <User size={18} className="text-white" />
          )}
        </div>
      )}
      <div className="container pt-20 pb-6">
        <h1
          className="md:text-6xl tracking-wider leading-[1.05] whitespace-pre-line text-5xl font-medium"
          style={{ fontFamily: "'Claymale', 'Archivo Black', sans-serif" }}
        >
          {title}
        </h1>
      </div>
    </div>
  );
};

export default HeroBannerMinimal;
