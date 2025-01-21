import { create } from 'zustand';
import neo4j, { Driver, Session } from 'neo4j-driver';
import { getCookie, setCookie, deleteCookie } from './cookie-utils';

interface PointValue {
  latitude: number;
  longitude: number;
  height?: number;
}

interface Neo4jStore {
  url: string;
  username: string;
  isConnected: boolean;
  driver: Driver | null;
  error: string | null;

  connect: (url: string, username: string, password: string) => Promise<void>;
  disconnect: () => void;
  loadGraph: () => Promise<{ nodes: any[], edges: any[] }>;
  updateProperty: (elementId: string, key: string, value: any, isNode: boolean) => Promise<void>;
  refreshElement: (elementId: string, isNode: boolean) => Promise<any>;
  createNode: (node: { id: string; label: string; [key: string]: any }) => Promise<void>;
  createEdge: (edge: { id: string; source: string; target: string; label: string; [key: string]: any }) => Promise<void>;
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
      const driver = neo4j.driver(url, neo4j.auth.basic(username, password), {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2000, // 2 seconds
      });

      // Verify connectivity with timeout
      await Promise.race([
        driver.verifyConnectivity(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
      ]);

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

  createNode: async (node) => {
    const { driver } = get();
    if (!driver) throw new Error("Not connected to database");

    const session: Session = driver.session();
    try {
      await session.executeWrite(async (tx) => {
        // Convert properties to Neo4j format
        const properties = { ...node };
        delete properties.id;
        delete properties.label;

        await tx.run(`
          CREATE (n:Node)
          SET n = $properties
          SET n.id = $id
          SET n.name = $label
          RETURN n
        `, {
          id: node.id,
          label: node.label,
          properties
        });
      });
    } catch (error) {
      console.error('Error creating node:', error);
      throw error;
    } finally {
      await session.close();
    }
  },

  createEdge: async (edge) => {
    const { driver } = get();
    if (!driver) throw new Error("Not connected to database");

    const session: Session = driver.session();
    try {
      await session.executeWrite(async (tx) => {
        // Convert properties to Neo4j format
        const properties = { ...edge };
        delete properties.id;
        delete properties.label;
        delete properties.source;
        delete properties.target;

        await tx.run(`
          MATCH (source:Node {id: $sourceId})
          MATCH (target:Node {id: $targetId})
          CREATE (source)-[r:RELATES_TO]->(target)
          SET r = $properties
          SET r.id = $id
          SET r.label = $label
          RETURN r
        `, {
          sourceId: edge.source,
          targetId: edge.target,
          id: edge.id,
          label: edge.label,
          properties
        });
      });
    } catch (error) {
      console.error('Error creating edge:', error);
      throw error;
    } finally {
      await session.close();
    }
  },

  loadGraph: async () => {
    const { driver } = get();
    if (!driver) throw new Error("Not connected to database");

    const session: Session = driver.session();
    try {
      const result = await session.executeRead(async (tx) => {
        console.log('Loading nodes from Neo4j...');
        const nodesResult = await tx.run(`
          MATCH (n:Node)
          RETURN 
            n.id as id,
            n.name as label,
            properties(n) as properties,
            id(n) as elementId
        `);

        const nodes = nodesResult.records.map(record => {
          const id = record.get('id');
          const label = record.get('label');
          const properties = record.get('properties');
          const elementId = record.get('elementId').toString();

          const node = {
            id: id || elementId,
            label: label || id || elementId,
            ...properties
          };
          console.log('Loaded node:', node);
          return node;
        });

        console.log('Loading edges from Neo4j...');
        const edgesResult = await tx.run(`
          MATCH (source:Node)-[r]->(target:Node)
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

          const edge = {
            id: id || elementId,
            label: label || type || 'connects to',
            source: sourceId,
            target: targetId,
            type,
            ...properties
          };
          console.log('Loaded edge:', edge);
          return edge;
        });

        console.log('Total nodes:', nodes.length, 'Total edges:', edges.length);
        return { nodes, edges };
      });

      return result;
    } catch (error) {
      console.error('Error loading graph:', error);
      throw error;
    } finally {
      await session.close();
    }
  },

  updateProperty: async (elementId: string, key: string, value: any, isNode: boolean) => {
    const { driver } = get();
    if (!driver) throw new Error("Not connected to database");

    const session: Session = driver.session();
    try {
      await session.executeWrite(async (tx) => {
        // Convert the value based on its type
        let convertedValue = value;
        let useRawValue = false;

        if (typeof value === 'string') {
          // Try to parse numbers and booleans from strings
          if (value.toLowerCase() === 'true') convertedValue = true;
          else if (value.toLowerCase() === 'false') convertedValue = false;
          else if (!isNaN(Number(value))) {
            // If it's a whole number, treat as integer
            if (Number.isInteger(Number(value))) {
              convertedValue = `toInteger(${Number(value)})`;
            } else {
              convertedValue = Number(value);
            }
          } else if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
            // ISO 8601 datetime string
            convertedValue = `datetime('${value}')`;
            useRawValue = true;
          }
        } else if (Number.isInteger(value)) {
          // If the value is already an integer
          convertedValue = `toInteger(${value})`;
        } else if (typeof value === 'object' && 'latitude' in value && 'longitude' in value) {
          // Handle point type
          const point = value as PointValue;
          if ('height' in point && point.height !== undefined) {
            convertedValue = `point({ latitude: ${point.latitude}, longitude: ${point.longitude}, height: ${point.height} })`;
          } else {
            convertedValue = `point({ latitude: ${point.latitude}, longitude: ${point.longitude} })`;
          }
          useRawValue = true;
        }

        const query = isNode
          ? `
            MATCH (n:Node)
            WHERE n.id = $elementId OR ID(n) = toInteger($elementId)
            SET n[$key] = ${useRawValue ? convertedValue :
              typeof convertedValue === 'string' && convertedValue.startsWith('toInteger')
                ? convertedValue
                : '$value'}
            RETURN n
          `
          : `
            MATCH ()-[r]->()
            WHERE r.id = $elementId OR ID(r) = toInteger($elementId)
            SET r[$key] = ${useRawValue ? convertedValue :
              typeof convertedValue === 'string' && convertedValue.startsWith('toInteger')
                ? convertedValue
                : '$value'}
            RETURN r
          `;

        const result = await tx.run(query, {
          elementId,
          key,
          value: useRawValue ? null : (
            typeof convertedValue === 'string' && convertedValue.startsWith('toInteger')
              ? parseInt(convertedValue.replace('toInteger(', '').replace(')', ''), 10)
              : convertedValue
          )
        });

        if (result.records.length === 0) {
          throw new Error(`${isNode ? 'Node' : 'Relationship'} not found`);
        }
      });
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
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
            MATCH (n:Node)
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
            label: name || id || neoId,
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
    } catch (error) {
      console.error('Error refreshing element:', error);
      throw error;
    } finally {
      await session.close();
    }
  }
}));