import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGraphStore } from "@/lib/graph-store";
import { useState, useEffect } from "react";

export function NodeDialog() {
  const { 
    isNodeDialogOpen, 
    closeNodeDialog, 
    addNode, 
    updateNode,
    editingNode 
  } = useGraphStore();

  const [label, setLabel] = useState("");

  useEffect(() => {
    if (editingNode) {
      setLabel(editingNode.label);
    } else {
      setLabel("");
    }
  }, [editingNode, isNodeDialogOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    if (editingNode) {
      updateNode(editingNode.id, label.trim());
    } else {
      addNode({
        id: `n${Date.now()}`,
        label: label.trim()
      });
    }

    closeNodeDialog();
  };

  return (
    <Dialog open={isNodeDialogOpen} onOpenChange={closeNodeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingNode ? 'Edit Node' : 'Add Node'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter node label"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeNodeDialog}>
              Cancel
            </Button>
            <Button type="submit">{editingNode ? 'Update' : 'Add'} Node</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}