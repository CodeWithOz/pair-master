import { cn } from "@/lib/utils";
import { Card as ShadcnCard } from "@/components/ui/card";

interface CardProps {
  word: string;
  isMatched: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export function Card({ word, isMatched, isSelected, onClick }: CardProps) {
  return (
    <ShadcnCard
      className={cn(
        "flex items-center justify-center p-6 cursor-pointer transition-colors duration-200 min-h-[100px]",
        isMatched && "bg-muted cursor-default",
        isSelected && "ring-2 ring-primary",
        !isMatched && !isSelected && "hover:bg-accent"
      )}
      onClick={onClick}
    >
      <span 
        className={cn(
          "text-lg font-medium",
          isMatched && "text-muted-foreground"
        )}
      >
        {word}
      </span>
    </ShadcnCard>
  );
}
