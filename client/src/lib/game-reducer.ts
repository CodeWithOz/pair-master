import {
  type GameCard,
  type GameProgress,
  type DifficultyLevel,
  difficultySettings,
  generateGameCards,
  ExtendedWordPair,
} from "./game-data";

// Round size configuration per level
const roundSizes: Record<DifficultyLevel, number[]> = {
  1: [5, 5, 5],
  2: [5, 7, 8],
  3: [7, 8, 10],
};

// State interface
interface GameState {
  cards: {
    leftColumn: GameCard[];
    rightColumn: GameCard[];
  };
  selectedCards: string[];
  progress: GameProgress & {
    currentRound: number;
    showRoundTransition: boolean;
    isPaused: boolean;
  };
  activeMatchAnimations: Set<number>;
  activeFailAnimations: Set<string>;
  currentRandomizedPairs: ExtendedWordPair[];
  nextPairIndex: number;
  wordChunks: ExtendedWordPair[][];
}

// Action types
type GameAction =
  | {
      type: "INITIALIZE_GAME";
      payload: { pairs: ExtendedWordPair[]; level: DifficultyLevel };
    }
  | { type: "SELECT_CARD"; payload: { cardId: string; isLeftColumn: boolean } }
  | { type: "MARK_PAIR_MATCHED"; payload: { pairId: number } }
  | { type: "CLEAR_SELECTED_PAIR"; payload: { cardIds: string[] } }
  | {
      type: "SET_ANIMATION";
      payload: {
        type: "match" | "fail";
        key: string | number;
        active: boolean;
      };
    }
  | { type: "UPDATE_TIMER"; payload: { newTime: number } }
  | { type: "CHANGE_LEVEL"; payload: { level: DifficultyLevel } }
  | { type: "RESET_LEVEL"; payload: { pairs: ExtendedWordPair[] } }
  | { type: "START_NEXT_ROUND" };

function createWordChunks(pairs: ExtendedWordPair[], level: DifficultyLevel): ExtendedWordPair[][] {
  const sizes = roundSizes[level];
  const chunks: ExtendedWordPair[][] = [];
  let startIndex = 0;

  for (const size of sizes) {
    chunks.push(pairs.slice(startIndex, startIndex + size));
    startIndex += size;
  }

  return chunks;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "INITIALIZE_GAME": {
      const { pairs, level } = action.payload;
      const wordChunks = createWordChunks(pairs, level);
      const currentRoundPairs = wordChunks[0];

      return {
        ...state,
        cards: generateGameCards(level, currentRoundPairs),
        progress: {
          ...state.progress,
          currentLevel: level,
          matchedPairsInLevel: 0,
          remainingTime: difficultySettings[level].timeLimit,
          isComplete: false,
          unusedPairs: [],
          currentRound: 1,
          showRoundTransition: false,
          isPaused: false,
        },
        selectedCards: [],
        activeMatchAnimations: new Set(),
        activeFailAnimations: new Set(),
        currentRandomizedPairs: [],
        nextPairIndex: 0,
        wordChunks,
      };
    }

    case "SELECT_CARD": {
      if (state.progress.isPaused) return state;

      const { cardId, isLeftColumn } = action.payload;
      let newSelected = [...state.selectedCards];

      if (state.selectedCards.length % 2 === 1) {
        const lastSelectedCard = [
          ...state.cards.leftColumn,
          ...state.cards.rightColumn,
        ].find(
          (c) => c.id === state.selectedCards[state.selectedCards.length - 1],
        );
        if (!lastSelectedCard) return state;

        const lastSelectedIsLeft = state.cards.leftColumn.some(
          (c) => c.id === lastSelectedCard.id,
        );
        if (isLeftColumn === lastSelectedIsLeft) {
          newSelected = [cardId];
        } else {
          newSelected.push(cardId);
        }
      } else {
        newSelected.push(cardId);
      }

      return {
        ...state,
        selectedCards: newSelected,
      };
    }

    case "MARK_PAIR_MATCHED": {
      const { pairId } = action.payload;
      const currentRoundSize = roundSizes[state.progress.currentLevel][state.progress.currentRound - 1];
      const newMatchedPairs = state.progress.matchedPairsInLevel + 1;
      const roundComplete = newMatchedPairs >= currentRoundSize;
      const isLastRound = state.progress.currentRound === 3;

      // Update cards state
      const updatedCards = {
        leftColumn: state.cards.leftColumn.map((card) =>
          card.pairId === pairId ? { ...card, isMatched: true } : card,
        ),
        rightColumn: state.cards.rightColumn.map((card) =>
          card.pairId === pairId ? { ...card, isMatched: true } : card,
        ),
      };

      return {
        ...state,
        cards: updatedCards,
        progress: {
          ...state.progress,
          matchedPairsInLevel: newMatchedPairs,
          isComplete: roundComplete && isLastRound,
          showRoundTransition: roundComplete && !isLastRound,
          isPaused: roundComplete,
          highestUnlockedLevel: roundComplete && isLastRound
            ? (Math.min(state.progress.currentLevel + 1, 3) as DifficultyLevel)
            : state.progress.highestUnlockedLevel,
        },
      };
    }

    case "START_NEXT_ROUND": {
      const nextRound = state.progress.currentRound + 1;
      const nextRoundPairs = state.wordChunks[nextRound - 1];

      return {
        ...state,
        cards: generateGameCards(state.progress.currentLevel, nextRoundPairs),
        progress: {
          ...state.progress,
          currentRound: nextRound,
          showRoundTransition: false,
          isPaused: false,
          matchedPairsInLevel: 0, // Reset matched pairs for the new round.
        },
        selectedCards: [],
        activeMatchAnimations: new Set(),
        activeFailAnimations: new Set(),
      };
    }

    case "CLEAR_SELECTED_PAIR": {
      const { cardIds } = action.payload;
      return {
        ...state,
        selectedCards: state.selectedCards.filter(
          (id) => !cardIds.includes(id),
        ),
      };
    }

    case "SET_ANIMATION": {
      const { type, key, active } = action.payload;
      if (type === "match") {
        const newAnimations = new Set(state.activeMatchAnimations);
        if (active) {
          newAnimations.add(key as number);
        } else {
          newAnimations.delete(key as number);
        }
        return {
          ...state,
          activeMatchAnimations: newAnimations,
        };
      } else {
        const newAnimations = new Set(state.activeFailAnimations);
        if (active) {
          newAnimations.add(key as string);
        } else {
          newAnimations.delete(key as string);
        }
        return {
          ...state,
          activeFailAnimations: newAnimations,
        };
      }
    }

    case "UPDATE_TIMER": {
      if (state.progress.isPaused) return state;

      return {
        ...state,
        progress: {
          ...state.progress,
          remainingTime: action.payload.newTime,
        },
      };
    }

    case "CHANGE_LEVEL": {
      const { level } = action.payload;
      return {
        ...state,
        progress: {
          ...state.progress,
          currentLevel: level,
          matchedPairsInLevel: 0,
          remainingTime: difficultySettings[level].timeLimit,
          isComplete: false,
          unusedPairs: [],
          currentRound: 1,
          showRoundTransition: false,
          isPaused: false,
        },
        selectedCards: [],
        activeMatchAnimations: new Set(),
        activeFailAnimations: new Set(),
        wordChunks: [],
      };
    }

    case "RESET_LEVEL": {
      const { pairs } = action.payload;
      const wordChunks = createWordChunks(pairs, state.progress.currentLevel);
      const currentRoundPairs = wordChunks[0];

      return {
        ...state,
        cards: generateGameCards(state.progress.currentLevel, currentRoundPairs),
        progress: {
          ...state.progress,
          matchedPairsInLevel: 0,
          remainingTime: difficultySettings[state.progress.currentLevel].timeLimit,
          isComplete: false,
          unusedPairs: [],
          currentRound: 1,
          showRoundTransition: false,
          isPaused: false,
        },
        selectedCards: [],
        activeMatchAnimations: new Set(),
        activeFailAnimations: new Set(),
        wordChunks,
      };
    }

    default:
      return state;
  }
}