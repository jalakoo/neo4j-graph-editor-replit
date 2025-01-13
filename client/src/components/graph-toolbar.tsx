import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGraphStore } from "@/lib/graph-store";
import { useNeo4jStore } from "@/lib/neo4j-store";
import { Plus, Link2, Undo2, Redo2, Trash2, Save, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function GraphToolbar() {
  const { 
    openNodeDialog, 
    openEdgeDialog, 
    selectedElement,
    deleteSelected,
    canUndo,
    canRedo,
    undo,
    redo,
    saveToDb,
    loadFromDb
  } = useGraphStore();

  const isConnected = useNeo4jStore(state => state.isConnected);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      await saveToDb();
      toast({
        title: "Success",
        description: "Graph saved to database"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save graph",
        variant: "destructive"
      });
    }
  };

  const handleLoad = async () => {
    try {
      await loadFromDb();
      toast({
        title: "Success",
        description: "Graph loaded from database"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load graph",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="absolute top-4 left-4 z-50 flex flex-col gap-2 bg-background/50 backdrop-blur-sm p-2 rounded-lg shadow-md">
      <div className="flex flex-col gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" onClick={openNodeDialog}>
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add Node</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" onClick={openEdgeDialog}>
              <Link2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add Edge</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="destructive"
              disabled={!selectedElement}
              onClick={deleteSelected}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete Selected</TooltipContent>
        </Tooltip>
      </div>

      <div className="h-px bg-border" />

      <div className="flex flex-col gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="outline"
              disabled={!canUndo}
              onClick={undo}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="outline"
              disabled={!canRedo}
              onClick={redo}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>
      </div>

      <div className="h-px bg-border" />

      <div className="flex flex-col gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="outline"
              disabled={!isConnected}
              onClick={handleSave}
            >
              <Save className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save to Database</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="outline"
              disabled={!isConnected}
              onClick={handleLoad}
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Load from Database</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}