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
  isNodeDialogOpen: boolean;
  isEdgeDialogOpen: boolean;
  history: HistoryState[];
  currentHistoryIndex: number;
  
  setSelectedElement: (element: (Node | Edge) | null) => void;
  openNodeDialog: () => void;
  closeNodeDialog: () => void;
  openEdgeDialog: () => void;
  closeEdgeDialog: () => void;
  
  addNode: (node: Node) => void;
  addEdge: (edge: Edge) => void;
  deleteSelected: () => void;
  
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedElement: null,
  isNodeDialogOpen: false,
  isEdgeDialogOpen: false,
  history: [{ nodes: [], edges: [] }],
  currentHistoryIndex: 0,

  setSelectedElement: (element) => set({ selectedElement: element }),
  openNodeDialog: () => set({ isNodeDialogOpen: true }),
  closeNodeDialog: () => set({ isNodeDialogOpen: false }),
  openEdgeDialog: () => set({ isEdgeDialogOpen: true }),
  closeEdgeDialog: () => set({ isEdgeDialogOpen: false }),

  addNode: (node) => {
    const { nodes, edges, currentHistoryIndex, history } = get();
    const newState = {
      nodes: [...nodes, node],
      edges
    };
    
    set({
      nodes: newState.nodes,
      history: [...history.slice(0, currentHistoryIndex + 1), newState],
      currentHistoryIndex: currentHistoryIndex + 1
    });
  },

  addEdge: (edge) => {
    const { nodes, edges, currentHistoryIndex, history } = get();
    const newState = {
      nodes,
      edges: [...edges, edge]
    };
    
    set({
      edges: newState.edges,
      history: [...history.slice(0, currentHistoryIndex + 1), newState],
      currentHistoryIndex: currentHistoryIndex + 1
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

    const newState = { nodes: newNodes, edges: newEdges };
    
    set({
      nodes: newState.nodes,
      edges: newState.edges,
      selectedElement: null,
      history: [...history.slice(0, currentHistoryIndex + 1), newState],
      currentHistoryIndex: currentHistoryIndex + 1
    });
  },

  get canUndo() {
    return get().currentHistoryIndex > 0;
  },

  get canRedo() {
    return get().currentHistoryIndex < get().history.length - 1;
  },

  undo: () => {
    const { currentHistoryIndex, history } = get();
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      const state = history[newIndex];
      set({
        nodes: state.nodes,
        edges: state.edges,
        currentHistoryIndex: newIndex
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
        currentHistoryIndex: newIndex
      });
    }
  }
}));
