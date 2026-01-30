
import { MCPDefinition, MCPType } from '../types';
import { db } from './db';
import { Database, Network, Calculator, BookOpen } from 'lucide-react';

export const AVAILABLE_MCPS: MCPDefinition[] = [
    {
        id: 'text2sql',
        name: 'ERP-Text2SQL',
        description: '基于自然语言查询后台数据库 (Orders, Inventory, Nodes)',
        icon: 'Database',
        color: 'bg-blue-100 text-blue-700',
        enabled: true
    },
    {
        id: 'graph_topology',
        name: 'Graph Topology',
        description: '分析供应链上下游依赖关系与传播路径',
        icon: 'Network',
        color: 'bg-purple-100 text-purple-700',
        enabled: false
    },
    {
        id: 'simulation',
        name: 'Sim-Engine',
        description: '蒙特卡洛/离散事件仿真推演引擎',
        icon: 'Calculator',
        color: 'bg-orange-100 text-orange-700',
        enabled: false
    },
    {
        id: 'rag',
        name: 'Knowledge RAG',
        description: '检索企业SOP、合同与非结构化文档',
        icon: 'BookOpen',
        color: 'bg-emerald-100 text-emerald-700',
        enabled: false
    }
];

// --- MCP Executors ---

/**
 * Simulates a Text-to-SQL agent.
 * In a real app, this would use an LLM to generate SQL/ORM queries.
 * Here, we use heuristics to map intent to Dexie DB calls.
 */
export async function executeText2SQL(intent: string, entities: string[]) {
    const lowerIntent = intent.toLowerCase();
    
    let result = null;
    let explanation = "";

    // 1. Inventory Queries
    if (lowerIntent.includes('库存') || lowerIntent.includes('inventory')) {
        if (lowerIntent.includes('所有') || lowerIntent.includes('total') || lowerIntent.includes('summary')) {
            const data = await db.getInventorySummary();
            result = data;
            explanation = "Executed: SELECT name, inventoryLevel FROM nodes WHERE type='BASE'";
        } else {
            // Specific node inventory
            const targetNode = entities.find(e => true); // Simple pick first entity found in text
            if (targetNode) {
                const node = await db.nodes.where('name').equals(targetNode).first();
                if (node) {
                    result = { name: node.name, inventory: node.inventoryLevel, status: node.status };
                    explanation = `Executed: SELECT inventoryLevel FROM nodes WHERE name='${targetNode}'`;
                }
            } else {
                // Default: Critical inventory
                const critical = await db.nodes.where('inventoryLevel').below(2000).and(n => n.type === 'BASE').toArray();
                result = critical.map(n => ({ name: n.name, inventory: n.inventoryLevel }));
                explanation = "Executed: SELECT * FROM nodes WHERE inventoryLevel < 2000";
            }
        }
    } 
    
    // 2. Order Queries
    else if (lowerIntent.includes('订单') || lowerIntent.includes('order')) {
        if (lowerIntent.includes('延期') || lowerIntent.includes('delay')) {
            const delayed = await db.getDelayedOrders();
            result = delayed;
            explanation = "Executed: SELECT * FROM orders WHERE status='delayed'";
        } else if (lowerIntent.includes('客户') || lowerIntent.includes('customer')) {
             // Mock join query
             const orders = await db.orders.toArray();
             // Simple aggregation
             const summary = orders.reduce((acc: any, curr) => {
                 acc[curr.product] = (acc[curr.product] || 0) + curr.volume;
                 return acc;
             }, {});
             result = summary;
             explanation = "Executed: SELECT product, SUM(volume) FROM orders GROUP BY product";
        }
    }

    return { result, explanation };
}

/**
 * Simulates Graph Topology Analysis
 */
export async function executeGraphTopology(nodeName: string) {
    const node = await db.nodes.where('name').equals(nodeName).first();
    if (!node) return { result: "Node not found", explanation: "Error" };

    // Find links where this node is source (Downstream) or target (Upstream)
    const downstreamLinks = await db.links.where('source').equals(node.id).toArray();
    const upstreamLinks = await db.links.where('target').equals(node.id).toArray();

    const downstreamIds = downstreamLinks.map(l => l.target);
    const upstreamIds = upstreamLinks.map(l => l.source);

    // Fetch names
    const downstreamNodes = await db.nodes.bulkGet(downstreamIds);
    const upstreamNodes = await db.nodes.bulkGet(upstreamIds);

    return {
        result: {
            node: node.name,
            upstream: upstreamNodes.map(n => n?.name),
            downstream: downstreamNodes.map(n => n?.name)
        },
        explanation: `Graph Traversal: Found ${upstreamNodes.length} upstream and ${downstreamNodes.length} downstream dependencies.`
    };
}
