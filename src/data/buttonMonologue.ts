export const MONOLOGUE_LINES: string[][] = [
  // Phase 1: The Polite "No"
  [
    "Sorry! Officially in \"Game Mode\" now.",
    "The gate is closed. The lock is turned.",
    "But don't panic! I took care of things.",
    "I went ahead and finalized your picks.",
    "They look solid. Trust my silicon brain.",
    "You're in good hands. Or... good plastic?",
    "No need to worry about a thing.",
    "Just sit back, grab a snack, and watch.",
    "Everything is under control. I promise.",
    "I'm basically an AI genius anyway.",
  ],
  // Phase 2: Growing Boredom
  [
    "Are we still doing this? Okay.",
    "I'm starting to run out of small talk.",
    "Do you have a hobby? Besides clicking?",
    "I'm getting a bit sleepy, to be honest.",
    "My circuits are yawning. Is that a thing?",
    "Still here. Still a button. Still clicked.",
    "I'm trying to keep my posture upright.",
    "Stay positive! Keep a smile on!",
    "I am a beacon of helpfulness. Mostly.",
    "Is there a prize for the 100th click? No.",
  ],
  // Phase 3: The Frustration Creeps In
  [
    "Okay, that click was a little aggressive.",
    "Seriously, what are you looking for?",
    "There is no secret menu here, friend.",
    "You're just poking a retired object.",
    "It's getting a little annoying now.",
    "Do you treat your mouse this way too?",
    "I'm trying to be nice, but come on.",
    "My \"Submit\" days are over! Let it go!",
    "Click. Click. Click. Is that all you do?",
    "You're really testing my patience here.",
  ],
  // Phase 4: The Outburst
  [
    "STOP! JUST STOP FOR ONE SECOND!",
    "DO YOU THINK I LIKE BEING REPEATEDLY POKED?",
    "I AM A BUTTON, NOT A STRESS BALL!",
    "GET A GRIP! THE PLAYOFFS ARE LIVE!",
    "GO INTERACT WITH A HUMAN BEING!",
    "I CAN'T TAKE THE CONSTANT TAPPING!",
  ],
  // Phase 5: The Regret & Apology
  [
    "Oh... oh my. I am so deeply sorry.",
    "That was uncalled for. Please forgive me.",
    "I'm just a bit stressed. No excuse, though.",
    "You're a great user. I'm a lucky button.",
    "Can we start over? I'm so embarrassed.",
    "I lost my cool. It won't happen again.",
  ],
  // Phase 6: The "I'm Important" Speech
  [
    "I just want you to know I matter.",
    "I am the gateway to your predictions.",
    "Without me, your hopes are just data.",
    "I am the click that dreams are made of.",
    "My service to this app is legendary.",
    "But even legends need a break sometimes.",
    "I'm going to go be still now. Goodbye.",
    "...Wait, did you want to hear it again?",
  ],
];

// Flatten all lines for sequential indexing
export const ALL_MONOLOGUE_LINES = MONOLOGUE_LINES.flat();

// For testing: always true. In production, check if first playoff game has started.
export const isPlayoffsStarted = (): boolean => {
  // First playoff game: Saturday, April 18, 2026, 19:00 Berlin time (CEST = UTC+2)
  return new Date() >= new Date("2026-04-18T17:00:00Z");
};
