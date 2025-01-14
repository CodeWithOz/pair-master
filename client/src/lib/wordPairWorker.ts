
import { DifficultyLevel, WordPair, ExtendedWordPair } from './game-data';

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

self.onmessage = async (e: MessageEvent) => {
  const { level, pairs } = e.data;
  
  // Get word pairs for level
  const requiredPairs = pairs.slice(0, level * 15);
  
  // Convert to extended pairs and shuffle
  const extendedPairs = shuffleArray(
    requiredPairs.map((pair: WordPair) => ({
      ...pair,
      germanWordPairId: pair.id,
      englishWordPairId: pair.id,
    }))
  );
  
  self.postMessage(extendedPairs);
};
