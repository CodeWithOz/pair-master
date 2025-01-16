
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { CreateWordPair } from "@/lib/game-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as z from "zod";

interface FormWordPair {
  english: string;
  german: string;
}

interface BulkImportFormProps {
  onImport: () => void;
}

const wordPairSchema = z.object({
  english: z.string().trim().min(1).max(30),
  german: z.string().trim().min(1).max(30),
});

const wordPairArraySchema = z.array(wordPairSchema);

export function BulkImportForm({ onImport }: BulkImportFormProps) {
  const [pairs, setPairs] = useState<FormWordPair[]>([{ english: "", german: "" }]);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const { toast } = useToast();

  const isValidPair = (pair: FormWordPair) => 
      pair.english.trim() !== "" && 
      pair.german.trim() !== "" && 
      pair.english.length <= 30 && 
      pair.german.length <= 30;

  const isValidForm = pairs.every(isValidPair);

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

  const handleChange = (index: number, field: keyof FormWordPair, value: string) => {
    const newPairs = pairs.map((pair, i) => {
      if (i === index) {
        return { ...pair, [field]: value };
      }
      return pair;
    });
    setPairs(newPairs);
  };

  const handleJsonImport = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const validation = wordPairArraySchema.safeParse(parsed);
      
      if (!validation.success) {
        setJsonError("Invalid format. Please check your JSON structure.");
        return;
      }

      await db.addWordPairs(validation.data);
      toast({
        title: "Success",
        description: `Added ${parsed.length} word pairs to the database`,
      });
      setJsonInput("");
      setJsonError(null);
      onImport();
    } catch (error) {
      setJsonError("Invalid format. Please check your JSON structure.");
      toast({
        title: "Error",
        description: "Failed to import word pairs",
        variant: "destructive",
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidForm) return;

    try {
      const wordPairs: CreateWordPair[] = pairs.map(pair => ({
        english: pair.english.trim(),
        german: pair.german.trim(),
      }));

      await db.addWordPairs(wordPairs);
      toast({
        title: "Success",
        description: `Added ${pairs.length} word pairs to the database`,
      });
      setPairs([{ english: "", german: "" }]);
      onImport();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add word pairs",
        variant: "destructive",
      });
    }
  };

  return (
    <Tabs defaultValue="form" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="form">Form Input</TabsTrigger>
        <TabsTrigger value="json">JSON Input</TabsTrigger>
      </TabsList>

      <TabsContent value="form">
        <form onSubmit={handleFormSubmit} className="space-y-6">
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
            disabled={!isValidForm}
            className="w-full"
          >
            Import {pairs.filter(isValidPair).length} Word Pairs
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="json" className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm">
            Paste your word pairs in JSON format:
          </p>
          <p className="text-xs font-mono">
            [{"{"}"english": "word", "german": "wort"{"}"}]
          </p>
        </div>
        <Textarea 
          value={jsonInput}
          onChange={(e) => {
            setJsonInput(e.target.value);
            setJsonError(null);
          }}
          placeholder='[{"english": "hello", "german": "hallo"}]'
          className="min-h-[200px] font-mono"
        />
        {jsonError && (
          <p className="text-sm text-red-500">{jsonError}</p>
        )}
        <Button 
          onClick={handleJsonImport}
          disabled={!jsonInput}
          className="w-full"
        >
          Import JSON
        </Button>
      </TabsContent>
    </Tabs>
  );
}
