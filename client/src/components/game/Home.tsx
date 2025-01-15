
import { Play, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col justify-center">
      <h1 className="text-4xl font-bold text-center mb-12">Welcome to PairMaster!</h1>
      <div className="flex justify-center gap-4 max-w-xl mx-auto">
        <Button 
          size="lg" 
          onClick={() => setLocation("/play")}
          className="flex-1"
        >
          <Play className="mr-2 h-5 w-5" />
          Start
        </Button>
        <Button 
          size="lg"
          variant="outline"
          onClick={() => setLocation("/manage-words")}
          className="flex-1"
        >
          <Settings className="mr-2 h-5 w-5" />
          Settings
        </Button>
      </div>
    </div>
  );
}
