import { useGraphStore } from "@/lib/graph-store";
import { useNeo4jStore } from "@/lib/neo4j-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditableProperty } from "@/components/ui/editable-property";
import { PropertyDialog } from "./property-dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Plus, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function DetailsDrawer() {
  const { selectedElement, setSelectedElement } = useGraphStore();
  const { updateProperty, refreshElement } = useNeo4jStore();
  const { toast } = useToast();
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [editingProperty, setEditingProperty] = useState<{ key: string; value: any } | null>(null);

  const isEdge = selectedElement && 'source' in selectedElement;
  const title = isEdge ? 'Relationship Details' : 'Node Details';

  const handlePropertyUpdate = async (key: string, value: string) => {
    if (!selectedElement) return;

    try {
      await updateProperty(selectedElement.id, key, value, !isEdge);

      // Refresh the element data
      const refreshedElement = await refreshElement(selectedElement.id, !isEdge);
      if (refreshedElement) {
        setSelectedElement(refreshedElement);
      }

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

  const handleAddProperty = async (key: string, value: any) => {
    if (!selectedElement) return;

    try {
      await updateProperty(selectedElement.id, key, value, !isEdge);

      // Refresh the element data
      const refreshedElement = await refreshElement(selectedElement.id, !isEdge);
      if (refreshedElement) {
        setSelectedElement(refreshedElement);
      }

      toast({
        title: "Success",
        description: "Property added successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add property",
        variant: "destructive"
      });
    }
  };

  const handleEditClick = (key: string, value: any) => {
    setEditingProperty({ key, value });
  };

  const handlePropertyDialogClose = () => {
    setIsAddingProperty(false);
    setEditingProperty(null);
  };

  return (
    <div className="fixed top-[73px] right-0 w-[400px] h-[calc(100vh-73px)] border-l bg-background shadow-lg">
      <div className="p-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {selectedElement ? title : 'Details'}
        </h2>
        {selectedElement && (
          <Button
            size="sm"
            onClick={() => setIsAddingProperty(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        )}
      </div>

      {selectedElement ? (
        <ScrollArea className="h-[calc(100vh-10rem)] px-6">
          <div className="space-y-4 pr-4">
            {Object.entries(selectedElement).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {key}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(key, value)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm break-words">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </p>
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

      <PropertyDialog 
        isOpen={isAddingProperty || editingProperty !== null}
        onOpenChange={handlePropertyDialogClose}
        onSubmit={editingProperty ? handlePropertyUpdate : handleAddProperty}
        initialProperty={editingProperty}
      />
    </div>
  );
}