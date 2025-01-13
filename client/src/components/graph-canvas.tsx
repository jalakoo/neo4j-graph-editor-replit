import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import { useGraphStore } from "@/lib/graph-store";

export function GraphCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const { 
    nodes, 
    edges, 
    setSelectedElement, 
    openNodeEditDialog, 
    openEdgeEditDialog,
    clearSelectedNodes
  } = useGraphStore();

  useEffect(() => {
    if (!containerRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "hsl(var(--primary))",
            label: "data(label)",
            "text-valign": "center",
            "text-halign": "center",
            "text-wrap": "wrap",
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "hsl(var(--muted))",
            "curve-style": "bezier",
            label: "data(label)",
          },
        },
        {
          selector: ":selected",
          style: {
            "background-color": "hsl(var(--primary))",
            "border-width": 2,
            "border-color": "hsl(var(--accent))",
          },
        },
      ],
      layout: {
        name: "grid",
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: true,
    });

    cyRef.current.on("tap", "node, edge", (evt) => {
      const element = evt.target.data();
      if ('source' in element) {
        clearSelectedNodes();
      }
      setSelectedElement(element);
    });

    cyRef.current.on("dblclick", "node", (evt) => {
      const node = evt.target.data();
      openNodeEditDialog(node);
    });

    cyRef.current.on("dblclick", "edge", (evt) => {
      const edge = evt.target.data();
      openEdgeEditDialog(edge);
    });

    return () => {
      cyRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!cyRef.current) return;

    cyRef.current.elements().remove();
    cyRef.current.add([
      ...nodes.map((node) => ({ data: { ...node } })),
      ...edges.map((edge) => ({ data: { ...edge } })),
    ]);
    cyRef.current.layout({ name: "grid" }).run();
  }, [nodes, edges]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 right-[400px] bg-background"
      style={{ touchAction: "none" }}
    />
  );
}