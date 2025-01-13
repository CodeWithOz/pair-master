import { z } from "zod";
import { shuffleArray } from "./utils";
import { db } from "./db";

export interface WordPair {
  id: number;
  german: string;
  english: string;
  difficulty: number;
}

export interface ExtendedWordPair extends WordPair {
  germanWordPairId: number;
  englishWordPairId: number;
}

export const difficultyLevels = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced"
} as const;

export type DifficultyLevel = keyof typeof difficultyLevels;

export const difficultySettings = {
  1: { 
    timeLimit: 180, 
    requiredPairs: 15, 
    displayedPairs: 5,
    roundPairs: [5, 5, 5] // Distribution of pairs across rounds
  },
  2: { 
    timeLimit: 150, 
    requiredPairs: 20, 
    displayedPairs: 5,
    roundPairs: [5, 7, 8]
  },
  3: { 
    timeLimit: 120, 
    requiredPairs: 25, 
    displayedPairs: 5,
    roundPairs: [7, 8, 10]
  }
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
    progress.matchedPairsInLevel >= difficultySettings[progress.currentLevel].requiredPairs &&
    nextLevel in difficultyLevels &&
    progress.isComplete
  );
}

export async function getWordPairsForLevel(level: DifficultyLevel): Promise<WordPair[]> {
  const requiredPairs = difficultySettings[level].requiredPairs;
  return await db.wordPairs
    .where('difficulty')
    .equals(level)
    .reverse()
    .limit(requiredPairs)
    .toArray();
}

export async function getInitialShuffledPairs(level: DifficultyLevel): Promise<ExtendedWordPair[]> {
  const levelPairs = await getWordPairsForLevel(level);
  return shuffleArray(
    levelPairs.map((pair) => ({
      ...pair,
      germanWordPairId: pair.id,
      englishWordPairId: pair.id,
    }))
  );
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