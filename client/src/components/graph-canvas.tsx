import { useEffect, useRef } from "react";
import cytoscape, { EventObject, NodeDataDefinition, EdgeDataDefinition, ElementDefinition } from "cytoscape";
import { useGraphStore } from "@/lib/graph-store";

type CytoscapeElement = ElementDefinition & {
  group: 'nodes' | 'edges';
  data: NodeDataDefinition | EdgeDataDefinition;
};

interface CytoscapeEvent extends EventObject {
  target: cytoscape.SingularData & {
    data: {
      id: string;
      source?: string;
      target?: string;
      [key: string]: any;
    };
  };
}

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

    const handleTap = (evt: CytoscapeEvent) => {
      const element = evt.target.data();
      if ('source' in element) {
        clearSelectedNodes();
      }
      setSelectedElement(element);
    };

    const handleNodeDblClick = (evt: CytoscapeEvent) => {
      const node = evt.target.data();
      openNodeEditDialog(node);
    };

    const handleEdgeDblClick = (evt: CytoscapeEvent) => {
      const edge = evt.target.data();
      openEdgeEditDialog(edge);
    };

    cyRef.current.on("tap", "node, edge", handleTap);
    cyRef.current.on("dblclick", "node", handleNodeDblClick);
    cyRef.current.on("dblclick", "edge", handleEdgeDblClick);

    return () => {
      if (cyRef.current) {
        cyRef.current.off("tap", "node, edge", handleTap);
        cyRef.current.off("dblclick", "node", handleNodeDblClick);
        cyRef.current.off("dblclick", "edge", handleEdgeDblClick);
      }
      cyRef.current?.destroy();
    };

    return () => {
      cyRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!cyRef.current) return;

    try {
      cyRef.current.elements().remove();
      
      // Prepare node elements
      const nodeElements: CytoscapeElement[] = nodes.map((node) => {
        const { id, label, ...rest } = node;
        return {
          group: 'nodes' as const,
          data: {
            id: String(id || ''),
            label: String(label || id || ''),
            ...rest
          }
        };
      });

      // Prepare edge elements
      const edgeElements: CytoscapeElement[] = edges.map((edge) => {
        const { id, source, target, label, type, ...rest } = edge;
        const edgeId = id || `${source}-${target}`;
        return {
          group: 'edges' as const,
          data: {
            id: String(edgeId),
            source: String(source || ''),
            target: String(target || ''),
            label: String(label || type || ''),
            ...rest
          }
        };
      });

      // Add elements to the graph
      cyRef.current.add([...nodeElements, ...edgeElements]);
      
      // Apply layout
      const layout = cyRef.current.layout({ 
        name: 'grid',
        fit: true,
        padding: 30,
        avoidOverlap: true,
        condense: true,
        rows: Math.ceil(Math.sqrt(nodes.length))
      });
      
      layout.run();
      
      // Fit the graph to the viewport
      cyRef.current.fit();
    } catch (error) {
      console.error('Error rendering graph:', error);
    }
  }, [nodes, edges]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 right-[400px] bg-background"
      style={{ touchAction: "none" }}
    />
  );
}