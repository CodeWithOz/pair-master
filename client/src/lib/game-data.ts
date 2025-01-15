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
  { german: "viel", english: "much" },
  { german: "Taxifahrt", english: "taxi ride" },
  { german: "noch", english: "still" },
  { german: "fünfzehn", english: "fifteen" },
  { german: "Riesenrad", english: "Ferris wheel" },
  { german: "Buch", english: "book" },
  { german: "Haus", english: "house" },
  { german: "Katze", english: "cat" },
  { german: "Hund", english: "dog" },
  { german: "Wasser", english: "water" },
  { german: "Brot", english: "bread" },
  { german: "Stadt", english: "city" },
  { german: "Tag", english: "day" },
  { german: "Nacht", english: "night" },
  { german: "Zeit", english: "time" },
  { german: "Entwicklung", english: "development" },
  { german: "Wissenschaft", english: "science" },
  { german: "Gesellschaft", english: "society" },
  { german: "Erfahrung", english: "experience" },
  { german: "Verwaltung", english: "administration" },
  { german: "Beziehung", english: "relationship" },
  { german: "Ausbildung", english: "education" },
  { german: "Möglichkeit", english: "possibility" },
  { german: "Umgebung", english: "environment" },
  { german: "Verhalten", english: "behavior" },
  { german: "Bedeutung", english: "meaning" },
  { german: "Bewegung", english: "movement" },
  { german: "Gedanke", english: "thought" },
  { german: "Jugend", english: "youth" },
  { german: "Zukunft", english: "future" },
  { german: "Freiheit", english: "freedom" },
  { german: "Wahrheit", english: "truth" },
  { german: "Kenntnis", english: "knowledge" },
  { german: "Ordnung", english: "order" },
  { german: "Leistung", english: "performance" },
  { german: "Nachhaltigkeit", english: "sustainability" },
  { german: "Wahrscheinlichkeit", english: "probability" },
  { german: "Zusammenarbeit", english: "collaboration" },
  { german: "Verantwortung", english: "responsibility" },
  { german: "Geschwindigkeit", english: "velocity" },
  { german: "Entschuldigung", english: "apology" },
  { german: "Gleichberechtigung", english: "equality" },
  { german: "Unabhängigkeit", english: "independence" },
  { german: "Wirtschaftlichkeit", english: "economy" },
  { german: "Zweckmäßigkeit", english: "practicality" },
  { german: "Persönlichkeit", english: "personality" },
  { german: "Gerechtigkeit", english: "justice" },
  { german: "Vollständigkeit", english: "completeness" },
  { german: "Zuverlässigkeit", english: "reliability" },
  { german: "Vertraulichkeit", english: "confidentiality" },
  { german: "Ausführlichkeit", english: "thoroughness" },
  { german: "Unsterblichkeit", english: "immortality" },
  { german: "Beständigkeit", english: "consistency" },
  { german: "Aufrichtigkeit", english: "sincerity" },
  { german: "Freundlichkeit", english: "friendliness" },
  { german: "Menschlichkeit", english: "humanity" },
  { german: "Bescheidenheit", english: "modesty" },
  { german: "Besonderheit", english: "peculiarity" },
  { german: "Verfügbarkeit", english: "availability" },
  { german: "Zugehörigkeit", english: "affiliation" }
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