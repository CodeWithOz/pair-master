/// <reference lib="webworker" />

// Utility function for shuffling arrays
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Type definitions inline to avoid import issues
interface WordPair {
  id: number;
  german: string;
  english: string;
}

interface ExtendedWordPair extends WordPair {
  germanWordPairId: number;
  englishWordPairId: number;
}

type DifficultyLevel = 1 | 2 | 3;

const difficultySettings = {
  1: { requiredPairs: 15 },
  2: { requiredPairs: 20 },
  3: { requiredPairs: 25 }
} as const;

// Handle messages from the main thread
self.onmessage = (e: MessageEvent) => {
  try {
    const { type, pairs, level } = e.data as {
      type: 'GET_WORD_PAIRS' | 'GET_SHUFFLED_PAIRS';
      pairs: WordPair[];
      level: DifficultyLevel;
    };

    console.log('Worker received message:', type, 'for level:', level);

    const requiredPairs = difficultySettings[level].requiredPairs;
    const levelPairs = pairs.slice(0, requiredPairs);

    switch (type) {
      case 'GET_WORD_PAIRS':
        self.postMessage({ pairs: levelPairs });
        break;

      case 'GET_SHUFFLED_PAIRS':
        const shuffledPairs = shuffleArray(
          levelPairs.map((pair) => ({
            ...pair,
            germanWordPairId: pair.id,
            englishWordPairId: pair.id,
          }))
        );
        self.postMessage({ pairs: shuffledPairs });
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export {};