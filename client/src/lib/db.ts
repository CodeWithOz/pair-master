import Dexie, { Table } from 'dexie';
import { WordPair, CreateWordPair } from './game-data';

export class WordDatabase extends Dexie {
  wordPairs!: Table<WordPair, number>; // second type parameter is the key type

  constructor() {
    super('WordGameDB');

    // Define schema and migrations
    this.version(1).stores({
      wordPairs: '++id, german, english, difficulty'
    });

    // Migrate to version 2: remove difficulty column
    this.version(2).stores({
      wordPairs: '++id, german, english'
    });
  }

  // Helper method to add a word pair without id
  async addWordPair(wordPair: CreateWordPair): Promise<number> {
    return await this.wordPairs.add(wordPair as any);
  }

  // Helper method to bulk add word pairs without ids
  async addWordPairs(wordPairs: CreateWordPair[]): Promise<number> {
    return await this.wordPairs.bulkAdd(wordPairs as any[]);
  }

  async getWordPairCount(): Promise<number> {
    const count = await this.wordPairs.count();
    return count;
  }
}

export const db = new WordDatabase();

// Initialize database with default words if empty
export async function initializeDatabase(defaultPairs: WordPair[]) {
  try {
    const count = await db.wordPairs.count();
    if (count === 0) {
      console.log('Initializing database with default word pairs...');
      // Remove difficulty from default pairs before adding
      const pairsWithoutDifficulty = defaultPairs.map(({ german, english }) => ({
        german,
        english
      }));
      await db.addWordPairs(pairsWithoutDifficulty);
      console.log('Database initialized successfully');
    } else {
      console.log('Database already contains word pairs, skipping initialization');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}