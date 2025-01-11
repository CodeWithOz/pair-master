
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { WordPair } from "@/lib/game-data";

export function DeleteWordsForm() {
  const [pairs, setPairs] = useState<(WordPair & { selected: boolean })[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadPairs = async () => {
      const dbPairs = await db.wordPairs.toArray();
      setPairs(dbPairs.map(pair => ({ ...pair, selected: false })));
    };
    loadPairs();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    setPairs(pairs.map(pair => ({ ...pair, selected: checked })));
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    setPairs(pairs.map(pair => 
      pair.id === id ? { ...pair, selected: checked } : pair
    ));
  };

  const handleDelete = async () => {
    const selectedIds = pairs.filter(pair => pair.selected).map(pair => pair.id);
    if (selectedIds.length === 0) return;

    try {
      await db.wordPairs.bulkDelete(selectedIds);
      setPairs(pairs.filter(pair => !pair.selected));
      toast({
        title: "Success",
        description: `Deleted ${selectedIds.length} word pairs`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete word pairs",
        variant: "destructive",
      });
    }
  };

  const anySelected = pairs.some(pair => pair.selected);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[auto_1fr_1fr] gap-4 items-center mb-2">
        <div className="flex items-center gap-2">
          <Checkbox 
            checked={pairs.length > 0 && pairs.every(pair => pair.selected)}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm font-medium">All ({pairs.length})</span>
        </div>
        <div className="font-medium text-center">English</div>
        <div className="font-medium text-center">German</div>
      </div>

      <ScrollArea className="h-[220px] border rounded-md">
        <div className="p-4 divide-y divide-gray-200">
          {pairs.map((pair) => (
            <div 
              key={pair.id} 
              className={cn(
                "grid grid-cols-[auto_1fr_1fr] gap-4 items-center py-2",
                "hover:bg-gray-50",
                pair.selected && "bg-gray-50"
              )}
            >
              <Checkbox 
                checked={pair.selected}
                onCheckedChange={(checked) => handleSelectRow(pair.id, !!checked)}
              />
              <div className="text-gray-600 text-center">{pair.english}</div>
              <div className="text-gray-600 text-center border-l pl-4">{pair.german}</div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Button 
        onClick={handleDelete} 
        disabled={!anySelected}
        className="w-full bg-red-600 hover:bg-red-700 text-white"
      >
        Delete Selection
      </Button>
    </div>
  );
}
