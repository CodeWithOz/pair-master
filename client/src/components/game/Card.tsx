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
  const getCardStyle = () => {
    if (isMatchAnimation) {
      return {
        background: "bg-green-100",
        text: "text-green-800",
        ring: "ring-2 ring-green-500"
      };
    }
    if (isFailAnimation) {
      return {
        background: "bg-red-100",
        text: "text-red-800",
        ring: "ring-2 ring-red-500"
      };
    }
    if (isMatched) {
      return {
        background: "bg-gray-100",
        text: "text-gray-400",
        ring: "ring-1 ring-gray-200"
      };
    }
    if (isSelected && !isMatched) {
      return {
        background: "bg-blue-50",
        text: "text-blue-800",
        ring: "ring-2 ring-blue-500"
      };
    }
    return {
      background: "hover:bg-gray-50",
      text: "text-gray-900",
      ring: ""
    };
  };

  const styles = getCardStyle();

  return (
    <ShadcnCard
      className={cn(
        "flex items-center justify-center p-6 cursor-pointer min-h-[100px]",
        styles.background,
        styles.ring,
        isMatched && "cursor-default",
        isMatchAnimation && "[transition:opacity_4s_1s,background-color_0.2s,border_0.2s] opacity-0",
        isFailAnimation && "transition-transform"
      )}
      onClick={onClick}
    >
      <span className={cn(
        "text-lg font-medium transition-colors duration-200",
        styles.text
      )}>
        {word}
      </span>
    </ShadcnCard>
  );
}