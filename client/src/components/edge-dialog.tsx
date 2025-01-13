import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGraphStore } from "@/lib/graph-store";
import { useState, useEffect } from "react";

export function EdgeDialog() {
  const { 
    isEdgeDialogOpen, 
    closeEdgeDialog, 
    addEdge, 
    updateEdge,
    editingEdge,
    nodes 
  } = useGraphStore();

  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (editingEdge) {
      setSource(editingEdge.source);
      setTarget(editingEdge.target);
      setLabel(editingEdge.label);
    } else {
      setSource("");
      setTarget("");
      setLabel("");
    }
  }, [editingEdge, isEdgeDialogOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!source || !target || !label.trim()) return;

    if (editingEdge) {
      updateEdge(editingEdge.id, label.trim());
    } else {
      addEdge({
        id: `e${Date.now()}`,
        source,
        target,
        label: label.trim()
      });
    }

    closeEdgeDialog();
  };

  return (
    <Dialog open={isEdgeDialogOpen} onOpenChange={closeEdgeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingEdge ? 'Edit Edge' : 'Add Edge'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingEdge && (
            <>
              <div className="space-y-2">
                <Label htmlFor="source">Source Node</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source node" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Target Node</Label>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target node" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter edge label"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeEdgeDialog}>
              Cancel
            </Button>
            <Button type="submit">{editingEdge ? 'Update' : 'Add'} Edge</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}