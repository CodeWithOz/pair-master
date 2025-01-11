import Dexie, { Table } from 'dexie';
import { WordPair } from './game-data';

// Define the database schema type
type WordPairTable = {
  id?: number;
  german: string;
  english: string;
  difficulty: number;
};

export class WordDatabase extends Dexie {
  wordPairs!: Table<WordPairTable>;

  constructor() {
    super('WordGameDB');
    this.version(1).stores({
      wordPairs: '++id, german, english, difficulty'  // ++ indicates auto-increment
    });
  }
}

export const db = new WordDatabase();

// Initialize database with default words if empty
export async function initializeDatabase(defaultPairs: WordPair[]) {
  try {
    const count = await db.wordPairs.count();
    if (count === 0) {
      // Remove ids when adding to let Dexie handle id generation
      const pairsWithoutIds = defaultPairs.map(({ id, ...rest }) => rest);
      await db.wordPairs.bulkAdd(pairsWithoutIds);
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}