
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GameBoard } from "./components/game/GameBoard";
import { LanguageSelector } from "./components/game/LanguageSelector";
import { initializeDatabase } from "./lib/db";
import { wordPairs } from "./lib/game-data";

// Initialize database with default words
initializeDatabase(wordPairs);

function App() {
  return (
    <div className="min-h-screen bg-background">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LanguageSelector />} />
          <Route path="/:language/play" element={<GameBoard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
