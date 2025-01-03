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

export function generateGameCards(): { leftColumn: GameCard[], rightColumn: GameCard[] } {
  const leftCards: GameCard[] = [];
  const rightCards: GameCard[] = [];

  wordPairs.forEach(pair => {
    leftCards.push({
      id: `en-${pair.id}`,
      word: pair.english,
      pairId: pair.id,
      language: 'english',
      isMatched: false
    });

    rightCards.push({
      id: `de-${pair.id}`,
      word: pair.german,
      pairId: pair.id,
      language: 'german',
      isMatched: false
    });
  });

  // Shuffle each column independently
  for (let i = leftCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [leftCards[i], leftCards[j]] = [leftCards[j], leftCards[i]];
  }

  for (let i = rightCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rightCards[i], rightCards[j]] = [rightCards[j], rightCards[i]];
  }

  return { leftColumn: leftCards, rightColumn: rightCards };
}