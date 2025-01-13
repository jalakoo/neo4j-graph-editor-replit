import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useGraphStore } from "@/lib/graph-store";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DetailsDrawer() {
  const { selectedElement } = useGraphStore();

  if (!selectedElement) return null;

  const isEdge = 'source' in selectedElement;
  const title = isEdge ? 'Relationship Details' : 'Node Details';

  return (
    <Sheet open={!!selectedElement} onOpenChange={() => useGraphStore.setState({ selectedElement: null })}>
      <SheetContent side="right" className="w-[400px]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-full mt-6">
          <div className="space-y-4">
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
      </SheetContent>
    </Sheet>
  );
}
