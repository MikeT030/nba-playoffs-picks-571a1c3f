import { Link, useLocation } from "react-router-dom";
import { User } from "lucide-react";
import { usePlayerCard } from "@/hooks/usePlayerCard";
import { playerCards } from "@/data/playerCards";

// Image map — same as PlayerCard.tsx
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

const TopRightAuth = () => {
  const location = useLocation();
  const { assignedCardId } = usePlayerCard();

  if (location.pathname.startsWith("/match/")) return null;

  const card = assignedCardId ? playerCards.find((c) => c.id === assignedCardId) : null;
  const playerImage = card ? images[card.image] : null;

  return (
    <Link
      to="/settings"
      className="absolute top-4 right-4 z-50 flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#22272E]/80 backdrop-blur-md hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 overflow-hidden"
    >
      {playerImage ? (
        <img
          src={playerImage}
          alt={card?.lastName ?? "Player"}
          className="w-full h-full object-cover object-top"
        />
      ) : (
        <User size={18} className="text-white" />
      )}
    </Link>
  );
};

export default TopRightAuth;
