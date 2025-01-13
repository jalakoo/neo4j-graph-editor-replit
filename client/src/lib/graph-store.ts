import { create } from 'zustand';

interface Node {
  id: string;
  label: string;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  label: string;
}

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface GraphStore {
  nodes: Node[];
  edges: Edge[];
  selectedElement: (Node | Edge) | null;
  selectedNodes: Node[];
  isNodeDialogOpen: boolean;
  isEdgeDialogOpen: boolean;
  editingNode: Node | null;
  editingEdge: Edge | null;
  history: HistoryState[];
  currentHistoryIndex: number;
  canUndo: boolean;
  canRedo: boolean;

  setSelectedElement: (element: (Node | Edge) | null) => void;
  addSelectedNode: (node: Node) => void;
  clearSelectedNodes: () => void;
  openNodeDialog: () => void;
  openNodeEditDialog: (node: Node) => void;
  closeNodeDialog: () => void;
  openEdgeDialog: () => void;
  openEdgeEditDialog: (edge: Edge) => void;
  closeEdgeDialog: () => void;

  addNode: (node: Node) => void;
  updateNode: (id: string, label: string) => void;
  addEdge: (edge: Edge) => void;
  updateEdge: (id: string, label: string) => void;
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedElement: null,
  selectedNodes: [],
  editingNode: null,
  editingEdge: null,
  isNodeDialogOpen: false,
  isEdgeDialogOpen: false,
  history: [{ nodes: [], edges: [] }],
  currentHistoryIndex: 0,
  canUndo: false,
  canRedo: false,

  setSelectedElement: (element) => {
    if (element && !('source' in element)) {
      // If a node is selected, add it to selectedNodes (max 2)
      const node = element as Node;
      get().addSelectedNode(node);
    }
    set({ selectedElement: element });
  },

  addSelectedNode: (node) => {
    const currentSelected = get().selectedNodes;
    // Don't add if already selected
    if (!currentSelected.find(n => n.id === node.id)) {
      const newSelected = [...currentSelected, node].slice(-2); // Keep only last 2
      set({ selectedNodes: newSelected });
    }
  },

  clearSelectedNodes: () => set({ selectedNodes: [] }),

  openNodeDialog: () => set({ 
    isNodeDialogOpen: true,
    editingNode: null
  }),

  openNodeEditDialog: (node) => set({ 
    isNodeDialogOpen: true,
    editingNode: node 
  }),

  closeNodeDialog: () => set({ 
    isNodeDialogOpen: false,
    editingNode: null 
  }),

  openEdgeDialog: () => {
    set({ 
      isEdgeDialogOpen: true,
      editingEdge: null
    });
  },

  openEdgeEditDialog: (edge) => set({ 
    isEdgeDialogOpen: true,
    editingEdge: edge,
    selectedNodes: []
  }),

  closeEdgeDialog: () => set({ 
    isEdgeDialogOpen: false,
    editingEdge: null,
    selectedNodes: []
  }),

  addNode: (node) => {
    const { nodes, edges, currentHistoryIndex, history } = get();
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    const newState = {
      nodes: [...nodes, node],
      edges
    };

    set({
      nodes: newState.nodes,
      history: [...newHistory, newState],
      currentHistoryIndex: currentHistoryIndex + 1,
      canUndo: true,
      canRedo: false
    });
  },

  updateNode: (id, label) => {
    const { nodes, edges, currentHistoryIndex, history } = get();
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    const newNodes = nodes.map(node => 
      node.id === id ? { ...node, label } : node
    );
    const newState = { nodes: newNodes, edges };

    set({
      nodes: newNodes,
      history: [...newHistory, newState],
      currentHistoryIndex: currentHistoryIndex + 1,
      canUndo: true,
      canRedo: false
    });
  },

  addEdge: (edge) => {
    const { nodes, edges, currentHistoryIndex, history } = get();
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    const newState = {
      nodes,
      edges: [...edges, edge]
    };

    set({
      edges: newState.edges,
      history: [...newHistory, newState],
      currentHistoryIndex: currentHistoryIndex + 1,
      canUndo: true,
      canRedo: false
    });
  },

  updateEdge: (id, label) => {
    const { nodes, edges, currentHistoryIndex, history } = get();
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    const newEdges = edges.map(edge => 
      edge.id === id ? { ...edge, label } : edge
    );
    const newState = { nodes, edges: newEdges };

    set({
      edges: newEdges,
      history: [...newHistory, newState],
      currentHistoryIndex: currentHistoryIndex + 1,
      canUndo: true,
      canRedo: false
    });
  },

  deleteSelected: () => {
    const { nodes, edges, selectedElement, currentHistoryIndex, history } = get();
    if (!selectedElement) return;

    let newNodes = nodes;
    let newEdges = edges;

    if ('source' in selectedElement) {
      newEdges = edges.filter(e => e.id !== selectedElement.id);
    } else {
      newNodes = nodes.filter(n => n.id !== selectedElement.id);
      newEdges = edges.filter(e => e.source !== selectedElement.id && e.target !== selectedElement.id);
    }

    const newHistory = history.slice(0, currentHistoryIndex + 1);
    const newState = { nodes: newNodes, edges: newEdges };

    set({
      nodes: newState.nodes,
      edges: newState.edges,
      selectedElement: null,
      history: [...newHistory, newState],
      currentHistoryIndex: currentHistoryIndex + 1,
      canUndo: true,
      canRedo: false
    });
  },

  undo: () => {
    const { currentHistoryIndex, history } = get();
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      const state = history[newIndex];
      set({
        nodes: state.nodes,
        edges: state.edges,
        currentHistoryIndex: newIndex,
        canUndo: newIndex > 0,
        canRedo: true
      });
    }
  },

  redo: () => {
    const { currentHistoryIndex, history } = get();
    if (currentHistoryIndex < history.length - 1) {
      const newIndex = currentHistoryIndex + 1;
      const state = history[newIndex];
      set({
        nodes: state.nodes,
        edges: state.edges,
        currentHistoryIndex: newIndex,
        canUndo: true,
        canRedo: newIndex < history.length - 1
      });
    }
  }
}));