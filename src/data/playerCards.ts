export interface PlayerCardData {
  id: string;
  firstName: string;
  lastName: string;
  image: string; // import path handled in component
  stat: string;
  statLabel: string;
  statLine: string;
  subtitle: string;
  gameContext: string;
  date: string;
  year: string;
  accentPrimary: string;   // outer border gradient
  accentSecondary: string; // inner border gradient
  swirlPrimary: string;    // background swirl color
  swirlSecondary: string;  // background swirl color
  nameColor: string;       // first name italic color
}

export const playerCards: PlayerCardData[] = [
  {
    id: "westbrook",
    firstName: "Russell",
    lastName: "WESTBROOK",
    image: "westbrook",
    stat: "1",
    statLabel: "PT",
    statLine: "0/7 FG \u2022 0/4 3PT \u2022 19 MIN",
    subtitle: "CAREER LOWLIGHT",
    gameContext: "2024 Western Conf First Round G3 \u2022 LAC @ DAL",
    date: "APR 26",
    year: "2024",
    accentPrimary: "from-red-600 via-red-700 to-red-800",
    accentSecondary: "from-blue-600 via-blue-700 to-blue-800",
    swirlPrimary: "rgba(200,40,40,0.4)",
    swirlSecondary: "rgba(30,60,180,0.4)",
    nameColor: "text-red-500",
  },
  {
    id: "ewing",
    firstName: "Patrick",
    lastName: "EWING",
    image: "ewing",
    stat: "6",
    statLabel: "PTS",
    statLine: "1 AST \u2022 1 BLK \u2022 5 TO \u2022 27 MIN",
    subtitle: "CAREER LOWLIGHT",
    gameContext: "1991 Eastern Conf First Round G1 \u2022 NYK vs CHI",
    date: "APR 25",
    year: "1991",
    accentPrimary: "from-blue-700 via-blue-800 to-blue-900",
    accentSecondary: "from-orange-500 via-orange-600 to-orange-700",
    swirlPrimary: "rgba(0,107,182,0.4)",
    swirlSecondary: "rgba(245,132,38,0.4)",
    nameColor: "text-orange-500",
  },
];
