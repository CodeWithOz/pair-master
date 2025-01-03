export interface WordPair {
  id: number;
  german: string;
  english: string;
}

export const wordPairs: WordPair[] = [
  { id: 1, german: "viel", english: "much" },
  { id: 2, german: "Taxifahrt", english: "taxi ride" },
  { id: 3, german: "noch", english: "still" },
  { id: 4, german: "fünfzehn", english: "fifteen" },
  { id: 5, german: "Riesenrad", english: "Ferris wheel" }
];

export interface GameCard {
  id: string;
  word: string;
  pairId: number;
  language: 'german' | 'english';
  isMatched: boolean;
}

export function generateGameCards(): GameCard[] {
  const cards: GameCard[] = [];
  
  wordPairs.forEach(pair => {
    cards.push({
      id: `de-${pair.id}`,
      word: pair.german,
      pairId: pair.id,
      language: 'german',
      isMatched: false
    });
    
    cards.push({
      id: `en-${pair.id}`,
      word: pair.english,
      pairId: pair.id,
      language: 'english',
      isMatched: false
    });
  });

  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
}
