import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Home, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { db } from "@/lib/db";
import { BulkImportForm } from "./BulkImportForm";
import { DeleteWordsForm } from "./DeleteWordsForm";
import { CreateWordPair } from "@/lib/game-data";
import { useEffect, useState } from "react";
import { ExportWordsForm } from "./ExportWordsForm";

const wordPairSchema = z.object({
  german: z
    .string()
    .min(1, "German word is required")
    .max(30, "30 characters or less"),
  english: z
    .string()
    .min(1, "English word is required")
    .max(30, "30 characters or less"),
});

export function WordManagement() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof wordPairSchema>>({
    resolver: zodResolver(wordPairSchema),
    defaultValues: {
      german: "",
      english: "",
    },
  });

  const [, setLocation] = useLocation();

  async function onSubmit(data: z.infer<typeof wordPairSchema>) {
    try {
      const wordPair: CreateWordPair = {
        german: data.german,
        english: data.english,
      };
      await db.addWordPair(wordPair);
      const newCount = await db.getWordPairCount();
      setWordPairCount(newCount);

      toast({
        title: "Word pair added",
        description: "Successfully saved to database",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save word pair",
        variant: "destructive",
      });
    }
  }

  const [wordPairCount, setWordPairCount] = useState(0);

  const fetchWordPairCount = async () => {
    const count = await db.getWordPairCount();
    setWordPairCount(count);
  };

  useEffect(() => {
    fetchWordPairCount();
  }, []);


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 max-w-4xl mx-auto flex justify-between items-center">
        <Button 
          onClick={() => setLocation("/")} 
          variant="ghost"
          size="icon"
          className="rounded-full shadow-[0_0_0_1px_hsl(var(--border))]"
        >
          <Home className="h-6 w-6"/>
        </Button>
      </div>
      <h1 className="text-2xl font-bold mb-8">Word Pair Management</h1>
      <div className="pb-8">
        <p className="pb-2">Number of available word pairs: {wordPairCount}</p>
        {wordPairCount < 120 && (
          <p>
            <AlertTriangle className="inline h-5 w-5 mr-2 text-red-500" />
            Your word pairs are not enough for the game to work properly. Please add {120 - wordPairCount} more pairs.
          </p>
        )}
        {wordPairCount >= 120 && <p>Manage your word pairs using the options below.</p>}
      </div>

      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="single">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="single">Add Single Pair</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
            <TabsTrigger value="export">Export Words</TabsTrigger>
            <TabsTrigger value="delete">Delete Words</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <Card>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="german"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>German Word</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter German word" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="english"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>English Word</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter English word" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit">Add Word Pair</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <Card>
              <CardContent className="pt-6">
                <BulkImportForm onImport={() => fetchWordPairCount()} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export">
            <Card>
              <CardContent className="pt-6">
                <ExportWordsForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delete">
            <Card>
              <CardContent className="pt-6">
                <DeleteWordsForm onDelete={() => fetchWordPairCount()} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}