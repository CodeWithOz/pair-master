import { useState, useEffect } from "react";
import { Card } from "./Card";
import { Button } from "@/components/ui/button";
import { generateGameCards, type GameCard } from "@/lib/game-data";
import { useToast } from "@/hooks/use-toast";

export function GameBoard() {
  const [cards, setCards] = useState<GameCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    setCards(generateGameCards());
    setSelectedCards([]);
    setMatchedPairs(0);
  };

  const handleCardClick = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isMatched || selectedCards.includes(cardId)) return;

    const newSelected = [...selectedCards, cardId];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const [firstId, secondId] = newSelected;
      const firstCard = cards.find(c => c.id === firstId)!;
      const secondCard = cards.find(c => c.id === secondId)!;

      if (firstCard.pairId === secondCard.pairId) {
        // Match found
        setCards(cards.map(card => 
          card.pairId === firstCard.pairId ? { ...card, isMatched: true } : card
        ));
        setMatchedPairs(prev => prev + 1);
        setSelectedCards([]);

        if (matchedPairs + 1 === cards.length / 2) {
          toast({
            title: "Congratulations!",
            description: "You've matched all the pairs!",
          });
        }
      } else {
        // No match
        setTimeout(() => setSelectedCards([]), 1000);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
        {cards.map((card) => (
          <Card
            key={card.id}
            word={card.word}
            isMatched={card.isMatched}
            isSelected={selectedCards.includes(card.id)}
            onClick={() => handleCardClick(card.id)}
          />
        ))}
      </div>
      <div className="flex justify-center">
        <Button onClick={resetGame}>New Game</Button>
      </div>
    </div>
  );
}
