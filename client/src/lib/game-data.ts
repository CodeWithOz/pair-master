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

export const wordPairs: WordPair[] = [
  // Beginner (Level 1)
  { id: 1, german: "viel", english: "much", difficulty: 1 },
  { id: 2, german: "Taxifahrt", english: "taxi ride", difficulty: 1 },
  { id: 3, german: "noch", english: "still", difficulty: 1 },
  { id: 4, german: "fünfzehn", english: "fifteen", difficulty: 1 },
  { id: 5, german: "Riesenrad", english: "Ferris wheel", difficulty: 1 },

  // Intermediate (Level 2)
  { id: 6, german: "Entwicklung", english: "development", difficulty: 2 },
  { id: 7, german: "Wissenschaft", english: "science", difficulty: 2 },
  { id: 8, german: "Gesellschaft", english: "society", difficulty: 2 },
  { id: 9, german: "Erfahrung", english: "experience", difficulty: 2 },
  { id: 10, german: "Verwaltung", english: "administration", difficulty: 2 },

  // Advanced (Level 3)
  { id: 11, german: "Nachhaltigkeit", english: "sustainability", difficulty: 3 },
  { id: 12, german: "Wahrscheinlichkeit", english: "probability", difficulty: 3 },
  { id: 13, german: "Zusammenarbeit", english: "collaboration", difficulty: 3 },
  { id: 14, german: "Verantwortung", english: "responsibility", difficulty: 3 },
  { id: 15, german: "Geschwindigkeit", english: "velocity", difficulty: 3 }
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
}

const PAIRS_TO_UNLOCK_NEXT_LEVEL = 4;

export function isLevelUnlocked(progress: GameProgress, level: DifficultyLevel): boolean {
  return level <= progress.highestUnlockedLevel;
}

export function canUnlockNextLevel(progress: GameProgress): boolean {
  const nextLevel = (progress.currentLevel + 1) as DifficultyLevel;
  return (
    progress.matchedPairsInLevel >= PAIRS_TO_UNLOCK_NEXT_LEVEL &&
    nextLevel in difficultyLevels
  );
}

export function getWordPairsForLevel(level: DifficultyLevel): WordPair[] {
  return wordPairs.filter(pair => pair.difficulty === level);
}

export function generateGameCards(level: DifficultyLevel): { leftColumn: GameCard[], rightColumn: GameCard[] } {
  const levelWordPairs = getWordPairsForLevel(level);
  const leftCards: GameCard[] = [];
  const rightCards: GameCard[] = [];

  levelWordPairs.forEach(pair => {
    leftCards.push({
      id: `en-${pair.id}`,
      word: pair.english,
      pairId: pair.id,
      language: 'english',
      isMatched: false
    });

    rightCards.push({
      id: `de-${pair.id}`,
      word: pair.german,
      pairId: pair.id,
      language: 'german',
      isMatched: false
    });
  });

  // Shuffle each column independently
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