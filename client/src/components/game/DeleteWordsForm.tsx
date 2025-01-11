
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { WordPair } from "@/lib/game-data";
import { cn } from "@/lib/utils";

export function DeleteWordsForm() {
  const [pairs, setPairs] = useState<WordPair[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [allSelected, setAllSelected] = useState(false);
  const [exceptions, setExceptions] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    const loadPairs = async () => {
      const dbPairs = await db.wordPairs.toArray();
      setPairs(dbPairs);
    };
    loadPairs();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    setAllSelected(checked);
    setExceptions(new Set());
    setSelectedIds(new Set());
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (allSelected) {
      if (!checked) {
        setExceptions(new Set([...exceptions, id]));
      } else {
        const newExceptions = new Set(exceptions);
        newExceptions.delete(id);
        setExceptions(newExceptions);
      }
    } else {
      if (checked) {
        setSelectedIds(new Set([...selectedIds, id]));
      } else {
        const newSelected = new Set(selectedIds);
        newSelected.delete(id);
        setSelectedIds(newSelected);
      }
    }
  };

  const handleDelete = async () => {
    try {
      if (allSelected && exceptions.size === 0) {
        // Delete all records efficiently
        await db.wordPairs.clear();
        setPairs([]);
      } else {
        // Delete specific records
        const idsToDelete = allSelected 
          ? pairs.filter(pair => !exceptions.has(pair.id)).map(pair => pair.id)
          : Array.from(selectedIds);
        
        await db.wordPairs.bulkDelete(idsToDelete);
        setPairs(pairs.filter(pair => !idsToDelete.includes(pair.id)));
      }

      toast({
        title: "Success",
        description: "Successfully deleted selected word pairs",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete word pairs",
        variant: "destructive",
      });
    }
  };

  const isSelected = (pair: WordPair) => {
    return allSelected ? !exceptions.has(pair.id) : selectedIds.has(pair.id);
  };

  const anySelected = allSelected || selectedIds.size > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[auto_1fr_1fr] gap-4 items-center mb-2">
        <div className="flex items-center gap-2">
          <Checkbox 
            checked={allSelected || (pairs.length > 0 && selectedIds.size === pairs.length)}
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
                isSelected(pair) && "bg-gray-100"
              )}
            >
              <Checkbox 
                checked={isSelected(pair)}
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
