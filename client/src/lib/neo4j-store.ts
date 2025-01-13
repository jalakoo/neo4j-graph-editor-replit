import { create } from 'zustand';
import neo4j, { Driver, Session } from 'neo4j-driver';

interface Neo4jStore {
  url: string;
  username: string;
  isConnected: boolean;
  driver: Driver | null;
  error: string | null;

  connect: (url: string, username: string, password: string) => Promise<void>;
  disconnect: () => void;
  saveGraph: (nodes: any[], edges: any[]) => Promise<void>;
  loadGraph: () => Promise<{ nodes: any[], edges: any[] }>;
}

export const useNeo4jStore = create<Neo4jStore>((set, get) => ({
  url: '',
  username: '',
  isConnected: false,
  driver: null,
  error: null,

  connect: async (url: string, username: string, password: string) => {
    try {
      const driver = neo4j.driver(url, neo4j.auth.basic(username, password));
      await driver.verifyConnectivity();

      set({ 
        driver,
        url,
        username,
        isConnected: true,
        error: null
      });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Failed to connect to database',
        isConnected: false,
        driver: null
      });
    }
  },

  disconnect: () => {
    const { driver } = get();
    if (driver) {
      driver.close();
    }
    set({
      driver: null,
      isConnected: false,
      url: '',
      username: '',
      error: null
    });
  },

  saveGraph: async (nodes, edges) => {
    const { driver } = get();
    if (!driver) return;

    const session: Session = driver.session();
    try {
      await session.executeWrite(async (tx) => {
        // Clear existing graph
        await tx.run('MATCH (n) DETACH DELETE n');

        // Create nodes
        for (const node of nodes) {
          await tx.run(
            'CREATE (n:Node {id: $id, label: $label})',
            { id: node.id, label: node.label }
          );
        }

        // Create relationships
        for (const edge of edges) {
          await tx.run(
            `MATCH (source:Node {id: $sourceId})
             MATCH (target:Node {id: $targetId})
             CREATE (source)-[r:CONNECTS_TO {id: $id, label: $label}]->(target)`,
            { 
              id: edge.id,
              label: edge.label,
              sourceId: edge.source,
              targetId: edge.target
            }
          );
        }
      });
    } finally {
      await session.close();
    }
  },

  loadGraph: async () => {
    const { driver } = get();
    if (!driver) return { nodes: [], edges: [] };

    const session: Session = driver.session();
    try {
      const result = await session.executeRead(async (tx) => {
        // Load all nodes with their properties
        const nodesResult = await tx.run('MATCH (n:Node) RETURN n');
        const nodes = nodesResult.records.map(record => {
          const node = record.get('n');
          return {
            id: node.properties.id,
            label: node.properties.label
          };
        });

        // Load all relationships with their properties
        const edgesResult = await tx.run(
          `MATCH (source:Node)-[r:CONNECTS_TO]->(target:Node)
           RETURN r.id as id, r.label as label, source.id as source, target.id as target`
        );

        const edges = edgesResult.records.map(record => ({
          id: record.get('id'),
          label: record.get('label'),
          source: record.get('source'),
          target: record.get('target')
        }));

        return { nodes, edges };
      });

      return result;
    } finally {
      await session.close();
    }
  }
}));