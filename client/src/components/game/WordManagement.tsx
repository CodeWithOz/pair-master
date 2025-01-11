import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const wordPairSchema = z.object({
  german: z
    .string()
    .min(1, "German word is required")
    .regex(/^[a-zA-ZäöüßÄÖÜ\s-]*$/, "Only letters, spaces, and hyphens are allowed"),
  english: z
    .string()
    .min(1, "English word is required")
    .regex(/^[a-zA-Z\s-]*$/, "Only letters, spaces, and hyphens are allowed"),
  difficulty: z.enum(["1", "2", "3"], {
    required_error: "Please select a difficulty level",
  }),
});

type WordPairForm = z.infer<typeof wordPairSchema>;

export function WordManagement() {
  const { toast } = useToast();
  const form = useForm<WordPairForm>({
    resolver: zodResolver(wordPairSchema),
    defaultValues: {
      german: "",
      english: "",
      difficulty: "1",
    },
  });

  const [, setLocation] = useLocation();

  async function onSubmit(data: WordPairForm) {
    try {
      await db.wordPairs.add({
        german: data.german,
        english: data.english,
        difficulty: parseInt(data.difficulty),
      });
      
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

                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select difficulty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">Easy</SelectItem>
                              <SelectItem value="2">Medium</SelectItem>
                              <SelectItem value="3">Hard</SelectItem>
                            </SelectContent>
                          </Select>
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