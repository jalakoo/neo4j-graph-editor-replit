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
  updateProperty: (elementId: string, key: string, value: string, isNode: boolean) => Promise<void>;
  refreshElement: (elementId: string, isNode: boolean) => Promise<any>;
}

// Cookie names
const URL_COOKIE = 'neo4j_url';
const USERNAME_COOKIE = 'neo4j_username';
const PASSWORD_COOKIE = 'neo4j_password'; // Temporary storage for auto-connection

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

      // Save credentials to cookies with explicit options
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

        // Create nodes
        for (const node of nodes) {
          await tx.run(
            'CREATE (n:Node {id: $id, name: $name})',
            { id: node.id, name: node.label }
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
        // Load all nodes with all their properties
        const nodesResult = await tx.run(`
          MATCH (n)
          RETURN 
            n.id as id,
            n.name as name,
            properties(n) as properties,
            id(n) as elementId
        `);

        const nodes = nodesResult.records.map(record => {
          const id = record.get('id');
          const name = record.get('name');
          const properties = record.get('properties');
          const elementId = record.get('elementId').toString();

          return {
            id: id || elementId,
            label: name || elementId,
            ...properties
          };
        });

        // Load all relationships with all their properties
        const edgesResult = await tx.run(`
          MATCH (source)-[r]->(target)
          RETURN 
            r.id as id,
            r.label as label,
            properties(r) as properties,
            source.id as sourceId,
            target.id as targetId,
            id(r) as elementId,
            id(source) as sourceElementId,
            id(target) as targetElementId,
            type(r) as type
        `);

        const edges = edgesResult.records.map(record => {
          const id = record.get('id');
          const label = record.get('label');
          const properties = record.get('properties');
          const elementId = record.get('elementId').toString();
          const sourceId = record.get('sourceId') || record.get('sourceElementId').toString();
          const targetId = record.get('targetId') || record.get('targetElementId').toString();
          const type = record.get('type');

          return {
            id: id || elementId,
            label: label || type || 'connects to',
            source: sourceId,
            target: targetId,
            type,
            ...properties
          };
        });

        return { nodes, edges };
      });

      return result;
    } finally {
      await session.close();
    }
  },
  updateProperty: async (elementId: string, key: string, value: string, isNode: boolean) => {
    const { driver } = get();
    if (!driver) throw new Error("Not connected to database");

    const session: Session = driver.session();
    try {
      await session.executeWrite(async (tx) => {
        const query = isNode
          ? `
            MATCH (n)
            WHERE n.id = $elementId OR ID(n) = toInteger($elementId)
            SET n[$key] = $value
            RETURN n
          `
          : `
            MATCH ()-[r]->()
            WHERE r.id = $elementId OR ID(r) = toInteger($elementId)
            SET r[$key] = $value
            RETURN r
          `;

        await tx.run(query, { elementId, key, value });
      });
    } finally {
      await session.close();
    }
  },

  refreshElement: async (elementId: string, isNode: boolean) => {
    const { driver } = get();
    if (!driver) throw new Error("Not connected to database");

    const session: Session = driver.session();
    try {
      const result = await session.executeRead(async (tx) => {
        if (isNode) {
          const { records } = await tx.run(`
            MATCH (n)
            WHERE n.id = $elementId OR ID(n) = toInteger($elementId)
            RETURN 
              n.id as id,
              n.name as name,
              properties(n) as properties,
              id(n) as elementId
          `, { elementId });

          if (records.length === 0) return null;

          const record = records[0];
          const id = record.get('id');
          const name = record.get('name');
          const properties = record.get('properties');
          const neoId = record.get('elementId').toString();

          return {
            id: id || neoId,
            label: name || neoId,
            ...properties
          };
        } else {
          const { records } = await tx.run(`
            MATCH ()-[r]->()
            WHERE r.id = $elementId OR ID(r) = toInteger($elementId)
            RETURN 
              r.id as id,
              r.label as label,
              properties(r) as properties,
              id(r) as elementId,
              type(r) as type
          `, { elementId });

          if (records.length === 0) return null;

          const record = records[0];
          const id = record.get('id');
          const label = record.get('label');
          const properties = record.get('properties');
          const neoId = record.get('elementId').toString();
          const type = record.get('type');

          return {
            id: id || neoId,
            label: label || type || 'connects to',
            ...properties
          };
        }
      });

      return result;
    } finally {
      await session.close();
    }
  }
}));