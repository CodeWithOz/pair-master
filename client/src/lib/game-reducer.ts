import {
  type GameCard,
  type GameProgress,
  type DifficultyLevel,
  difficultySettings,
  generateGameCards,
  ExtendedWordPair,
  getCurrentRoundPairs,
  isLastRound,
  getTotalRequiredPairsUpToRound,
} from "./game-data";

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
  currentRandomizedPairs: ExtendedWordPair[];
  nextPairIndex: number;
  isFetchingPairs: boolean;
}

// Action types
type GameAction =
  | {
      type: "INITIALIZE_GAME";
      payload: { pairs: ExtendedWordPair[]; level: DifficultyLevel };
    }
  | { type: "SELECT_CARD"; payload: { cardId: string; isLeftColumn: boolean } }
  | { type: "MARK_PAIR_MATCHED"; payload: { pairId: number } }
  | { type: "CLEAR_SELECTED_CARDS"; payload: { cardIds: string[] } }
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
  | { type: "START_NEXT_ROUND" }
  | { type: "SET_FETCHING_PAIRS"; payload: { isFetching: boolean } };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "INITIALIZE_GAME": {
      const { pairs, level } = action.payload;
      const settings = difficultySettings[level];
      const displayCount = settings.displayedPairs;

      // Split pairs into displayed and unused
      const currentRound = 1;
      const roundPairs = pairs.slice(0, getCurrentRoundPairs(level, currentRound));
      const displayedPairs = roundPairs.slice(0, displayCount);
      const remainingPairs = roundPairs.slice(displayCount);

      // Initialize randomized pairs
      const { randomizedPairs, remainingUnused } =
        createRandomizedPairs(remainingPairs);

      return {
        ...state,
        cards: generateGameCards(level, displayedPairs),
        progress: {
          ...state.progress,
          currentLevel: level,
          matchedPairsInLevel: 0,
          roundMatchedPairs: 0,
          currentRound,
          remainingTime: settings.timeLimit,
          isComplete: false,
          unusedPairs: remainingUnused,
          levelPairs: pairs,
          showRoundTransition: false,
          isPaused: false,
        },
        selectedCards: [],
        activeMatchAnimations: new Set(),
        activeFailAnimations: new Set(),
        currentRandomizedPairs: randomizedPairs,
        nextPairIndex: 0,
      };
    }

    case "MARK_PAIR_MATCHED": {
      const { pairId } = action.payload;

      // Update cards state
      let updatedCards = {
        leftColumn: state.cards.leftColumn.map((card) =>
          card.pairId === pairId ? { ...card, isMatched: true } : card,
        ),
        rightColumn: state.cards.rightColumn.map((card) =>
          card.pairId === pairId ? { ...card, isMatched: true } : card,
        ),
      };

      // Get next pair from randomized pairs or create new ones
      const {
        randomizedPair: nextPair,
        currentRandomizedPairs,
        nextPairIndex,
        unusedPairs,
      } = getNextRandomizedPair(state);

      if (nextPair) {
        const newCards = generateGameCards(
          state.progress.currentLevel,
          [nextPair],
          1,
        );
        updatedCards = {
          leftColumn: updatedCards.leftColumn.map((card) =>
            card.isMatched && card.pairId === pairId
              ? newCards.leftColumn[0]
              : card,
          ),
          rightColumn: updatedCards.rightColumn.map((card) =>
            card.isMatched && card.pairId === pairId
              ? newCards.rightColumn[0]
              : card,
          ),
        };
      }

      const newMatchedPairs = state.progress.matchedPairsInLevel + 1;
      const newRoundMatchedPairs = state.progress.roundMatchedPairs + 1;
      const currentRoundRequired = getCurrentRoundPairs(
        state.progress.currentLevel,
        state.progress.currentRound
      );

      const isRoundComplete = newRoundMatchedPairs >= currentRoundRequired;
      const isLastRoundOfLevel = isLastRound(
        state.progress.currentLevel,
        state.progress.currentRound
      );
      const levelComplete = isRoundComplete && isLastRoundOfLevel;

      return {
        ...state,
        cards: updatedCards,
        progress: {
          ...state.progress,
          matchedPairsInLevel: newMatchedPairs,
          roundMatchedPairs: newRoundMatchedPairs,
          showRoundTransition: isRoundComplete,
          isPaused: isRoundComplete,
          isComplete: levelComplete,
          unusedPairs,
          highestUnlockedLevel: levelComplete
            ? (Math.min(state.progress.currentLevel + 1, 3) as DifficultyLevel)
            : state.progress.highestUnlockedLevel,
        },
        currentRandomizedPairs,
        nextPairIndex,
      };
    }

    case "START_NEXT_ROUND": {
      const nextRound = state.progress.currentRound + 1;
      const startIndex = getTotalRequiredPairsUpToRound(
        state.progress.currentLevel,
        state.progress.currentRound
      );
      const pairsForNextRound = getCurrentRoundPairs(
        state.progress.currentLevel,
        nextRound
      );

      // Get pairs for the next round
      const settings = difficultySettings[state.progress.currentLevel];
      const displayCount = settings.displayedPairs;
      const roundPairs = state.progress.levelPairs.slice(startIndex, startIndex + pairsForNextRound);
      const displayedPairs = roundPairs.slice(
        0,
        displayCount
      );
      const remainingPairs = roundPairs.slice(
        displayCount
      );

      // Initialize randomized pairs for the new round
      const { randomizedPairs, remainingUnused } =
        createRandomizedPairs(remainingPairs);

      return {
        ...state,
        cards: generateGameCards(
          state.progress.currentLevel,
          displayedPairs,
          pairsForNextRound
        ),
        progress: {
          ...state.progress,
          currentRound: nextRound,
          roundMatchedPairs: 0,
          showRoundTransition: false,
          isPaused: false,
          unusedPairs: remainingUnused,
        },
        selectedCards: [],
        activeMatchAnimations: new Set(),
        activeFailAnimations: new Set(),
        currentRandomizedPairs: randomizedPairs,
        nextPairIndex: 0,
      };
    }

    case "SELECT_CARD": {
      const { cardId, isLeftColumn } = action.payload;
      let newSelected = [...state.selectedCards];

      // If clicking in same column as an existing selection, replace that selection
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

    case "CLEAR_SELECTED_CARDS": {
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
          unusedPairs: [], // Will be populated when game is initialized
          levelPairs: [], // Will be populated when game is initialized
          roundMatchedPairs: 0,
          currentRound: 1,
          showRoundTransition: false,
          isPaused: false,
        },
        selectedCards: [],
        activeMatchAnimations: new Set(),
        activeFailAnimations: new Set(),
      };
    }

    case "RESET_LEVEL": {
      const { pairs } = action.payload;
      const settings = difficultySettings[state.progress.currentLevel];
      const displayCount = settings.displayedPairs;

      // Split pairs into displayed and unused
      const currentRound = 1;
      const roundPairs = pairs.slice(0, getCurrentRoundPairs(state.progress.currentLevel, currentRound));
      const displayedPairs = roundPairs.slice(0, displayCount);
      const remainingPairs = roundPairs.slice(displayCount);

      // Initialize randomized pairs
      const { randomizedPairs, remainingUnused } =
        createRandomizedPairs(remainingPairs);

      return {
        ...state,
        cards: generateGameCards(state.progress.currentLevel, displayedPairs),
        progress: {
          ...state.progress,
          matchedPairsInLevel: 0,
          remainingTime: settings.timeLimit,
          isComplete: false,
          unusedPairs: remainingUnused,
          levelPairs: pairs,
          roundMatchedPairs: 0,
          currentRound,
          showRoundTransition: false,
          isPaused: false,
        },
        selectedCards: [],
        activeMatchAnimations: new Set(),
        activeFailAnimations: new Set(),
        currentRandomizedPairs: randomizedPairs,
        nextPairIndex: 0,
      };
    }

    case "SET_FETCHING_PAIRS": {
      return {
        ...state,
        isFetchingPairs: action.payload.isFetching,
      };
    }

    default:
      return state;
  }
}

function createRandomizedPairs(unusedPairs: ExtendedWordPair[]): {
  randomizedPairs: ExtendedWordPair[];
  remainingUnused: ExtendedWordPair[];
} {
  if (unusedPairs.length === 0) {
    return { randomizedPairs: [], remainingUnused: [] };
  }

  if (unusedPairs.length === 1) {
    return {
      randomizedPairs: [unusedPairs[0]],
      remainingUnused: unusedPairs.slice(1),
    };
  }

  // Take first two pairs
  const pairsToRandomize = unusedPairs.slice(0, 2);
  const remainingUnused = unusedPairs.slice(2);

  // Create all possible combinations
  const allWords = pairsToRandomize.flatMap((pair) => [
    {
      id: pair.germanWordPairId,
      word: pair.german,
      isGerman: true,
    },
    {
      id: pair.englishWordPairId,
      word: pair.english,
      isGerman: false,
    },
  ]);

  // Reverse the order of cards in one of the languages
  const flipEnglish = Math.random() < 0.5;
  const germanWords = flipEnglish ? allWords.filter((w) => w.isGerman) : allWords.filter((w) => w.isGerman).reverse();
  const englishWords = flipEnglish ? allWords.filter((w) => !w.isGerman).reverse() : allWords.filter((w) => !w.isGerman);

  // Create new pairs
  const randomizedPairs: ExtendedWordPair[] = germanWords.map((german, i) => ({
    id: german.id,
    german: german.word,
    english: englishWords[i].word,
    germanWordPairId: german.id,
    englishWordPairId: englishWords[i].id,
  }));

  return { randomizedPairs, remainingUnused };
}

function getNextRandomizedPair(state: GameState): {
  randomizedPair: ExtendedWordPair | null;
  currentRandomizedPairs: ExtendedWordPair[];
  nextPairIndex: number;
  unusedPairs: ExtendedWordPair[];
} {
  if (state.currentRandomizedPairs.length > state.nextPairIndex) {
    return {
      randomizedPair: state.currentRandomizedPairs[state.nextPairIndex],
      currentRandomizedPairs: state.currentRandomizedPairs,
      nextPairIndex: state.nextPairIndex + 1,
      unusedPairs: state.progress.unusedPairs,
    };
  }

  const { randomizedPairs, remainingUnused } = createRandomizedPairs(
    state.progress.unusedPairs,
  );

  return {
    randomizedPair: randomizedPairs.length > 0 ? randomizedPairs[0] : null,
    currentRandomizedPairs: randomizedPairs,
    nextPairIndex: 1,
    unusedPairs: remainingUnused,
  };
}