import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { db } from "@/lib/db";
import { useState } from "react";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WordPairForm>({
    resolver: zodResolver(wordPairSchema),
    defaultValues: {
      german: "",
      english: "",
      difficulty: "1",
    },
  });

  async function onSubmit(data: WordPairForm) {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Add the word pair to the Dexie database
      await db.wordPairs.add({
        german: data.german.trim(),
        english: data.english.trim(),
        difficulty: parseInt(data.difficulty),
      });

      toast({
        title: "Success",
        description: "Word pair added successfully",
      });

      // Reset the form after successful submission
      form.reset({
        german: "",
        english: "",
        difficulty: "1",
      });
    } catch (error) {
      console.error('Error adding word pair:', error);
      toast({
        title: "Error",
        description: "Failed to add word pair. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
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

                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Adding..." : "Add Word Pair"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600">
                  Bulk import interface will go here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delete">
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600">
                  Word deletion interface will go here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}