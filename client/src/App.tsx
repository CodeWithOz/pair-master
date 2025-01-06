import { GameBoard } from "./components/game/GameBoard";
import { initializeDatabase } from "./lib/db";
import { wordPairs } from "./lib/game-data";

// Initialize database with default words
initializeDatabase(wordPairs);

function App() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <GameBoard />
      </main>
    </div>
  );
}

export default App;