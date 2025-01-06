import { useState, useEffect, useCallback } from "react";
import { Card } from "./Card";
import { Button } from "@/components/ui/button";
import { 
  generateGameCards, 
  type GameCard, 
  type GameProgress,
  type DifficultyLevel,
  canUnlockNextLevel,
  difficultySettings
} from "@/lib/game-data";
import { useToast } from "@/hooks/use-toast";
import { DifficultySelector } from "./DifficultySelector";

interface ColumnCards {
  leftColumn: GameCard[];
  rightColumn: GameCard[];
}

export function GameBoard() {
  const [cards, setCards] = useState<ColumnCards>({ leftColumn: [], rightColumn: [] });
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [progress, setProgress] = useState<GameProgress>({
    currentLevel: 1 as DifficultyLevel,
    highestUnlockedLevel: 1 as DifficultyLevel,
    matchedPairsInLevel: 0,
    remainingTime: difficultySettings[1].timeLimit,
    isComplete: false
  });
  const [matchingCards, setMatchingCards] = useState<Set<string>>(new Set());
  const [usedPairIds, setUsedPairIds] = useState<number[]>([]);
  const { toast } = useToast();

  // Timer effect using setTimeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const tickTimer = () => {
      if (progress.remainingTime <= 0 || progress.isComplete) return;

      setProgress(prev => {
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

      timeoutId = setTimeout(tickTimer, 1000);
    };

    timeoutId = setTimeout(tickTimer, 1000);

    return () => clearTimeout(timeoutId);
  }, [progress.remainingTime, progress.isComplete, toast]);

  // Reset game when changing levels
  useEffect(() => {
    resetGame();
  }, [progress.currentLevel]);

  const resetGame = () => {
    const settings = difficultySettings[progress.currentLevel];
    setCards(generateGameCards(progress.currentLevel));
    setSelectedCards([]);
    setMatchingCards(new Set());
    setUsedPairIds([]);
    setProgress(prev => ({
      ...prev,
      remainingTime: settings.timeLimit,
      matchedPairsInLevel: 0,
      isComplete: false
    }));
  };

  const findCardInColumns = (cardId: string): GameCard | undefined => {
    return [...cards.leftColumn, ...cards.rightColumn].find(c => c.id === cardId);
  };

  const isCardInLeftColumn = (cardId: string): boolean => {
    return cards.leftColumn.some(card => card.id === cardId);
  };

  const replaceMatchedCards = useCallback(() => {
    // Get matched pair IDs from current set of cards
    const allMatchedPairIds = [...cards.leftColumn, ...cards.rightColumn]
      .filter(card => card.isMatched)
      .map(card => card.pairId);

    // Update used pairs
    setUsedPairIds(prev => [...prev, ...allMatchedPairIds]);

    // Get new cards excluding all used pairs
    const newCards = generateGameCards(progress.currentLevel, usedPairIds);

    // Create a map to track used new cards
    const usedNewCards = new Set<string>();

    // Replace matched cards with new ones, ensuring no duplicates
    setCards(current => {
      const updatedLeft = current.leftColumn.map(card => {
        if (!card.isMatched) return card;

        // Find an unused new card
        const newCard = newCards.leftColumn.find(c => 
          !usedNewCards.has(c.id) && 
          !current.leftColumn.some(existing => !existing.isMatched && existing.pairId === c.pairId)
        );

        if (newCard) {
          usedNewCards.add(newCard.id);
          return newCard;
        }
        return card;
      });

      const updatedRight = current.rightColumn.map(card => {
        if (!card.isMatched) return card;

        // Find an unused new card
        const newCard = newCards.rightColumn.find(c => 
          !usedNewCards.has(c.id) && 
          !current.rightColumn.some(existing => !existing.isMatched && existing.pairId === c.pairId)
        );

        if (newCard) {
          usedNewCards.add(newCard.id);
          return newCard;
        }
        return card;
      });

      return {
        leftColumn: updatedLeft,
        rightColumn: updatedRight
      };
    });
  }, [progress.currentLevel, usedPairIds]);

  const handleCardClick = (cardId: string) => {
    if (progress.remainingTime <= 0 || progress.isComplete) return;

    const card = findCardInColumns(cardId);
    if (!card || card.isMatched || selectedCards.includes(cardId) || matchingCards.has(cardId)) return;

    const isLeftColumn = isCardInLeftColumn(cardId);
    let newSelected = [...selectedCards];

    // If clicking in same column as an existing selection, replace that selection
    if (selectedCards.length === 1) {
      const existingCard = findCardInColumns(selectedCards[0])!;
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

    if (newSelected.length === 2) {
      const [firstId, secondId] = newSelected;
      const firstCard = findCardInColumns(firstId)!;
      const secondCard = findCardInColumns(secondId)!;

      // Mark both cards as in matching state
      setMatchingCards(prev => new Set([...prev, firstId, secondId]));

      // Clear selections before processing the match
      setSelectedCards([]);

      if (firstCard.pairId === secondCard.pairId) {
        // Successful match
        setTimeout(() => {
          setCards(current => ({
            leftColumn: current.leftColumn.map(card =>
              card.id === firstId || card.id === secondId ? { ...card, isMatched: true } : card
            ),
            rightColumn: current.rightColumn.map(card =>
              card.id === firstId || card.id === secondId ? { ...card, isMatched: true } : card
            )
          }));

          // Remove cards from matching state
          setMatchingCards(prev => {
            const next = new Set(prev);
            next.delete(firstId);
            next.delete(secondId);
            return next;
          });

          const newMatchedPairs = progress.matchedPairsInLevel + 1;
          const settings = difficultySettings[progress.currentLevel];
          const levelComplete = newMatchedPairs >= settings.requiredPairs;

          setProgress(prev => ({
            ...prev,
            matchedPairsInLevel: newMatchedPairs,
            isComplete: levelComplete,
            highestUnlockedLevel: levelComplete && canUnlockNextLevel({
              ...prev,
              matchedPairsInLevel: newMatchedPairs,
              isComplete: levelComplete
            })
              ? Math.min((prev.currentLevel + 1) as DifficultyLevel, 3 as DifficultyLevel)
              : prev.highestUnlockedLevel
          }));

          // Replace matched cards if there are still pairs to match
          if (!levelComplete) {
            replaceMatchedCards();
          }
        }, 1000);
      } else {
        // Failed match - show animation
        setTimeout(() => {
          // Remove cards from matching state after animation
          setMatchingCards(prev => {
            const next = new Set(prev);
            next.delete(firstId);
            next.delete(secondId);
            return next;
          });
        }, 1000);
      }
    }
  };

  const handleLevelSelect = (level: DifficultyLevel) => {
    setProgress(prev => ({
      ...prev,
      currentLevel: level,
      matchedPairsInLevel: 0,
      remainingTime: difficultySettings[level].timeLimit,
      isComplete: false
    }));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          Matches: {progress.matchedPairsInLevel} / {difficultySettings[progress.currentLevel].requiredPairs}
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
              isMatchAnimation={matchingCards.has(card.id) && card.isMatched}
              isFailAnimation={matchingCards.has(card.id) && !card.isMatched}
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
              isMatchAnimation={matchingCards.has(card.id) && card.isMatched}
              isFailAnimation={matchingCards.has(card.id) && !card.isMatched}
              onClick={() => handleCardClick(card.id)}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-4">
        <Button onClick={resetGame}>Reset Level</Button>
      </div>
    </div>
  );
}