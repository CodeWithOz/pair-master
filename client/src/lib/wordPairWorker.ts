
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
  const { pairs } = e.data;
  
  // Convert to extended pairs and shuffle
  const extendedPairs = shuffleArray(
    pairs.map((pair: WordPair) => ({
      ...pair,
      germanWordPairId: pair.id,
      englishWordPairId: pair.id,
    }))
  );
  
  self.postMessage(extendedPairs);
};
