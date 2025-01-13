import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGraphStore } from "@/lib/graph-store";
import { Plus, Link2, Undo2, Redo2, Trash2 } from "lucide-react";

export function GraphToolbar() {
  const { 
    openNodeDialog, 
    openEdgeDialog, 
    selectedElement,
    deleteSelected,
    canUndo,
    canRedo,
    undo,
    redo 
  } = useGraphStore();

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
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

      <div className="h-4" />

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
  );
}
