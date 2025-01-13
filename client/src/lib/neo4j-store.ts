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

console.log('Loading saved credentials:', { savedUrl, savedUsername });

export const useNeo4jStore = create<Neo4jStore>((set, get) => ({
  url: savedUrl,
  username: savedUsername,
  isConnected: false,
  driver: null,
  error: null,

  connect: async (url: string, username: string, password: string) => {
    try {
      console.log('Connecting with credentials:', { url, username });
      const driver = neo4j.driver(url, neo4j.auth.basic(username, password));
      await driver.verifyConnectivity();

      // Save credentials to cookies
      setCookie(URL_COOKIE, url);
      setCookie(USERNAME_COOKIE, username);

      console.log('Saved credentials to cookies');

      set({ 
        driver,
        url,
        username,
        isConnected: true,
        error: null
      });
    } catch (err) {
      console.error('Connection error:', err);
      set({ 
        error: err instanceof Error ? err.message : 'Failed to connect to database',
        isConnected: false,
        driver: null
      });
      throw err;
    }
  },

  disconnect: () => {
    const { driver } = get();
    if (driver) {
      driver.close();
    }

    // Clear cookies
    console.log('Clearing cookies');
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

        // Create nodes with all properties
        for (const node of nodes) {
          const { id, label, ...properties } = node;
          await tx.run(
            'CREATE (n:Node $properties)',
            { properties: { id, label, ...properties } }
          );
        }

        // Create relationships with all properties
        for (const edge of edges) {
          const { id, label, source, target, ...properties } = edge;
          await tx.run(
            `MATCH (source:Node {id: $sourceId})
             MATCH (target:Node {id: $targetId})
             CREATE (source)-[r:CONNECTS_TO $properties]->(target)`,
            { 
              sourceId: source,
              targetId: target,
              properties: { id, label, ...properties }
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
        // Load all nodes with all their properties
        const nodesResult = await tx.run(`
          MATCH (n:Node)
          RETURN properties(n) as props
        `);

        const nodes = nodesResult.records.map(record => {
          const props = record.get('props');
          return props; // Return all properties directly
        });

        // Load all relationships with all their properties
        const edgesResult = await tx.run(`
          MATCH (source:Node)-[r:CONNECTS_TO]->(target:Node)
          RETURN 
            properties(r) as props,
            source.id as sourceId,
            target.id as targetId
        `);

        const edges = edgesResult.records.map(record => {
          const props = record.get('props');
          const sourceId = record.get('sourceId');
          const targetId = record.get('targetId');

          return {
            ...props,
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