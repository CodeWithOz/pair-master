import { type GameCard, type GameProgress, type DifficultyLevel, type WordPair, difficultySettings, generateGameCards, prepareCrossPairs } from "./game-data";

// State interface
interface GameState {
  cards: {
    leftColumn: GameCard[];
    rightColumn: GameCard[];
  };
  selectedCards: string[];
  progress: GameProgress;
  activeMatchAnimations: Set<number>;
  activeFailAnimations: Set<string>;
  nextPreparedPair: {
    id: number;
    german: string;
    english: string;
  } | null;
}

// Action types
type GameAction =
  | { type: 'INITIALIZE_GAME'; payload: { pairs: WordPair[]; level: DifficultyLevel } }
  | { type: 'SELECT_CARD'; payload: { cardId: string; isLeftColumn: boolean } }
  | { type: 'MARK_PAIR_MATCHED'; payload: { pairId: number } }
  | { type: 'CLEAR_SELECTED_PAIR'; payload: { cardIds: string[] } }
  | { type: 'SET_ANIMATION'; payload: { type: 'match' | 'fail'; key: string | number; active: boolean } }
  | { type: 'UPDATE_TIMER'; payload: { newTime: number } }
  | { type: 'CHANGE_LEVEL'; payload: { level: DifficultyLevel } }
  | { type: 'RESET_LEVEL'; payload: { pairs: WordPair[] } };

const initialState: GameState = {
  cards: {
    leftColumn: [],
    rightColumn: [],
  },
  selectedCards: [],
  progress: {
    currentLevel: 1 as DifficultyLevel,
    highestUnlockedLevel: 1 as DifficultyLevel,
    matchedPairsInLevel: 0,
    remainingTime: difficultySettings[1].timeLimit,
    isComplete: false,
    unusedPairs: [],
  },
  activeMatchAnimations: new Set<number>(),
  activeFailAnimations: new Set<string>(),
  nextPreparedPair: null,
};

export function gameReducer(state: GameState = initialState, action: GameAction): GameState {
  switch (action.type) {
    case 'INITIALIZE_GAME': {
      const { pairs, level } = action.payload;
      const settings = difficultySettings[level];
      const displayCount = settings.displayedPairs;

      // Split pairs into displayed and unused
      const displayedPairs = pairs.slice(0, displayCount);
      const remainingPairs = pairs.slice(displayCount);

      // Prepare the first cross-pair if we have unused pairs
      const nextPreparedPair = remainingPairs.length > 0
        ? prepareCrossPairs(remainingPairs).currentPair
        : null;

      return {
        ...state,
        cards: generateGameCards(level, displayedPairs),
        progress: {
          ...state.progress,
          currentLevel: level,
          matchedPairsInLevel: 0,
          remainingTime: settings.timeLimit,
          isComplete: false,
          unusedPairs: remainingPairs,
        },
        selectedCards: [],
        activeMatchAnimations: new Set(),
        activeFailAnimations: new Set(),
        nextPreparedPair,
      };
    }

    case 'MARK_PAIR_MATCHED': {
      const { pairId } = action.payload;
      const settings = difficultySettings[state.progress.currentLevel];

      // Update cards state
      let updatedCards = {
        leftColumn: state.cards.leftColumn.map(card =>
          card.pairId === pairId ? { ...card, isMatched: true } : card
        ),
        rightColumn: state.cards.rightColumn.map(card =>
          card.pairId === pairId ? { ...card, isMatched: true } : card
        ),
      };

      // Handle pair replacement
      let nextPreparedPair = state.nextPreparedPair;
      let unusedPairs = state.progress.unusedPairs;

      if (state.nextPreparedPair) {
        // Use the previously prepared pair
        const newCards = generateGameCards(
          state.progress.currentLevel,
          [state.nextPreparedPair],
          1
        );

        // Update the cards with the new pair
        updatedCards = {
          leftColumn: updatedCards.leftColumn.map(card =>
            card.isMatched && card.pairId === pairId ? newCards.leftColumn[0] : card
          ),
          rightColumn: updatedCards.rightColumn.map(card =>
            card.isMatched && card.pairId === pairId ? newCards.rightColumn[0] : card
          ),
        };

        // Prepare next pairs if we have more unused pairs
        if (unusedPairs.length >= 2) {
          const crossPairResult = prepareCrossPairs(unusedPairs);
          nextPreparedPair = crossPairResult.nextPair;
          // Remove the used pairs from unused pairs
          unusedPairs = unusedPairs.slice(2);
        } else if (unusedPairs.length === 1) {
          // If only one pair left, use it as-is
          nextPreparedPair = {
            id: unusedPairs[0].id,
            german: unusedPairs[0].german,
            english: unusedPairs[0].english,
          };
          unusedPairs = [];
        } else {
          nextPreparedPair = null;
        }
      }

      const newMatchedPairs = state.progress.matchedPairsInLevel + 1;
      const levelComplete = newMatchedPairs >= settings.requiredPairs;

      return {
        ...state,
        cards: updatedCards,
        progress: {
          ...state.progress,
          matchedPairsInLevel: newMatchedPairs,
          isComplete: levelComplete,
          unusedPairs,
          highestUnlockedLevel: levelComplete
            ? (Math.min(state.progress.currentLevel + 1, 3) as DifficultyLevel)
            : state.progress.highestUnlockedLevel,
        },
        nextPreparedPair,
      };
    }

    case 'SELECT_CARD': {
      const { cardId, isLeftColumn } = action.payload;
      let newSelected = [...state.selectedCards];

      // If clicking in same column as an existing selection, replace that selection
      if (state.selectedCards.length % 2 === 1) {
        const lastSelectedCard = [...state.cards.leftColumn, ...state.cards.rightColumn].find(
          c => c.id === state.selectedCards[state.selectedCards.length - 1]
        );
        if (!lastSelectedCard) return state;

        const lastSelectedIsLeft = state.cards.leftColumn.some(c => c.id === lastSelectedCard.id);
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

    case 'CLEAR_SELECTED_PAIR': {
      const { cardIds } = action.payload;
      return {
        ...state,
        selectedCards: state.selectedCards.filter(id => !cardIds.includes(id)),
      };
    }

    case 'SET_ANIMATION': {
      const { type, key, active } = action.payload;
      if (type === 'match') {
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

    case 'UPDATE_TIMER': {
      return {
        ...state,
        progress: {
          ...state.progress,
          remainingTime: action.payload.newTime,
        },
      };
    }

    case 'CHANGE_LEVEL': {
      const { level } = action.payload;
      return {
        ...state,
        progress: {
          ...state.progress,
          currentLevel: level,
          matchedPairsInLevel: 0,
          remainingTime: difficultySettings[level].timeLimit,
          isComplete: false,
          unusedPairs: [], // Will be populated when game is initialized
        },
        selectedCards: [],
        activeMatchAnimations: new Set(),
        activeFailAnimations: new Set(),
        nextPreparedPair: null,
      };
    }

    case 'RESET_LEVEL': {
      const { pairs } = action.payload;
      const settings = difficultySettings[state.progress.currentLevel];
      const displayCount = settings.displayedPairs;

      // Split pairs into displayed and unused
      const displayedPairs = pairs.slice(0, displayCount);
      const remainingPairs = pairs.slice(displayCount);

      return {
        ...state,
        cards: generateGameCards(state.progress.currentLevel, displayedPairs),
        progress: {
          ...state.progress,
          matchedPairsInLevel: 0,
          remainingTime: settings.timeLimit,
          isComplete: false,
          unusedPairs: remainingPairs,
        },
        selectedCards: [],
        activeMatchAnimations: new Set(),
        activeFailAnimations: new Set(),
        nextPreparedPair: null,
      };
    }

    default:
      return state;
  }
}