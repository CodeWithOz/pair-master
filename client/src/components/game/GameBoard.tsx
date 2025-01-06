import { useState, useEffect, useCallback } from "react";
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
  const [availablePairs, setAvailablePairs] = useState<WordPair[]>([]);
  const [progress, setProgress] = useState<GameProgress>({
    currentLevel: 1 as DifficultyLevel,
    highestUnlockedLevel: 1 as DifficultyLevel,
    matchedPairsInLevel: 0,
    remainingTime: difficultySettings[1].timeLimit,
    isComplete: false,
    unusedPairs: getInitialShuffledPairs(1) // Initialize with shuffled pairs for level 1
  });
  const [matchAnimation, setMatchAnimation] = useState<number | null>(null);
  const [failAnimation, setFailAnimation] = useState<boolean>(false);
  const [transitionInProgress, setTransitionInProgress] = useState(false);
  const { toast } = useToast();

  // Timer effect
  useEffect(() => {
    if (progress.remainingTime <= 0 || progress.isComplete) return;

    let timeoutId: NodeJS.Timeout;

    const runTimer = () => {
      timeoutId = setTimeout(() => {
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

  // Reset game when changing levels
  useEffect(() => {
    resetGame();
  }, [progress.currentLevel]);

  const resetGame = () => {
    const settings = difficultySettings[progress.currentLevel];
    // Get initial shuffled pairs for the level
    const shuffledPairs = getInitialShuffledPairs(progress.currentLevel);
    setProgress(prev => ({
      ...prev,
      remainingTime: settings.timeLimit,
      matchedPairsInLevel: 0,
      isComplete: false,
      unusedPairs: shuffledPairs
    }));

    // Generate initial cards from the first few pairs
    setCards(generateGameCards(progress.currentLevel, shuffledPairs));
    setSelectedCards([]);
    setMatchAnimation(null);
    setFailAnimation(false);
  };

  const findCardInColumns = (cardId: string): GameCard | undefined => {
    return [...cards.leftColumn, ...cards.rightColumn].find(c => c.id === cardId);
  };

  const isCardInLeftColumn = (cardId: string): boolean => {
    return cards.leftColumn.some(card => card.id === cardId);
  };

  const replaceMatchedCards = useCallback(() => {
    // Get the next available pairs that haven't been used yet
    const matchedPairIds = new Set([...cards.leftColumn, ...cards.rightColumn]
      .filter(card => card.isMatched)
      .map(card => card.pairId));

    // Remove matched pairs from unusedPairs
    setProgress(prev => ({
      ...prev,
      unusedPairs: prev.unusedPairs.filter(pair => !matchedPairIds.has(pair.id))
    }));

    // Generate new cards using the next available pairs
    const newCards = generateGameCards(
      progress.currentLevel,
      progress.unusedPairs,
      matchedPairIds.size
    );

    // Replace matched cards with new ones
    setCards(current => ({
      leftColumn: current.leftColumn.map(card => 
        card.isMatched ? newCards.leftColumn.shift() || card : card
      ),
      rightColumn: current.rightColumn.map(card =>
        card.isMatched ? newCards.rightColumn.shift() || card : card
      )
    }));
  }, [progress.currentLevel, progress.unusedPairs]);

  const handleCardClick = (cardId: string) => {
    if (transitionInProgress || progress.remainingTime <= 0 || progress.isComplete) return;

    const card = findCardInColumns(cardId);
    if (!card || card.isMatched || selectedCards.includes(cardId)) return;

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

      if (firstCard.pairId === secondCard.pairId) {
        // Match found
        setTransitionInProgress(true);
        setMatchAnimation(firstCard.pairId);

        setTimeout(() => {
          setMatchAnimation(null);
          setCards(current => ({
            leftColumn: current.leftColumn.map(card =>
              card.pairId === firstCard.pairId ? { ...card, isMatched: true } : card
            ),
            rightColumn: current.rightColumn.map(card =>
              card.pairId === firstCard.pairId ? { ...card, isMatched: true } : card
            )
          }));

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

          setSelectedCards([]);
          setTransitionInProgress(false);

          // Replace matched cards if there are still pairs to match
          if (!levelComplete) {
            replaceMatchedCards();
          }
        }, 1000);

      } else {
        // No match
        setTransitionInProgress(true);
        setFailAnimation(true);
        setTimeout(() => {
          setFailAnimation(false);
          setSelectedCards([]);
          setTransitionInProgress(false);
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
      isComplete: false,
      unusedPairs: getInitialShuffledPairs(level)
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
              isMatchAnimation={matchAnimation === card.pairId}
              isFailAnimation={failAnimation && selectedCards.includes(card.id)}
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
              isMatchAnimation={matchAnimation === card.pairId}
              isFailAnimation={failAnimation && selectedCards.includes(card.id)}
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