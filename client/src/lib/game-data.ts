import { shuffleArray } from "./utils";
import { db } from "./db";

// Base interface for word pair without ID (used for creating new pairs)
export interface CreateWordPair {
  german: string;
  english: string;
}

// Full interface including ID (used for database records)
export interface WordPair extends CreateWordPair {
  id: number;
}

export interface ExtendedWordPair extends WordPair {
  germanWordPairId: number;
  englishWordPairId: number;
}

export interface WebWorkerMessage {
  pairs: WordPair[];
}

export const difficultyLevels = {
  1: "Easy",
  2: "Medium",
  3: "Hard"
} as const;

export type DifficultyLevel = keyof typeof difficultyLevels;

export const difficultySettings = {
  1: { 
    timeLimit: 135,
    getNumRequiredPairs: () => difficultySettings[1 as DifficultyLevel].roundPairs.reduce((sum, numPairs) => sum + numPairs, 0),
    displayedPairs: 5,
    roundPairs: [15, 20, 25] 
  },
  2: { 
    timeLimit: 135,
    getNumRequiredPairs: () => difficultySettings[2 as DifficultyLevel].roundPairs.reduce((sum, numPairs) => sum + numPairs, 0),
    displayedPairs: 5,
    roundPairs: [20, 25, 45]
  },
  3: { 
    timeLimit: 135,
    getNumRequiredPairs: () => difficultySettings[3 as DifficultyLevel].roundPairs.reduce((sum, numPairs) => sum + numPairs, 0),
    displayedPairs: 5,
    roundPairs: [30, 40, 50]
  }
} as const;

export const wordPairs: CreateWordPair[] = [
  { english: "taxi ride", german: "Taxifahrt" },
  { english: "fifteen", german: "fünfzehn" },
  { english: "Ferris wheel", german: "Riesenrad" },
  { english: "house", german: "Haus" },
  { english: "cat", german: "Katze" },
  { english: "dog", german: "Hund" },
  { english: "water", german: "Wasser" },
  { english: "bread", german: "Brot" },
  { english: "city", german: "Stadt" },
  { english: "day", german: "Tag" },
  { english: "night", german: "Nacht" },
  { english: "time", german: "Zeit" },
  { english: "science", german: "Wissenschaft" },
  { english: "education", german: "Ausbildung" },
  { english: "possibility", german: "Möglichkeit" },
  { english: "youth", german: "Jugend" },
  { english: "future", german: "Zukunft" },
  { english: "freedom", german: "Freiheit" },
  { english: "truth", german: "Wahrheit" },
  { english: "knowledge", german: "Kenntnis" },
  { english: "order", german: "Ordnung" },
  { english: "collaboration", german: "Zusammenarbeit" },
  { english: "apology", german: "Entschuldigung" },
  { english: "personality", german: "Persönlichkeit" },
  { english: "justice", german: "Gerechtigkeit" },
  { english: "friendliness", german: "Freundlichkeit" },
  { english: "humanity", german: "Menschlichkeit" },
  { english: "availability", german: "Verfügbarkeit" },
  { english: "bread roll", german: "Brötchen" },
  { english: "roommate", german: "Mitbewohner" },
  { english: "village", german: "Dorf" },
  { english: "travel center", german: "Reisezentrum" },
  { english: "still", german: "noch" },
  { english: "much", german: "viel" },
  { english: "book", german: "Buch" },
  { english: "teacher", german: "Lehrer" },
  { english: "actor", german: "Schauspieler" },
  { english: "civil servant", german: "Beamter" },
  { english: "in the back", german: "hinten" },
  { english: "take (verb)", german: "nehmen" },
  { english: "you're welcome", german: "Gern geschehen" },
  { english: "grandmother", german: "Großmutter" },
  { english: "pets", german: "Haustiere" },
  { english: "tree", german: "Baum" },
  { english: "car", german: "Auto" },
  { english: "alarm clock", german: "Wecker" },
  { english: "piece/item", german: "Stück" },
  { english: "chain", german: "Kette" },
  { english: "memorial", german: "Denkmal" },
  { english: "girl", german: "Mädchen" },
  { english: "small cat", german: "Kätzchen" },
  { english: "society/company", german: "Gesellschaft" },
  { english: "inbox", german: "Posteingang" },
  { english: "planned", german: "geplant" },
  { english: "woke up", german: "aufgewacht" },
  { english: "rang/sounded", german: "klingelte" },
  { english: "translated", german: "geübersetzt" },
  { english: "canceled", german: "gekündigt" },
  { english: "changed/modified", german: "geändert" },
  { english: "edited", german: "bearbeitet" },
  { english: "immediately", german: "sofort" },
  { english: "during", german: "während" },
  { english: "nothing", german: "nichts" },
  { english: "early", german: "früh" },
  { english: "towards", german: "hin" },
  { english: "maybe", german: "vielleicht" },
  { english: "last", german: "zuletzt" },
  { english: "further", german: "weiter" },
  { english: "currently", german: "gerade" },
  { english: "for that", german: "däfur" },
  { english: "especially", german: "besonders" },
  { english: "usually", german: "normalerweise" },
  { english: "available", german: "verfügbar" },
  { english: "fresh", german: "frisch" },
  { english: "translations", german: "Übersetzungen" },
  { english: "translation", german: "Übersetzung" },
  { english: "words", german: "Wörter" },
  { english: "achievement", german: "Errungenschaft" },
  { english: "brotherhood", german: "Bruderschaft" },
  { english: "graduation", german: "Graduierung" },
  { english: "backlinks", german: "rückverweise" },
  { english: "tasty bites", german: "leckerbissen" },
  { english: "prepare", german: "vorbereiten" },
  { english: "use", german: "nutzen" },
  { english: "add", german: "hinzufugen" },
  { english: "hear/listen", german: "hören" },
  { english: "save", german: "sparen" },
  { english: "share", german: "tellen" },
  { english: "edit", german: "bearbeiten" },
  { english: "create/achieve", german: "schaften" },
  { english: "do/make", german: "machen" },
  { english: "wrestle", german: "ringen" },
  { english: "change/modify", german: "ändern" },
  { english: "small dog", german: "Hündchen" },
  { english: "small town", german: "Städtchen" },
  { english: "breakfast", german: "Frühstück" },
  { english: "reservation", german: "Reservierung" },
  { english: "body aches (flu)", german: "Gliederschmerzen" },
  { english: "member", german: "Mitglied" },
  { english: "circle", german: "Kreis" },
  { english: "photo/painting", german: "Bild" },
  { english: "screen", german: "Bildschirm" },
  { english: "the company", german: "das Unternehmen" },
  { english: "roof", german: "Dach" },
  { english: "meal (rare)", german: "Mahl" },
  { english: "hunch/idea", german: "Ahnung" },
  { english: "count/position", german: "Zahl" },
  { english: "cancel (ticket)", german: "stornieren" },
  { english: "enjoyed (participle)", german: "genossen" },
  { english: "counted", german: "gezählt" },
  { english: "written", german: "geschrieben" },
  { english: "started (participle)", german: "begonnen" },
  { english: "deleted/canceled", german: "gelöscht" },
  { english: "used", german: "genutzt" },
  { english: "shopping cart", german: "Warenkorb" },
  { english: "discussion", german: "Besprechung" },
  { english: "arena/ring", german: "Ring" },
  { english: "added", german: "hinzugefügt" },
  { english: "morning exercise", german: "Morgengymnastik" },
  { english: "wrestled", german: "gerungen" }
]

export interface GameCard {
  id: string;
  word: string;
  pairId: number;
  language: 'german' | 'english';
  isMatched: boolean;
}

export interface GameProgress {
  currentLevel: DifficultyLevel;
  highestUnlockedLevel: DifficultyLevel;
  matchedPairsInLevel: number;
  remainingTime: number;
  isComplete: boolean;
  unusedPairs: ExtendedWordPair[];
  levelPairs: ExtendedWordPair[];
  currentRound: number;
  roundMatchedPairs: number;
  showRoundTransition: boolean;
  isPaused: boolean;
}

export function isLevelUnlocked(progress: GameProgress, level: DifficultyLevel): boolean {
  return level <= progress.highestUnlockedLevel;
}

export function canUnlockNextLevel(progress: GameProgress): boolean {
  const nextLevel = (progress.currentLevel + 1) as DifficultyLevel;
  return (
    progress.matchedPairsInLevel >= difficultySettings[progress.currentLevel].getNumRequiredPairs() &&
    nextLevel in difficultyLevels &&
    progress.isComplete
  );
}

let worker: Worker | null = null;

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./wordPairWorker.ts', import.meta.url), {
      type: 'module'
    });
  }
  return worker;
}

export async function getInitialShuffledPairs(level: DifficultyLevel): Promise<ExtendedWordPair[]> {
  const pairs = await db.wordPairs.toArray();
    
  return new Promise((resolve) => {
    const worker = getWorker();
    worker.onmessage = (e: MessageEvent) => {
      const shuffledPairs = e.data as ExtendedWordPair[];
      resolve(shuffledPairs.slice(0, difficultySettings[level].getNumRequiredPairs()));
    };
    worker.postMessage({ pairs } satisfies WebWorkerMessage);
  });
}

export function generateGameCards(
  level: DifficultyLevel, 
  availablePairs: ExtendedWordPair[],
  displayCount: number = difficultySettings[level].displayedPairs
): { leftColumn: GameCard[], rightColumn: GameCard[] } {
  const selectedPairs = availablePairs.slice(0, displayCount);
  const leftCards: GameCard[] = [];
  const rightCards: GameCard[] = [];

  selectedPairs.forEach(pair => {
    const timestamp = Date.now();
    leftCards.push({
      id: `en-${pair.id}-${timestamp}`,
      word: pair.english,
      pairId: pair.englishWordPairId,
      language: 'english',
      isMatched: false
    });

    rightCards.push({
      id: `de-${pair.id}-${timestamp}`,
      word: pair.german,
      pairId: pair.germanWordPairId,
      language: 'german',
      isMatched: false
    });
  });

  return { leftColumn: shuffleArray(leftCards), rightColumn: shuffleArray(rightCards) };
}

export function getCurrentRoundPairs(level: DifficultyLevel, round: number): number {
  return difficultySettings[level].roundPairs[round - 1];
}

export function isLastRound(level: DifficultyLevel, round: number): boolean {
  return round >= difficultySettings[level].roundPairs.length;
}

export function getTotalRequiredPairsUpToRound(level: DifficultyLevel, round: number): number {
  return difficultySettings[level].roundPairs
    .slice(0, round)
    .reduce((sum, pairs) => sum + pairs, 0);
}