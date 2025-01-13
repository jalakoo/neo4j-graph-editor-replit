import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useGraphStore } from "@/lib/graph-store";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PropertyItem {
  key: string;
  value: string;
}

export function DetailsPanel() {
  const { selectedElement } = useGraphStore();

  const getProperties = (): PropertyItem[] => {
    if (!selectedElement) return [];

    return Object.entries(selectedElement)
      .filter(([key]) => !['id', 'source', 'target'].includes(key))
      .map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value)
      }));
  };

  const properties = getProperties();
  const title = selectedElement 
    ? ('source' in selectedElement ? 'Relationship Details' : 'Node Details')
    : 'No Selection';

  return (
    <Card className="w-80 h-full border-l rounded-none">
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <ScrollArea className="h-[calc(100vh-5rem)]">
        <CardContent className="p-4">
          {properties.length > 0 ? (
            <div className="space-y-4">
              {properties.map(({ key, value }) => (
                <div key={key} className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-sm break-words">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {selectedElement 
                ? 'No properties found'
                : 'Select a node or relationship to view details'}
            </p>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}