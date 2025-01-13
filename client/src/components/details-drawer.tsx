import { useGraphStore } from "@/lib/graph-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle } from "lucide-react";

export function DetailsDrawer() {
  const { selectedElement } = useGraphStore();

  const isEdge = selectedElement && 'source' in selectedElement;
  const title = isEdge ? 'Relationship Details' : 'Node Details';

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
                <p className="text-sm">
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
    </div>
  );
}