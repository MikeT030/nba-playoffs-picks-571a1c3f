export interface MomentCardData {
  id: string;
  firstName: string;
  lastName: string;
  image: string; // resolved via momentImages map
  badgeLabel: string;        // e.g. "THE SHOT"
  description: string;       // narrative blurb
  gameContext: string;       // e.g. "1997 NBA Western Conf. First Round Game 4 | Seattle Super Sonics vs. Phoenix Suns"
  accentPrimary: string;     // outer border gradient (tailwind classes)
  accentSecondary: string;   // inner border gradient (tailwind classes)
  nameColor: string;         // first name italic color (tailwind text-* class)
}

export const momentCards: MomentCardData[] = [
  {
    id: "chapman-the-shot",
    firstName: "Rex",
    lastName: "Chapman",
    image: "chapman",
    badgeLabel: "THE SHOT",
    description:
      "Down three with seconds left, Chapman caught a deflected pass while flying out of bounds and flung a one-legged, fading three-pointer that somehow tied the game.",
    gameContext:
      "1997 NBA Western Conf. First Round Game 4 | Seattle Super Sonics vs. Phoenix Suns",
    accentPrimary: "from-red-600 via-red-700 to-red-800",
    accentSecondary: "from-blue-600 via-blue-700 to-blue-800",
    nameColor: "text-orange-400",
  },
];
