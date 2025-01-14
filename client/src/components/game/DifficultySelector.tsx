import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { difficultyLevels, type DifficultyLevel, type GameProgress } from "@/lib/game-data";
import { Lock, LockOpen } from "lucide-react";

interface DifficultySelectorProps {
  progress: GameProgress;
  onSelectLevel: (level: DifficultyLevel) => void;
}

export function DifficultySelector({ progress, onSelectLevel }: DifficultySelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
      {(Object.entries(difficultyLevels) as [DifficultyLevel, string][]).map(([level, name]) => {
        const numericLevel = Number(level) as DifficultyLevel;
        const isUnlocked = numericLevel <= progress.highestUnlockedLevel;
        const isActive = numericLevel === progress.currentLevel;

        return (
          <Card
            key={level}
            className={`p-2 ${
              isActive
                ? "ring-2 ring-primary"
                : isUnlocked
                ? "hover:bg-gray-50 cursor-pointer"
                : "opacity-75 bg-gray-100"
            }`}
            onClick={() => isUnlocked && onSelectLevel(numericLevel)}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-md font-semibold">{name}</h3>
              {isUnlocked ? (
                <LockOpen className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-gray-400" />
              )}
            </div>
            {!isUnlocked && (
              <p className="text-sm text-gray-600 mt-2">Locked</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}