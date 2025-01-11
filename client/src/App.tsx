import { Switch, Route } from "wouter";
import { GameBoard } from "./components/game/GameBoard";
import { Home } from "./components/game/Home";
import { WordManagement } from "./components/game/WordManagement";
import { initializeDatabase } from "./lib/db";
import { wordPairs } from "./lib/game-data";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";

function App() {
  // Initialize database when the app loads
  useEffect(() => {
    initializeDatabase(wordPairs).catch(console.error);
  }, []);

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