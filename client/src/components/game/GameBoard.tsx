import { useState, useEffect } from "react";
import { Card } from "./Card";
import { Button } from "@/components/ui/button";
import { generateGameCards, type GameCard } from "@/lib/game-data";
import { useToast } from "@/hooks/use-toast";

interface ColumnCards {
  leftColumn: GameCard[];
  rightColumn: GameCard[];
}

export function GameBoard() {
  const [cards, setCards] = useState<ColumnCards>({ leftColumn: [], rightColumn: [] });
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [matchAnimation, setMatchAnimation] = useState<number | null>(null);
  const [failAnimation, setFailAnimation] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    setCards(generateGameCards());
    setSelectedCards([]);
    setMatchedPairs(0);
    setMatchAnimation(null);
    setFailAnimation(false);
  };

  const findCardInColumns = (cardId: string): GameCard | undefined => {
    return [...cards.leftColumn, ...cards.rightColumn].find(c => c.id === cardId);
  };

  const handleCardClick = (cardId: string) => {
    const card = findCardInColumns(cardId);
    if (!card || card.isMatched || selectedCards.includes(cardId)) return;

    const newSelected = [...selectedCards, cardId];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const [firstId, secondId] = newSelected;
      const firstCard = findCardInColumns(firstId)!;
      const secondCard = findCardInColumns(secondId)!;

      if (firstCard.pairId === secondCard.pairId) {
        // Match found
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
          setMatchedPairs(prev => prev + 1);
          setSelectedCards([]);
        }, 1000);

        if (matchedPairs + 1 === cards.leftColumn.length) {
          toast({
            title: "Congratulations!",
            description: "You've matched all the pairs!",
          });
        }
      } else {
        // No match
        setFailAnimation(true);
        setTimeout(() => {
          setFailAnimation(false);
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
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
      <div className="flex justify-center">
        <Button onClick={resetGame}>New Game</Button>
      </div>
    </div>
  );
}