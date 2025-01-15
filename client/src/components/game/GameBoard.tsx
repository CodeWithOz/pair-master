import { useReducer, useEffect, useRef, useCallback } from "react";
import { Card } from "./Card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { Home, Settings } from "lucide-react";
import {
  type GameCard,
  type GameProgress,
  type DifficultyLevel,
  difficultySettings,
  getInitialShuffledPairs,
} from "@/lib/game-data";
import { useToast } from "@/hooks/use-toast";
import { DifficultySelector } from "./DifficultySelector";
import { gameReducer } from "@/lib/game-reducer";

// Initial state for game reducer
const initialState = {
  cards: {
    leftColumn: [] as GameCard[],
    rightColumn: [] as GameCard[],
  },
  selectedCards: [] as string[],
  progress: {
    currentLevel: 1 as DifficultyLevel,
    highestUnlockedLevel: 1 as DifficultyLevel,
    matchedPairsInLevel: 0,
    remainingTime: difficultySettings[1].timeLimit,
    isComplete: false,
    unusedPairs: [],
    levelPairs: [],
    currentRound: 1,
    roundMatchedPairs: 0,
    showRoundTransition: false,
    isPaused: false,
  } satisfies GameProgress,
  activeMatchAnimations: new Set<number>(),
  activeFailAnimations: new Set<string>(),
  currentRandomizedPairs: [],
  nextPairIndex: 0,
  isFetchingPairs: false,
  showResetConfirm: false, // New state for reset confirmation dialog
};

// Infer the state type from initialState
type GameState = typeof initialState;

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

  // Timer effect - modified to handle pausing
  useEffect(() => {
    if (
      state.progress.remainingTime <= 0 ||
      state.progress.isComplete ||
      state.progress.isPaused
    )
      return;

    let timeoutId: NodeJS.Timeout;

    const runTimer = () => {
      timeoutId = setTimeout(() => {
        const newTime = state.progress.remainingTime - 1;
        if (newTime <= 0) {
          dispatch({ type: "UPDATE_TIMER", payload: { newTime: 0 } });
        } else {
          dispatch({ type: "UPDATE_TIMER", payload: { newTime } });
          // Schedule next tick if time remaining and not complete
          if (
            newTime > 0 &&
            !state.progress.isComplete &&
            !state.progress.isPaused
          ) {
            runTimer();
          }
        }
      }, 1000);
    };

    runTimer(); // Start the timer

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    state.progress.remainingTime,
    state.progress.isComplete,
    state.progress.isPaused,
    toast,
  ]);

  // Initialize game data
  useEffect(() => {
    const initializeGame = async () => {
      try {
        dispatch({ type: "SET_FETCHING_PAIRS", payload: { isFetching: true } });
        const shuffledPairs = await getInitialShuffledPairs(
          state.progress.currentLevel,
        );

        dispatch({
          type: "INITIALIZE_GAME",
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
      } finally {
        dispatch({ type: "SET_FETCHING_PAIRS", payload: { isFetching: false } });
      }
    };

    initializeGame();
  }, [state.progress.currentLevel, toast]);

  const resetGame = useCallback(async () => {
    try {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();

      dispatch({ type: "SET_FETCHING_PAIRS", payload: { isFetching: true } });
      const shuffledPairs = await getInitialShuffledPairs(
        state.progress.currentLevel,
      );

      dispatch({
        type: "RESET_LEVEL",
        payload: { pairs: shuffledPairs },
      });
    } catch (error) {
      console.error("Error resetting game:", error);
      toast({
        title: "Error",
        description: "Failed to reset the game. Please try again.",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: "SET_FETCHING_PAIRS", payload: { isFetching: false } });
      dispatch({ type: "SET_RESET_CONFIRM", payload: { show: false } }); // Hide dialog after reset
    }
  }, [state.progress.currentLevel, toast]);

  const findCardInColumns = (cardId: string): GameCard | undefined => {
    return [...state.cards.leftColumn, ...state.cards.rightColumn].find(
      (c) => c.id === cardId,
    );
  };

  const isCardInLeftColumn = (cardId: string): boolean => {
    return state.cards.leftColumn.some((card) => card.id === cardId);
  };

  const finalizeCardMatch = (
    pairId: number,
    firstCardId: string,
    secondCardId: string,
    isAfterTransition: boolean,
  ) => {
    dispatch({
      type: "MARK_PAIR_MATCHED",
      payload: { pairId, isAfterTransition },
    });

    dispatch({
      type: "SET_ANIMATION",
      payload: { type: "match", key: pairId, active: false },
    });

    dispatch({
      type: "CLEAR_SELECTED_CARDS",
      payload: { cardIds: [firstCardId, secondCardId] },
    });

    const matchKey = `match-${pairId}`;
    if (timeoutsRef.current.has(matchKey)) {
      clearTimeout(timeoutsRef.current.get(matchKey)!);
    }
    timeoutsRef.current.delete(matchKey);
  };

  const handleCardClick = (cardId: string) => {
    if (
      state.progress.remainingTime <= 0 ||
      state.progress.isComplete ||
      state.progress.isPaused
    )
      return;

    const card = findCardInColumns(cardId);
    if (!card || card.isMatched) return;

    if (state.selectedCards.includes(cardId)) {
      dispatch({
        type: "CLEAR_SELECTED_CARDS",
        payload: { cardIds: [cardId] },
      });
      return;
    }

    const isLeftColumn = isCardInLeftColumn(cardId);
    const selectCardAction = {
      type: "SELECT_CARD" as const,
      payload: { cardId, isLeftColumn },
    };
    dispatch(selectCardAction);

    const nextStateAfterSelectCard = gameReducer(state, selectCardAction);
    if (nextStateAfterSelectCard.selectedCards.length % 2 === 0) {
      const firstId = state.selectedCards[state.selectedCards.length - 1];
      const firstCard = findCardInColumns(firstId);
      const secondCard = card;

      if (!firstCard || !secondCard) return;

      if (firstCard.pairId === secondCard.pairId) {
        // Match found
        dispatch({ type: "INCREMENT_MATCH_COUNT" });

        const matchKey = `match-${firstCard.pairId}`;

        dispatch({
          type: "SET_ANIMATION",
          payload: { type: "match", key: firstCard.pairId, active: true },
        });

        if (timeoutsRef.current.has(matchKey)) {
          clearTimeout(timeoutsRef.current.get(matchKey)!);
        }

        nextStateAfterSelectCard.activeMatchAnimations.forEach(
          (pairId: number) => {
            const firstCardId = nextStateAfterSelectCard.cards.leftColumn.find(
              (c) => c.pairId === pairId,
            )?.id;
            const secondCardId =
              nextStateAfterSelectCard.cards.rightColumn.find(
                (c) => c.pairId === pairId,
              )?.id;
            if (firstCardId && secondCardId) {
              finalizeCardMatch(pairId, firstCardId, secondCardId, false);
            }
          },
        );

        const numRequiredMatchesRemaining = difficultySettings[state.progress.currentLevel].roundPairs[
          state.progress.currentRound - 1
        ] - (state.progress.roundMatchedPairs + 1);
        const animationDuration =
          numRequiredMatchesRemaining >= 5
            ? 3000
            : 1000;
        const timeoutId = setTimeout(
          finalizeCardMatch,
          animationDuration,
          firstCard.pairId,
          firstId,
          cardId,
          true,
        );

        timeoutsRef.current.set(matchKey, timeoutId);
      } else {
        // No match
        const failKey = `fail_${firstId}_${cardId}`;

        dispatch({
          type: "SET_ANIMATION",
          payload: { type: "fail", key: failKey, active: true },
        });

        if (timeoutsRef.current.has(failKey)) {
          clearTimeout(timeoutsRef.current.get(failKey)!);
        }

        const timeoutId = setTimeout(() => {
          dispatch({
            type: "SET_ANIMATION",
            payload: { type: "fail", key: failKey, active: false },
          });

          dispatch({
            type: "CLEAR_SELECTED_CARDS",
            payload: { cardIds: [firstId, cardId] },
          });

          timeoutsRef.current.delete(failKey);
        }, 500);

        timeoutsRef.current.set(failKey, timeoutId);
      }
    }
  };

  const handleLevelSelect = (level: DifficultyLevel) => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current.clear();

    dispatch({
      type: "CHANGE_LEVEL",
      payload: { level },
    });
  };

  const handleContinue = () => {
    dispatch({ type: "START_NEXT_ROUND" });
  };

  const getIsFailAnimation = (cardId: string): boolean => {
    return Array.from(state.activeFailAnimations).some((key) => {
      const [, id1, id2] = key.split("_");
      return cardId === id1 || cardId === id2;
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
          size="icon"
          className="rounded-full shadow-[0_0_0_1px_hsl(var(--border))]"
        >
          <Home className="h-6 w-6" />
        </Button>
        <div className="text-2xl font-bold">
          {formatTime(state.progress.remainingTime)}
        </div>
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
        <div className="text-sm text-gray-600">
          Round {state.progress.currentRound}/3 - Matches:{" "}
          {state.progress.roundMatchedPairs}/
          {
            difficultySettings[state.progress.currentLevel].roundPairs[
              state.progress.currentRound - 1
            ]
          }
        </div>
        <div className="text-xs text-gray-500">
          Total Matches: {state.progress.matchedPairsInLevel}/
          {difficultySettings[state.progress.currentLevel].getNumRequiredPairs()}
        </div>
      </div>

      <div className="relative max-w-2xl mx-auto mb-8">
        {/* Round transition and time's up overlays */}
        {!state.isFetchingPairs && (state.progress.showRoundTransition || state.progress.remainingTime <= 0) && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg">
            <p className={`text-2xl font-bold mb-2 ${state.progress.remainingTime <= 0 ? "text-red-600" : "text-green-600"}`}>
              {state.progress.remainingTime <= 0
                ? "You ran out of time!"
                : state.progress.isComplete
                ? "Congratulations!"
                : "Nice work so far!"}
            </p>
            <p className="text-lg text-gray-900">
              {state.progress.remainingTime <= 0
                ? "Try again or select a different level"
                : state.progress.isComplete
                ? "You beat this level!"
                : "Ready to continue?"}
            </p>
          </div>
        )}

        {/* Loading overlay */}
        {state.isFetchingPairs && (
          <div className="bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center h-40 w-full">
            <p className="text-lg text-gray-900">Loading...</p>
          </div>
        )}

        {/* Game grid */}
        {!state.isFetchingPairs && (
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
        )}
      </div>

      {/* Reset confirmation dialog */}
      <Dialog
        open={state.showResetConfirm}
        onOpenChange={(open) => {
          dispatch({ type: "SET_RESET_CONFIRM", payload: { show: open } });
          dispatch({ type: "SET_PAUSE", payload: { isPaused: open } });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Level</DialogTitle>
            <DialogDescription>
              You will lose your progress... are you sure you want to reset the
              level?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-4">
            <Button
              variant="secondary"
              className="bg-black text-white hover:bg-black/90"
              onClick={() => {
                dispatch({ type: "SET_RESET_CONFIRM", payload: { show: false } });
                dispatch({ type: "SET_PAUSE", payload: { isPaused: false } });
              }}
            >
              Go back
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={resetGame}
            >
              Reset Level
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-8">
        {!state.isFetchingPairs && (
          <div className="flex justify-center gap-4">
            {state.progress.showRoundTransition ? (
              state.progress.isComplete ? (
                <>
                  {state.progress.currentLevel < 3 && (
                    <Button
                      onClick={() =>
                        handleLevelSelect(
                          (state.progress.currentLevel + 1) as DifficultyLevel,
                        )
                      }
                    >
                      Next Level
                    </Button>
                  )}
                  <Button
                    onClick={resetGame}
                  >
                    Reset Level
                  </Button>
                </>
              ) : (
                <Button onClick={handleContinue}>Continue</Button>
              )
            ) : (
              <Button
                onClick={() => {
                  if (state.progress.remainingTime <= 0) {
                    resetGame();
                  } else {
                    dispatch({ type: "SET_PAUSE", payload: { isPaused: true } });
                    dispatch({
                      type: "SET_RESET_CONFIRM",
                      payload: { show: true },
                    })
                  }
                }}
              >
                Reset Level
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}