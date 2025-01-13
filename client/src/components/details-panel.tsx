import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useGraphStore } from "@/lib/graph-store";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PropertyItem {
  key: string;
  value: string;
}

export function DetailsPanel() {
  const { selectedElement, selectedNodes } = useGraphStore();

  const getCommonProperties = (elements: any[]): PropertyItem[] => {
    if (!elements.length) return [];

    // Get all property keys from the first element
    const firstElementKeys = Object.keys(elements[0]).filter(key => 
      !['id', 'source', 'target'].includes(key)
    );

    // Filter for keys that exist with the same value in all elements
    const commonProps = firstElementKeys.filter(key => 
      elements.every(el => el[key] === elements[0][key])
    );

    return commonProps.map(key => ({
      key,
      value: elements[0][key]
    }));
  };

  const getProperties = (): PropertyItem[] => {
    if (!selectedElement && !selectedNodes.length) return [];

    // Multiple nodes selected
    if (selectedNodes.length > 1) {
      return getCommonProperties(selectedNodes);
    }

    // Single element selected (node or edge)
    if (selectedElement) {
      const props = Object.entries(selectedElement)
        .filter(([key]) => !['id', 'source', 'target'].includes(key))
        .map(([key, value]) => ({
          key,
          value: String(value)
        }));
      return props;
    }

    return [];
  };

  const properties = getProperties();
  const title = selectedNodes.length > 1 
    ? `Common Properties (${selectedNodes.length} nodes)`
    : selectedElement 
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
                  <p className="text-sm font-medium text-muted-foreground">
                    {key}
                  </p>
                  <p className="text-sm">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {selectedElement || selectedNodes.length > 0 
                ? 'No properties found'
                : 'Select a node or relationship to view details'}
            </p>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
