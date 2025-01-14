import { useEffect, useRef, useMemo } from "react";
import cytoscape, { EventObject } from "cytoscape";
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

  // Generate color styles for unique node labels
  const nodeStyles = useMemo(() => {
    const uniqueLabels = new Set(nodes.map(node => node.type || 'default'));
    const colors = [
      '#000000', // Primary
      '#EF4444', // Red
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#8B5CF6', // Purple
      '#EC4899'  // Pink
    ];

    const labelColorMap = new Map();
    Array.from(uniqueLabels).forEach((label, index) => {
      labelColorMap.set(label, colors[index % colors.length]);
    });

    return Array.from(uniqueLabels).map((label) => ({
      selector: `node[type="${label}"]`,
      style: {
        'background-color': labelColorMap.get(label),
      }
    }));
  }, [nodes]);

  useEffect(() => {
    if (!containerRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#000000", // Default color
            label: "data(label)",
            "text-valign": "center",
            "text-halign": "center",
            "text-wrap": "wrap",
            "text-max-width": "80px",
            color: "#000000",
            "font-size": "12px",
          },
        },
        ...nodeStyles,
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#71717A",
            "curve-style": "bezier",
            label: "data(label)",
            color: "#52525B",
            "font-size": "10px",
          },
        },
        {
          selector: ":selected",
          style: {
            "border-width": 2,
            "border-color": "#2563EB",
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

    cyRef.current.on("tap", "node, edge", (evt: EventObject) => {
      const element = evt.target.data();
      if ('source' in element) {
        clearSelectedNodes();
      }
      setSelectedElement(element);
    });

    cyRef.current.on("dblclick", "node", (evt: EventObject) => {
      const node = evt.target.data();
      openNodeEditDialog(node);
    });

    cyRef.current.on("dblclick", "edge", (evt: EventObject) => {
      const edge = evt.target.data();
      openEdgeEditDialog(edge);
    });

    return () => {
      cyRef.current?.destroy();
    };
  }, [nodeStyles, setSelectedElement, openNodeEditDialog, openEdgeEditDialog, clearSelectedNodes]);

  useEffect(() => {
    if (!cyRef.current) return;

    cyRef.current.elements().remove();
    cyRef.current.add([
      ...nodes.map((node) => ({ 
        data: { 
          ...node,
          type: node.type || 'default' // Ensure type exists for styling
        } 
      })),
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