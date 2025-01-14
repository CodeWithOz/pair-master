import { WordPair } from '../game-data';
import { shuffleArray } from '../utils';
import { DifficultyLevel, difficultySettings } from '../game-data';

// Message types
type GetWordPairsMessage = {
  type: 'GET_WORD_PAIRS';
  pairs: WordPair[];
  level: DifficultyLevel;
};

type GetShuffledPairsMessage = {
  type: 'GET_SHUFFLED_PAIRS';
  pairs: WordPair[];
  level: DifficultyLevel;
};

// Handle messages from the main thread
self.onmessage = async (e: MessageEvent) => {
  const { type, pairs, level } = e.data as GetWordPairsMessage | GetShuffledPairsMessage;

  switch (type) {
    case 'GET_WORD_PAIRS': {
      const requiredPairs = difficultySettings[level].requiredPairs;
      // Sort in reverse order and take required number of pairs
      const levelPairs = pairs.slice(0, requiredPairs);
      self.postMessage({ pairs: levelPairs });
      break;
    }
    case 'GET_SHUFFLED_PAIRS': {
      const requiredPairs = difficultySettings[level].requiredPairs;
      const levelPairs = pairs.slice(0, requiredPairs);
      const shuffledPairs = shuffleArray(
        levelPairs.map((pair) => ({
          ...pair,
          germanWordPairId: pair.id,
          englishWordPairId: pair.id,
        }))
      );
      self.postMessage({ pairs: shuffledPairs });
      break;
    }
  }
};
