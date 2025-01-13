import { create } from 'zustand';
import neo4j, { Driver, Session } from 'neo4j-driver';
import { getCookie, setCookie, deleteCookie } from './cookie-utils';

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

// Cookie names
const URL_COOKIE = 'neo4j_url';
const USERNAME_COOKIE = 'neo4j_username';

// Initialize store with saved credentials
const savedUrl = getCookie(URL_COOKIE) || '';
const savedUsername = getCookie(USERNAME_COOKIE) || '';

export const useNeo4jStore = create<Neo4jStore>((set, get) => ({
  url: savedUrl,
  username: savedUsername,
  isConnected: false,
  driver: null,
  error: null,

  connect: async (url: string, username: string, password: string) => {
    try {
      const driver = neo4j.driver(url, neo4j.auth.basic(username, password));
      await driver.verifyConnectivity();

      // Save credentials to cookies
      setCookie(URL_COOKIE, url);
      setCookie(USERNAME_COOKIE, username);

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
    // Clear cookies
    deleteCookie(URL_COOKIE);
    deleteCookie(USERNAME_COOKIE);

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
        // Load all nodes, using name property for label if available
        const nodesResult = await tx.run(`
          MATCH (n)
          RETURN 
            id(n) as elementId,
            properties(n) as props
        `);

        const nodes = nodesResult.records.map(record => {
          const props = record.get('props');
          const elementId = record.get('elementId').toString();
          return {
            id: props.id || elementId,
            label: props.name || elementId // Use name if available, fallback to elementId
          };
        });

        // Load all relationships with their properties
        const edgesResult = await tx.run(`
          MATCH (source)-[r]->(target)
          RETURN 
            id(r) as elementId,
            type(r) as type,
            properties(r) as props,
            source.id as sourceId,
            target.id as targetId,
            id(source) as sourceElementId,
            id(target) as targetElementId
        `);

        const edges = edgesResult.records.map(record => {
          const props = record.get('props');
          const elementId = record.get('elementId').toString();
          const sourceId = record.get('sourceId') || record.get('sourceElementId').toString();
          const targetId = record.get('targetId') || record.get('targetElementId').toString();

          return {
            id: props.id || elementId,
            label: props.label || record.get('type'),
            source: sourceId,
            target: targetId
          };
        });

        return { nodes, edges };
      });

      return result;
    } finally {
      await session.close();
    }
  }
}));