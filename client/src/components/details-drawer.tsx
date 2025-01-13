import { useGraphStore } from "@/lib/graph-store";
import { useNeo4jStore } from "@/lib/neo4j-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditableProperty } from "@/components/ui/editable-property";
import { HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DetailsDrawer() {
  const { selectedElement } = useGraphStore();
  const { updateProperty } = useNeo4jStore();
  const { toast } = useToast();

  const isEdge = selectedElement && 'source' in selectedElement;
  const title = isEdge ? 'Relationship Details' : 'Node Details';

  const handlePropertyUpdate = async (key: string, value: string) => {
    if (!selectedElement) return;

    try {
      await updateProperty(selectedElement.id, key, value, !isEdge);
      toast({
        title: "Success",
        description: "Property updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update property",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="fixed top-[73px] right-0 w-[400px] h-[calc(100vh-73px)] border-l bg-background shadow-lg">
      <div className="p-6">
        <h2 className="text-lg font-semibold">
          {selectedElement ? title : 'Details'}
        </h2>
      </div>

      {selectedElement ? (
        <ScrollArea className="h-[calc(100vh-10rem)] px-6">
          <div className="space-y-4 pr-4">
            {Object.entries(selectedElement).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {key}
                </p>
                {typeof value === 'object' ? (
                  <p className="text-sm">{JSON.stringify(value)}</p>
                ) : (
                  <EditableProperty
                    propertyKey={key}
                    value={String(value)}
                    onSave={(newValue) => handlePropertyUpdate(key, newValue)}
                  />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center px-6 text-muted-foreground">
          <HelpCircle className="h-8 w-8 mb-4" />
          <p>Click on a Node or a Relationship to view its details</p>
        </div>
      )}
    </div>
  );
}