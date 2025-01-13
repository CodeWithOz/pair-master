import { useReducer, useEffect, useRef, useCallback } from "react";
import { Card } from "./Card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Home, Settings } from "lucide-react";
import {
  type GameCard,
  type DifficultyLevel,
  difficultySettings,
  getInitialShuffledPairs,
} from "@/lib/game-data";
import { useToast } from "@/hooks/use-toast";
import { DifficultySelector } from "./DifficultySelector";
import { gameReducer } from "@/lib/game-reducer";

// Initial state
const initialState = {
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
    currentRound: 1,
    showRoundTransition: false,
    isPaused: false,
  },
  activeMatchAnimations: new Set<number>(),
  activeFailAnimations: new Set<string>(),
  currentRandomizedPairs: [],
  nextPairIndex: 0,
  wordChunks: [],
};

export function GameBoard() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { toast } = useToast();
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [, setLocation] = useLocation();

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (state.progress.remainingTime <= 0 || state.progress.isComplete || state.progress.isPaused) return;

    let timeoutId: NodeJS.Timeout;

    const runTimer = () => {
      timeoutId = setTimeout(() => {
        const newTime = state.progress.remainingTime - 1;
        if (newTime <= 0) {
          toast({
            title: "Time's Up!",
            description: "Try again or select a different level.",
          });
          dispatch({ type: 'UPDATE_TIMER', payload: { newTime: 0 } });
        } else {
          dispatch({ type: 'UPDATE_TIMER', payload: { newTime } });
          // Schedule next tick if time remaining and not complete
          if (newTime > 1 && !state.progress.isComplete && !state.progress.isPaused) {
            runTimer();
          }
        }
      }, 1000);
    };

    runTimer(); // Start the timer

    return () => {
      clearTimeout(timeoutId);
    };
  }, [state.progress.remainingTime, state.progress.isComplete, state.progress.isPaused, toast]);

  // Initialize game data
  useEffect(() => {
    const initializeGame = async () => {
      try {
        const shuffledPairs = await getInitialShuffledPairs(
          state.progress.currentLevel,
        );

        dispatch({
          type: 'INITIALIZE_GAME',
          payload: {
            pairs: shuffledPairs,
            level: state.progress.currentLevel,
          },
        });
      } catch (error) {
        console.error("Error initializing game:", error);
        toast({
          title: "Error",
          description: "Failed to load word pairs. Please try again.",
          variant: "destructive",
        });
      }
    };

    initializeGame();
  }, [state.progress.currentLevel, toast]);

  const resetGame = useCallback(async () => {
    try {
      // Clear all existing timeouts
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();

      const shuffledPairs = await getInitialShuffledPairs(
        state.progress.currentLevel,
      );

      dispatch({
        type: 'RESET_LEVEL',
        payload: { pairs: shuffledPairs },
      });
    } catch (error) {
      console.error("Error resetting game:", error);
      toast({
        title: "Error",
        description: "Failed to reset the game. Please try again.",
        variant: "destructive",
      });
    }
  }, [state.progress.currentLevel, toast]);

  const handleContinue = () => {
    dispatch({ type: 'START_NEXT_ROUND' });
  };

  const handleCardClick = (cardId: string) => {
    if (state.progress.remainingTime <= 0 || state.progress.isComplete || state.progress.isPaused) return;

    const card = findCardInColumns(cardId);
    if (!card || card.isMatched || state.selectedCards.includes(cardId)) return;

    const isLeftColumn = isCardInLeftColumn(cardId);
    dispatch({
      type: 'SELECT_CARD',
      payload: { cardId, isLeftColumn },
    });

    if (state.selectedCards.length % 2 === 1) {
      const firstId = state.selectedCards[state.selectedCards.length - 1];
      const firstCard = findCardInColumns(firstId);
      const secondCard = card;

      if (!firstCard || !secondCard) return;

      if (firstCard.pairId === secondCard.pairId) {
        // Match found
        const matchKey = `match-${firstCard.pairId}`;

        // Add to active animations
        dispatch({
          type: 'SET_ANIMATION',
          payload: { type: 'match', key: firstCard.pairId, active: true },
        });

        // Clear any existing timeout for this match
        if (timeoutsRef.current.has(matchKey)) {
          clearTimeout(timeoutsRef.current.get(matchKey));
        }

        // Mark pair as matched
        dispatch({
          type: 'MARK_PAIR_MATCHED',
          payload: { pairId: firstCard.pairId },
        });

        // Clear selected cards after transition timeout
        const timeoutId = setTimeout(() => {
          dispatch({
            type: 'SET_ANIMATION',
            payload: { type: 'match', key: firstCard.pairId, active: false },
          });

          dispatch({
            type: 'CLEAR_SELECTED_PAIR',
            payload: { cardIds: [firstId, cardId] },
          });

          timeoutsRef.current.delete(matchKey);
        }, 1000);

        timeoutsRef.current.set(matchKey, timeoutId);
      } else {
        // No match
        const failKey = `fail_${firstId}_${cardId}`;

        dispatch({
          type: 'SET_ANIMATION',
          payload: { type: 'fail', key: failKey, active: true },
        });

        if (timeoutsRef.current.has(failKey)) {
          clearTimeout(timeoutsRef.current.get(failKey));
        }

        const timeoutId = setTimeout(() => {
          dispatch({
            type: 'SET_ANIMATION',
            payload: { type: 'fail', key: failKey, active: false },
          });

          dispatch({
            type: 'CLEAR_SELECTED_PAIR',
            payload: { cardIds: [firstId, cardId] },
          });

          timeoutsRef.current.delete(failKey);
        }, 1000);

        timeoutsRef.current.set(failKey, timeoutId);
      }
    }
  };

  const findCardInColumns = (cardId: string): GameCard | undefined => {
    return [...state.cards.leftColumn, ...state.cards.rightColumn].find(
      (c) => c.id === cardId,
    );
  };

  const isCardInLeftColumn = (cardId: string): boolean => {
    return state.cards.leftColumn.some((card) => card.id === cardId);
  };

  const getIsFailAnimation = (cardId: string): boolean => {
    return Array.from(state.activeFailAnimations).some(key => {
      const [_, id1, id2] = key.split('_');
      return cardId === id1 || cardId === id2;
    });
  }

  const handleLevelSelect = (level: DifficultyLevel) => {
    // Clear all existing timeouts when changing levels
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current.clear();

    dispatch({
      type: 'CHANGE_LEVEL',
      payload: { level },
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 max-w-2xl mx-auto flex justify-between items-center">
        <Button 
          onClick={() => setLocation("/")} 
          variant="ghost"
          className="shadow-[0_0_0_1px_hsl(var(--border))]"
        >
          <Home className="h-6 w-6 inline-block mr-2"/> Home
        </Button>
        <Button
          onClick={() => setLocation("/manage-words")}
          variant="ghost"
          size="icon"
          className="rounded-full shadow-[0_0_0_1px_hsl(var(--border))]"
        >
          <Settings className="h-6 w-6" />
        </Button>
      </div>
      <DifficultySelector
        progress={state.progress}
        onSelectLevel={handleLevelSelect}
      />
      <div className="text-center mb-4">
        <div className="text-2xl font-bold">
          Time: {formatTime(state.progress.remainingTime)}
        </div>
        <div className="text-sm text-gray-600">
          Round {state.progress.currentRound}/3 - Matches: {state.progress.matchedPairsInLevel}/
          {state.progress.currentRound === 3 
            ? difficultySettings[state.progress.currentLevel].requiredPairs 
            : state.wordChunks[state.progress.currentRound - 1]?.length || 0}
        </div>
      </div>
      <div className="relative max-w-2xl mx-auto mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            {state.cards.leftColumn.map((card) => (
              <Card
                key={card.id}
                word={card.word}
                isMatched={card.isMatched}
                isSelected={state.selectedCards.includes(card.id)}
                isMatchAnimation={state.activeMatchAnimations.has(card.pairId)}
                isFailAnimation={getIsFailAnimation(card.id)}
                onClick={() => handleCardClick(card.id)}
              />
            ))}
          </div>
          <div className="space-y-4">
            {state.cards.rightColumn.map((card) => (
              <Card
                key={card.id}
                word={card.word}
                isMatched={card.isMatched}
                isSelected={state.selectedCards.includes(card.id)}
                isMatchAnimation={state.activeMatchAnimations.has(card.pairId)}
                isFailAnimation={getIsFailAnimation(card.id)}
                onClick={() => handleCardClick(card.id)}
              />
            ))}
          </div>
        </div>

        {/* Round Transition Overlay */}
        {(state.progress.showRoundTransition || state.progress.isComplete) && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center rounded-lg">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {state.progress.isComplete ? "Congratulations!" : "Nice work so far!"}
            </div>
            <div className="text-xl text-gray-800">
              {state.progress.isComplete ? "You beat this level!" : "Ready to continue?"}
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-center gap-4">
        {state.progress.showRoundTransition ? (
          <Button onClick={handleContinue}>Continue</Button>
        ) : (
          <Button onClick={resetGame}>Reset Level</Button>
        )}
      </div>
    </div>
  );
}