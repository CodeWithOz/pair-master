import Dexie, { Table } from 'dexie';
import { WordPair } from './game-data';

export class WordDatabase extends Dexie {
  wordPairs!: Table<WordPair>;

  constructor() {
    super('WordGameDB');
    this.version(1).stores({
      wordPairs: '++id, german, english, difficulty'
    });
  }
}

export const db = new WordDatabase();

// Initialize database with default words if empty
export async function initializeDatabase(defaultPairs: WordPair[]) {
  try {
    const count = await db.wordPairs.count();
    if (count === 0) {
      console.log('Initializing database with default word pairs...');
      await db.wordPairs.bulkAdd(defaultPairs);
      console.log('Database initialized successfully');
    } else {
      console.log('Database already contains word pairs, skipping initialization');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}