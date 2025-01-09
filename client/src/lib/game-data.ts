import { z } from "zod";

export interface WordPair {
  id: number;
  german: string;
  english: string;
  difficulty: number;
}

export const difficultyLevels = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced"
} as const;

export type DifficultyLevel = keyof typeof difficultyLevels;

export const difficultySettings = {
  1: { timeLimit: 180, requiredPairs: 15, displayedPairs: 5 }, // 3:00 minutes
  2: { timeLimit: 150, requiredPairs: 20, displayedPairs: 5 }, // 2:30 minutes
  3: { timeLimit: 120, requiredPairs: 25, displayedPairs: 5 }  // 2:00 minutes
} as const;

export const wordPairs: WordPair[] = [
  // Beginner (Level 1) - 15 pairs
  { id: 1, german: "viel", english: "much", difficulty: 1 },
  { id: 2, german: "Taxifahrt", english: "taxi ride", difficulty: 1 },
  { id: 3, german: "noch", english: "still", difficulty: 1 },
  { id: 4, german: "fünfzehn", english: "fifteen", difficulty: 1 },
  { id: 5, german: "Riesenrad", english: "Ferris wheel", difficulty: 1 },
  { id: 6, german: "Buch", english: "book", difficulty: 1 },
  { id: 7, german: "Haus", english: "house", difficulty: 1 },
  { id: 8, german: "Katze", english: "cat", difficulty: 1 },
  { id: 9, german: "Hund", english: "dog", difficulty: 1 },
  { id: 10, german: "Wasser", english: "water", difficulty: 1 },
  { id: 11, german: "Brot", english: "bread", difficulty: 1 },
  { id: 12, german: "Stadt", english: "city", difficulty: 1 },
  { id: 13, german: "Tag", english: "day", difficulty: 1 },
  { id: 14, german: "Nacht", english: "night", difficulty: 1 },
  { id: 15, german: "Zeit", english: "time", difficulty: 1 },

  // Intermediate (Level 2) - 20 pairs
  { id: 16, german: "Entwicklung", english: "development", difficulty: 2 },
  { id: 17, german: "Wissenschaft", english: "science", difficulty: 2 },
  { id: 18, german: "Gesellschaft", english: "society", difficulty: 2 },
  { id: 19, german: "Erfahrung", english: "experience", difficulty: 2 },
  { id: 20, german: "Verwaltung", english: "administration", difficulty: 2 },
  { id: 21, german: "Beziehung", english: "relationship", difficulty: 2 },
  { id: 22, german: "Ausbildung", english: "education", difficulty: 2 },
  { id: 23, german: "Möglichkeit", english: "possibility", difficulty: 2 },
  { id: 24, german: "Umgebung", english: "environment", difficulty: 2 },
  { id: 25, german: "Verhalten", english: "behavior", difficulty: 2 },
  { id: 26, german: "Bedeutung", english: "meaning", difficulty: 2 },
  { id: 27, german: "Bewegung", english: "movement", difficulty: 2 },
  { id: 28, german: "Gedanke", english: "thought", difficulty: 2 },
  { id: 29, german: "Jugend", english: "youth", difficulty: 2 },
  { id: 30, german: "Zukunft", english: "future", difficulty: 2 },
  { id: 31, german: "Freiheit", english: "freedom", difficulty: 2 },
  { id: 32, german: "Wahrheit", english: "truth", difficulty: 2 },
  { id: 33, german: "Kenntnis", english: "knowledge", difficulty: 2 },
  { id: 34, german: "Ordnung", english: "order", difficulty: 2 },
  { id: 35, german: "Leistung", english: "performance", difficulty: 2 },

  // Advanced (Level 3) - 25 pairs
  { id: 36, german: "Nachhaltigkeit", english: "sustainability", difficulty: 3 },
  { id: 37, german: "Wahrscheinlichkeit", english: "probability", difficulty: 3 },
  { id: 38, german: "Zusammenarbeit", english: "collaboration", difficulty: 3 },
  { id: 39, german: "Verantwortung", english: "responsibility", difficulty: 3 },
  { id: 40, german: "Geschwindigkeit", english: "velocity", difficulty: 3 },
  { id: 41, german: "Entschuldigung", english: "apology", difficulty: 3 },
  { id: 42, german: "Gleichberechtigung", english: "equality", difficulty: 3 },
  { id: 43, german: "Unabhängigkeit", english: "independence", difficulty: 3 },
  { id: 44, german: "Wirtschaftlichkeit", english: "economy", difficulty: 3 },
  { id: 45, german: "Zweckmäßigkeit", english: "practicality", difficulty: 3 },
  { id: 46, german: "Persönlichkeit", english: "personality", difficulty: 3 },
  { id: 47, german: "Gerechtigkeit", english: "justice", difficulty: 3 },
  { id: 48, german: "Vollständigkeit", english: "completeness", difficulty: 3 },
  { id: 49, german: "Zuverlässigkeit", english: "reliability", difficulty: 3 },
  { id: 50, german: "Vertraulichkeit", english: "confidentiality", difficulty: 3 },
  { id: 51, german: "Ausführlichkeit", english: "thoroughness", difficulty: 3 },
  { id: 52, german: "Unsterblichkeit", english: "immortality", difficulty: 3 },
  { id: 53, german: "Beständigkeit", english: "consistency", difficulty: 3 },
  { id: 54, german: "Aufrichtigkeit", english: "sincerity", difficulty: 3 },
  { id: 55, german: "Freundlichkeit", english: "friendliness", difficulty: 3 },
  { id: 56, german: "Menschlichkeit", english: "humanity", difficulty: 3 },
  { id: 57, german: "Bescheidenheit", english: "modesty", difficulty: 3 },
  { id: 58, german: "Besonderheit", english: "peculiarity", difficulty: 3 },
  { id: 59, german: "Verfügbarkeit", english: "availability", difficulty: 3 },
  { id: 60, german: "Zugehörigkeit", english: "affiliation", difficulty: 3 }
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
  unusedPairs: WordPair[]; // Added state to track unused pairs
  nextPair: {id:number; german: string; english: string;} | null; //Added nextPair
}

export function isLevelUnlocked(progress: GameProgress, level: DifficultyLevel): boolean {
  return level <= progress.highestUnlockedLevel;
}

export function canUnlockNextLevel(progress: GameProgress): boolean {
  const nextLevel = (progress.currentLevel + 1) as DifficultyLevel;
  const settings = difficultySettings[progress.currentLevel];
  return (
    progress.matchedPairsInLevel >= settings.requiredPairs &&
    nextLevel in difficultyLevels &&
    progress.isComplete
  );
}

export async function getWordPairsForLevel(level: DifficultyLevel): Promise<WordPair[]> {
  const db = (await import('./db')).db;
  return await db.wordPairs.where('difficulty').equals(level).toArray();
}

export async function getInitialShuffledPairs(level: DifficultyLevel): Promise<WordPair[]> {
  const levelPairs = await getWordPairsForLevel(level);
  return [...levelPairs].sort(() => Math.random() - 0.5);
}

export function generateGameCards(
  level: DifficultyLevel,
  availablePairs: WordPair[],
  displayCount: number = difficultySettings[level].displayedPairs
): { leftColumn: GameCard[], rightColumn: GameCard[] } {
  // Take the first n pairs sequentially from available pairs
  const selectedPairs = availablePairs.slice(0, displayCount);

  const leftCards: GameCard[] = [];
  const rightCards: GameCard[] = [];

  selectedPairs.forEach(pair => {
    // Add timestamp to ensure unique IDs even for the same pair
    const timestamp = Date.now();
    leftCards.push({
      id: `en-${pair.id}-${timestamp}`,
      word: pair.english,
      pairId: pair.id,
      language: 'english',
      isMatched: false
    });

    rightCards.push({
      id: `de-${pair.id}-${timestamp}`,
      word: pair.german,
      pairId: pair.id,
      language: 'german',
      isMatched: false
    });
  });

  // Shuffle only the display order, not the pair selection
  for (let i = leftCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [leftCards[i], leftCards[j]] = [leftCards[j], leftCards[i]];
  }

  for (let i = rightCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rightCards[i], rightCards[j]] = [rightCards[j], rightCards[i]];
  }

  return { leftColumn: leftCards, rightColumn: rightCards };
}

export interface CrossPairResult {
  currentPair: {
    id: number;
    german: string;
    english: string;
  };
  nextPair: {
    id: number;
    german: string;
    english: string;
  } | null;
}

export function prepareCrossPairs(unusedPairs: WordPair[]): CrossPairResult {
  if (unusedPairs.length === 0) {
    throw new Error("No unused pairs available");
  }

  // If only one pair left, return it as-is
  if (unusedPairs.length === 1) {
    return {
      currentPair: {
        id: unusedPairs[0].id,
        german: unusedPairs[0].german,
        english: unusedPairs[0].english
      },
      nextPair: null
    };
  }

  // Take the next two pairs
  const [pair1, pair2] = unusedPairs.slice(0,2);

  // Create all possible combinations
  const combinations = [
    { id: pair1.id, german: pair1.german, english: pair1.english },
    { id: pair2.id, german: pair2.german, english: pair2.english },
    { id: pair1.id, german: pair1.german, english: pair2.english },
    { id: pair2.id, german: pair2.german, english: pair1.english }
  ];

  // Randomly select two different combinations
  const shuffledCombinations = [...combinations].sort(() => Math.random() - 0.5);
  const [currentPair, nextPair] = shuffledCombinations;

  return {
    currentPair,
    nextPair
  };
}