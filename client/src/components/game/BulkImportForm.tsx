
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";

interface WordPair {
  english: string;
  german: string;
}

export function BulkImportForm() {
  const [pairs, setPairs] = useState<WordPair[]>([{ english: "", german: "" }]);
  const { toast } = useToast();

  const isValid = pairs.every(pair => 
    pair.english.trim() !== "" && 
    pair.german.trim() !== "" && 
    pair.english.length <= 30 && 
    pair.german.length <= 30
  );

  const addRow = (index: number) => {
    const newPairs = [...pairs];
    newPairs.splice(index + 1, 0, { english: "", german: "" });
    setPairs(newPairs);
  };

  const removeRow = (index: number) => {
    if (pairs.length > 1) {
      setPairs(pairs.filter((_, i) => i !== index));
    }
  };

  const handleChange = (index: number, field: keyof WordPair, value: string) => {
    const newPairs = pairs.map((pair, i) => {
      if (i === index) {
        return { ...pair, [field]: value };
      }
      return pair;
    });
    setPairs(newPairs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      await db.wordPairs.bulkAdd(
        pairs.map(pair => ({
          english: pair.english.trim(),
          german: pair.german.trim(),
          difficulty: 1
        }))
      );
      
      toast({
        title: "Success",
        description: `Added ${pairs.length} word pairs to the database`,
      });
      setPairs([{ english: "", german: "" }]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add word pairs",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-4">
        <div className="font-medium text-center">English</div>
        <div className="font-medium text-center">German</div>
        <div className="w-20"></div>
        
        {pairs.map((pair, index) => (
          <div key={index} className="contents">
            <Input 
              value={pair.english}
              onChange={(e) => handleChange(index, "english", e.target.value)}
              maxLength={30}
              placeholder="English word"
            />
            <Input 
              value={pair.german}
              onChange={(e) => handleChange(index, "german", e.target.value)}
              maxLength={30}
              placeholder="German word"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => addRow(index)}
                className="text-green-600 hover:bg-green-100"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRow(index)}
                className="text-red-600 hover:bg-red-100"
                disabled={pairs.length === 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button 
        type="submit" 
        disabled={!isValid}
        className="w-full"
      >
        Import Word Pairs
      </Button>
    </form>
  );
}
