import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "./Card";
import { Button } from "@/components/ui/button";
import {
  generateGameCards,
  getInitialShuffledPairs,
  type GameCard,
  type GameProgress,
  type DifficultyLevel,
  type WordPair,
  canUnlockNextLevel,
  difficultySettings,
} from "@/lib/game-data";
import { useToast } from "@/hooks/use-toast";
import { DifficultySelector } from "./DifficultySelector";

interface ColumnCards {
  leftColumn: GameCard[];
  rightColumn: GameCard[];
}

export function GameBoard() {
  const [cards, setCards] = useState<ColumnCards>({
    leftColumn: [],
    rightColumn: [],
  });
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [progress, setProgress] = useState<GameProgress>({
    currentLevel: 1 as DifficultyLevel,
    highestUnlockedLevel: 1 as DifficultyLevel,
    matchedPairsInLevel: 0,
    remainingTime: difficultySettings[1].timeLimit,
    isComplete: false,
    unusedPairs: [], // Initialize as empty array, will be populated in useEffect
  });
  const [activeMatchAnimations, setActiveMatchAnimations] = useState<Set<number>>(new Set());
  const [activeFailAnimations, setActiveFailAnimations] = useState<Set<string>>(new Set());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const { toast } = useToast();

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (progress.remainingTime <= 0 || progress.isComplete) return;

    let timeoutId: NodeJS.Timeout;

    const runTimer = () => {
      timeoutId = setTimeout(() => {
        setProgress((prev) => {
          const newTime = prev.remainingTime - 1;
          if (newTime <= 0) {
            toast({
              title: "Time's Up!",
              description: "Try again or select a different level.",
            });
            return { ...prev, remainingTime: 0 };
          }
          return { ...prev, remainingTime: newTime };
        });

        // Schedule next tick if time remaining and not complete
        if (progress.remainingTime > 1 && !progress.isComplete) {
          runTimer();
        }
      }, 1000);
    };

    runTimer(); // Start the timer

    return () => {
      clearTimeout(timeoutId);
    };
  }, [progress.remainingTime, progress.isComplete, toast]);

  // Initialize game data
  useEffect(() => {
    const initializeGame = async () => {
      try {
        const shuffledPairs = await getInitialShuffledPairs(
          progress.currentLevel,
        );
        const settings = difficultySettings[progress.currentLevel];
        const displayCount = settings.displayedPairs;

        // Split pairs into displayed and unused
        const displayedPairs = shuffledPairs.slice(0, displayCount);
        const remainingPairs = shuffledPairs.slice(displayCount);

        setProgress((prev) => ({
          ...prev,
          unusedPairs: remainingPairs,
        }));

        // Generate initial cards from the first few pairs
        setCards(generateGameCards(progress.currentLevel, displayedPairs));
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
  }, [progress.currentLevel, toast]);

  const resetGame = useCallback(async () => {
    try {
      // Clear all existing timeouts
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();

      const settings = difficultySettings[progress.currentLevel];
      const shuffledPairs = await getInitialShuffledPairs(
        progress.currentLevel,
      );
      const displayCount = settings.displayedPairs;

      // Split pairs into displayed and unused
      const displayedPairs = shuffledPairs.slice(0, displayCount);
      const remainingPairs = shuffledPairs.slice(displayCount);

      setProgress((prev) => ({
        ...prev,
        remainingTime: settings.timeLimit,
        matchedPairsInLevel: 0,
        isComplete: false,
        unusedPairs: remainingPairs,
      }));

      // Generate initial cards from the first few pairs
      setCards(generateGameCards(progress.currentLevel, displayedPairs));
      setSelectedCards([]);
      setActiveMatchAnimations(new Set());
      setActiveFailAnimations(new Set());
    } catch (error) {
      console.error("Error resetting game:", error);
      toast({
        title: "Error",
        description: "Failed to reset the game. Please try again.",
        variant: "destructive",
      });
    }
  }, [progress.currentLevel, toast]);

  const findCardInColumns = (cardId: string): GameCard | undefined => {
    return [...cards.leftColumn, ...cards.rightColumn].find(
      (c) => c.id === cardId,
    );
  };

  const isCardInLeftColumn = (cardId: string): boolean => {
    return cards.leftColumn.some((card) => card.id === cardId);
  };

  const handleCardClick = (cardId: string) => {
    if (progress.remainingTime <= 0 || progress.isComplete) return;

    const card = findCardInColumns(cardId);
    if (!card || card.isMatched || selectedCards.includes(cardId)) return;

    const isLeftColumn = isCardInLeftColumn(cardId);
    let newSelected = [...selectedCards];

    // If clicking in same column as an existing selection, replace that selection
    if (selectedCards.length % 2 === 1) {
      const existingCard = findCardInColumns(selectedCards[selectedCards.length - 1]);
      if (!existingCard) return;

      const existingIsLeft = isCardInLeftColumn(existingCard.id);

      if (isLeftColumn === existingIsLeft) {
        newSelected = [cardId];
      } else {
        newSelected.push(cardId);
      }
    } else {
      newSelected.push(cardId);
    }

    setSelectedCards(newSelected);

    if (newSelected.length % 2 === 0) {
      const [firstId, secondId] = newSelected.slice(newSelected.length - 2);
      const firstCard = findCardInColumns(firstId);
      const secondCard = findCardInColumns(secondId);

      if (!firstCard || !secondCard) return;

      if (firstCard.pairId === secondCard.pairId) {
        // Match found
        const matchKey = `match-${firstCard.pairId}`;

        // Add to active animations
        setActiveMatchAnimations((prev) => {
          const newSet = new Set(prev);
          newSet.add(firstCard.pairId);
          return newSet;
        });

        // Clear any existing timeout for this match
        if (timeoutsRef.current.has(matchKey)) {
          clearTimeout(timeoutsRef.current.get(matchKey));
        }

        // Start match transition
        const timeoutId = setTimeout(() => {
          const newMatchedPairs = progress.matchedPairsInLevel + 1;
          const settings = difficultySettings[progress.currentLevel];
          const levelComplete = newMatchedPairs >= settings.requiredPairs;

          // Get the next pair from unusedPairs if needed
          const nextPair = !levelComplete ? progress.unusedPairs[0] : null;
          console.log("nextPair", nextPair);

          // Update both cards and progress state in a single render cycle
          setCards((current) => {
            // First mark cards as matched
            const updatedCards = {
              leftColumn: current.leftColumn.map((card) =>
                card.pairId === firstCard.pairId
                  ? { ...card, isMatched: true }
                  : card,
              ),
              rightColumn: current.rightColumn.map((card) =>
                card.pairId === firstCard.pairId
                  ? { ...card, isMatched: true }
                  : card,
              ),
            };

            // If level isn't complete and we have a next pair, replace matched cards
            if (!levelComplete && nextPair) {
              const newCards = generateGameCards(
                progress.currentLevel,
                [nextPair],
                1
              );

              return {
                leftColumn: updatedCards.leftColumn.map((card) =>
                  card.isMatched && card.pairId === firstCard.pairId ? newCards.leftColumn.shift() || card : card,
                ),
                rightColumn: updatedCards.rightColumn.map((card) =>
                  card.isMatched && card.pairId === firstCard.pairId ? newCards.rightColumn.shift() || card : card,
                ),
              };
            }

            return updatedCards;
          });

          // Update progress state
          setProgress((prev) => ({
            ...prev,
            unusedPairs: !!console.log("in setProgress", prev.unusedPairs) || !levelComplete ? prev.unusedPairs.slice(1) : prev.unusedPairs,
            matchedPairsInLevel: newMatchedPairs,
            isComplete: levelComplete,
            highestUnlockedLevel:
              levelComplete &&
              canUnlockNextLevel({
                ...prev,
                matchedPairsInLevel: newMatchedPairs,
                isComplete: levelComplete,
              })
                ? (Math.min(prev.currentLevel + 1, 3) as DifficultyLevel)
                : prev.highestUnlockedLevel,
          }));

          // Remove the match animation
          setActiveMatchAnimations((prev) => {
            const newSet = new Set(prev);
            newSet.delete(firstCard.pairId);
            return newSet;
          });

          setSelectedCards((prev) => prev.filter((cardId) => cardId !== firstId && cardId !== secondId));

          // Clean up the timeout reference
          timeoutsRef.current.delete(matchKey);
        }, 1000);

        // Store the timeout reference
        timeoutsRef.current.set(matchKey, timeoutId);
      } else {
        // No match
        const failKey = `fail_${firstId}_${secondId}`;

        setActiveFailAnimations((prev) => {
          const newSet = new Set(prev);
          newSet.add(failKey);
          return newSet;
        });

        // Clear any existing timeout for this fail animation
        if (timeoutsRef.current.has(failKey)) {
          clearTimeout(timeoutsRef.current.get(failKey));
        }

        const timeoutId = setTimeout(() => {
          setActiveFailAnimations((prev) => {
            const newSet = new Set(prev);
            newSet.delete(failKey);
            return newSet;
          });
          setSelectedCards((prev) => prev.filter((cardId) => cardId !== firstId && cardId !== secondId));

          // Clean up the timeout reference
          timeoutsRef.current.delete(failKey);
        }, 1000);

        // Store the timeout reference
        timeoutsRef.current.set(failKey, timeoutId);
      }
    }
  };

  const getIsFailAnimation = (cardId: string): boolean => {
    return Array.from(activeFailAnimations).some(key => {
      const [_, id1, id2] = key.split('_');
      return cardId === id1 || cardId === id2;
    });
  }

  const handleLevelSelect = (level: DifficultyLevel) => {
    // Clear all existing timeouts when changing levels
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current.clear();

    setProgress((prev) => ({
      ...prev,
      currentLevel: level,
      matchedPairsInLevel: 0,
      remainingTime: difficultySettings[level].timeLimit,
      isComplete: false,
      unusedPairs: [], // Reset unused pairs, will be populated by useEffect
    }));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <DifficultySelector
        progress={progress}
        onSelectLevel={handleLevelSelect}
      />
      <div className="text-center mb-4">
        <div className="text-2xl font-bold">
          Time: {formatTime(progress.remainingTime)}
        </div>
        <div className="text-sm text-gray-600">
          Matches: {progress.matchedPairsInLevel}/
          {difficultySettings[progress.currentLevel].requiredPairs}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
        <div className="space-y-4">
          {cards.leftColumn.map((card) => (
            <Card
              key={card.id}
              word={card.word}
              isMatched={card.isMatched}
              isSelected={selectedCards.includes(card.id)}
              isMatchAnimation={activeMatchAnimations.has(card.pairId)}
              isFailAnimation={getIsFailAnimation(card.id)}
              onClick={() => handleCardClick(card.id)}
            />
          ))}
        </div>
        <div className="space-y-4">
          {cards.rightColumn.map((card) => (
            <Card
              key={card.id}
              word={card.word}
              isMatched={card.isMatched}
              isSelected={selectedCards.includes(card.id)}
              isMatchAnimation={activeMatchAnimations.has(card.pairId)}
              isFailAnimation={getIsFailAnimation(card.id)}
              onClick={() => handleCardClick(card.id)}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-4">
        <Button onClick={() => resetGame()}>Reset Level</Button>
      </div>
    </div>
  );
}