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
import { Home } from "lucide-react";
import { useLocation } from "wouter";
import { db } from "@/lib/db";
import { BulkImportForm } from "./BulkImportForm";
import { DeleteWordsForm } from "./DeleteWordsForm";
import { CreateWordPair } from "@/lib/game-data";

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 max-w-4xl mx-auto flex justify-between items-center">
        <Button 
          onClick={() => setLocation("/")} 
          variant="ghost"
          className="shadow-[0_0_0_1px_hsl(var(--border))]"
        >
          <Home className="h-6 w-6 inline-block mr-2"/> Home
        </Button>
      </div>
      <h1 className="text-2xl font-bold mb-8">Word Pair Management</h1>

      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="single">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="single">Add Single Pair</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
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
                <BulkImportForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delete">
            <Card>
              <CardContent className="pt-6">
                <DeleteWordsForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}