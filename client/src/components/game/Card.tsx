import { cn } from "@/lib/utils";
import { Card as ShadcnCard } from "@/components/ui/card";

interface CardProps {
  word: string;
  isMatched: boolean;
  isSelected: boolean;
  isMatchAnimation: boolean;
  isFailAnimation: boolean;
  onClick: () => void;
}

export function Card({ 
  word, 
  isMatched, 
  isSelected, 
  isMatchAnimation,
  isFailAnimation,
  onClick 
}: CardProps) {
  return (
    <ShadcnCard
      className={cn(
        "flex items-center justify-center p-6 cursor-pointer transition-all duration-200 min-h-[100px]",
        isMatchAnimation && "bg-green-100 text-green-800",
        isMatched && "bg-gray-100 text-gray-400 cursor-default",
        isSelected && !isMatched && "bg-blue-50 ring-2 ring-blue-300",
        isFailAnimation && "bg-red-100 text-red-800",
        !isMatched && !isSelected && !isMatchAnimation && !isFailAnimation && "hover:bg-gray-50"
      )}
      onClick={onClick}
    >
      <span 
        className={cn(
          "text-lg font-medium",
          isMatched && "text-gray-400"
        )}
      >
        {word}
      </span>
    </ShadcnCard>
  );
}