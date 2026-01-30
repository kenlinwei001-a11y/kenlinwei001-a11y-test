
import Dexie, { Table } from 'dexie';
import { NodeData, LinkData, OrderData } from '../types';
import { MOCK_DATA } from '../constants';

// Define the Database
class SupplyChainDB extends Dexie {
  nodes!: Table<NodeData, string>;
  links!: Table<LinkData, number>;
  orders!: Table<OrderData, string>;

  constructor() {
    super('SupplyChainDigitalTwinDB');
    (this as any).version(1).stores({
      nodes: 'id, name, type, status, inventoryLevel',
      links: '++id, source, target, type',
      orders: 'id, status, product, customerId' // Foreign keys or searchable fields
    });
  }

  // Seeding function to populate DB from Mock Data if empty
  async seed() {
    const nodeCount = await this.nodes.count();
    if (nodeCount === 0) {
      console.log("Seeding database with initial MOCK_DATA...");
      
      // 1. Add Nodes
      await this.nodes.bulkAdd(MOCK_DATA.nodes);
      
      // 2. Add Links
      await this.links.bulkAdd(MOCK_DATA.links);

      // 3. Extract and Add Orders (Flattened)
      const allOrders: OrderData[] = [];
      MOCK_DATA.nodes.forEach(node => {
          if (node.activeOrders) {
              node.activeOrders.forEach(order => {
                  allOrders.push({
                      ...order,
                      customerId: node.id
                  });
              });
          }
      });
      await this.orders.bulkAdd(allOrders);
      
      console.log("Database seeding complete.");
    } else {
        console.log("Database already populated.");
    }
  }

  // --- Analytical Queries (Simulating SQL views) ---

  async getInventorySummary() {
      const bases = await this.nodes.where('type').equals('BASE').toArray();
      return bases.map(b => ({
          name: b.name,
          inventory: b.inventoryLevel,
          capacity: b.inventoryCapacity,
          status: b.status
      }));
  }

  async getDelayedOrders() {
      return await this.orders.where('status').equals('delayed').toArray();
  }

  async getCriticalNodes() {
      return await this.nodes.where('status').equals('critical').toArray();
  }
}

export const db = new SupplyChainDB();
