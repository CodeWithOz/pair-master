import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export function WordManagement() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Word Pair Management</h1>
      
      <Tabs defaultValue="single" className="max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">Add Single Pair</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
          <TabsTrigger value="delete">Delete Words</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600">
                Form for adding a single word pair will go here.
              </p>
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
  );
}
