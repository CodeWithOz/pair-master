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
        border: "border-green-500"
      };
    }
    if (isFailAnimation) {
      return {
        background: "bg-red-100",
        text: "text-red-800",
        border: "border-red-500"
      };
    }
    if (isMatched) {
      return {
        background: "bg-gray-100",
        text: "text-gray-400",
        border: "border-gray-200"
      };
    }
    if (isSelected && !isMatched) {
      return {
        background: "bg-blue-50",
        text: "text-blue-800",
        border: "border-blue-500"
      };
    }
    return {
      background: "hover:bg-gray-50",
      text: "text-gray-900",
      border: "border-gray-200"
    };
  };

  const styles = getCardStyle();

  return (
    <ShadcnCard
      className={cn(
        "flex items-center justify-center p-5 cursor-pointer min-h-[60px] rounded-[16px] border-2 border-b-4 active:border-b-2 [transition:border_0.4s,transform_0.4s] active:translate-y-[2px] active:[transition:none]",
        styles.background,
        styles.border,
        isMatched && "cursor-default",
        isMatchAnimation && "[transition:opacity_2.5s_0.5s,background-color_0.2s,border-color_0.2s] opacity-0",
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