import { Switch, Route } from "wouter";
import { GameBoard } from "./components/game/GameBoard";
import { Home } from "./components/game/Home";
import { WordManagement } from "./components/game/WordManagement";
import { initializeDatabase } from "./lib/db";
import { wordPairs } from "./lib/game-data";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";

function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize database with default words
    const init = async () => {
      try {
        await initializeDatabase(wordPairs);
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    };
    init();
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Loading game data...</h2>
          <p className="text-sm text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/:language/play" component={GameBoard} />
        <Route path="/manage-words" component={WordManagement} />
        <Route path="*">
          <Home />
        </Route>
      </Switch>
      <Toaster />
    </div>
  );
}

export default App;