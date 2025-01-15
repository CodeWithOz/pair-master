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

export const wordPairs: WordPair[] = [
  // Beginner (Level 1) - 15 pairs
  { id: 1, german: "viel", english: "much" },
  { id: 2, german: "Taxifahrt", english: "taxi ride" },
  { id: 3, german: "noch", english: "still" },
  { id: 4, german: "fünfzehn", english: "fifteen" },
  { id: 5, german: "Riesenrad", english: "Ferris wheel" },
  { id: 6, german: "Buch", english: "book" },
  { id: 7, german: "Haus", english: "house" },
  { id: 8, german: "Katze", english: "cat" },
  { id: 9, german: "Hund", english: "dog" },
  { id: 10, german: "Wasser", english: "water" },
  { id: 11, german: "Brot", english: "bread" },
  { id: 12, german: "Stadt", english: "city" },
  { id: 13, german: "Tag", english: "day" },
  { id: 14, german: "Nacht", english: "night" },
  { id: 15, german: "Zeit", english: "time" },
  // Intermediate (Level 2) - 20 pairs
  { id: 16, german: "Entwicklung", english: "development" },
  { id: 17, german: "Wissenschaft", english: "science" },
  { id: 18, german: "Gesellschaft", english: "society" },
  { id: 19, german: "Erfahrung", english: "experience" },
  { id: 20, german: "Verwaltung", english: "administration" },
  { id: 21, german: "Beziehung", english: "relationship" },
  { id: 22, german: "Ausbildung", english: "education" },
  { id: 23, german: "Möglichkeit", english: "possibility" },
  { id: 24, german: "Umgebung", english: "environment" },
  { id: 25, german: "Verhalten", english: "behavior" },
  { id: 26, german: "Bedeutung", english: "meaning" },
  { id: 27, german: "Bewegung", english: "movement" },
  { id: 28, german: "Gedanke", english: "thought" },
  { id: 29, german: "Jugend", english: "youth" },
  { id: 30, german: "Zukunft", english: "future" },
  { id: 31, german: "Freiheit", english: "freedom" },
  { id: 32, german: "Wahrheit", english: "truth" },
  { id: 33, german: "Kenntnis", english: "knowledge" },
  { id: 34, german: "Ordnung", english: "order" },
  { id: 35, german: "Leistung", english: "performance" },
  // Advanced (Level 3) - 25 pairs
  { id: 36, german: "Nachhaltigkeit", english: "sustainability" },
  { id: 37, german: "Wahrscheinlichkeit", english: "probability" },
  { id: 38, german: "Zusammenarbeit", english: "collaboration" },
  { id: 39, german: "Verantwortung", english: "responsibility" },
  { id: 40, german: "Geschwindigkeit", english: "velocity" },
  { id: 41, german: "Entschuldigung", english: "apology" },
  { id: 42, german: "Gleichberechtigung", english: "equality" },
  { id: 43, german: "Unabhängigkeit", english: "independence" },
  { id: 44, german: "Wirtschaftlichkeit", english: "economy" },
  { id: 45, german: "Zweckmäßigkeit", english: "practicality" },
  { id: 46, german: "Persönlichkeit", english: "personality" },
  { id: 47, german: "Gerechtigkeit", english: "justice" },
  { id: 48, german: "Vollständigkeit", english: "completeness" },
  { id: 49, german: "Zuverlässigkeit", english: "reliability" },
  { id: 50, german: "Vertraulichkeit", english: "confidentiality" },
  { id: 51, german: "Ausführlichkeit", english: "thoroughness" },
  { id: 52, german: "Unsterblichkeit", english: "immortality" },
  { id: 53, german: "Beständigkeit", english: "consistency" },
  { id: 54, german: "Aufrichtigkeit", english: "sincerity" },
  { id: 55, german: "Freundlichkeit", english: "friendliness" },
  { id: 56, german: "Menschlichkeit", english: "humanity" },
  { id: 57, german: "Bescheidenheit", english: "modesty" },
  { id: 58, german: "Besonderheit", english: "peculiarity" },
  { id: 59, german: "Verfügbarkeit", english: "availability" },
  { id: 60, german: "Zugehörigkeit", english: "affiliation" }
];

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