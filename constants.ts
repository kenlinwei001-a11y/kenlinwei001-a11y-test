
import { ConstraintCategory, GraphData, NodeType, NodeData, LinkData, ScenarioEvent, ProductionLineData, OrderData } from './types';

// Existing Constraints
export const INITIAL_CONSTRAINTS: ConstraintCategory[] = [
  {
    id: 'orders',
    name: '订单优先级与交付约束',
    items: [
      { 
        id: 'c1', 
        label: '订单锁定不做调整', 
        description: '冻结期内订单禁止变更，保障排产稳定性', 
        enabled: true, 
        impactLevel: 'high',
        logic: { relationType: 'TRIGGER', attribute: 'status', operator: '=', value: 'LOCKED', actionDescription: 'Reject changes' }
      },
      { 
        id: 'c2', 
        label: '战略客户优先分配', 
        description: '高利润/战略级客户优先保障资源分配', 
        enabled: true, 
        impactLevel: 'high',
        logic: { relationType: 'IMPACT', attribute: 'priority', operator: '=', value: 'VIP', actionDescription: 'Allocate first' }
      },
      { 
        id: 'c3', 
        label: '跨基地拆分交付', 
        description: '允许将单个大订单拆分至不同基地生产', 
        enabled: false, 
        impactLevel: 'medium',
        logic: { relationType: 'QUERY', attribute: 'volume', operator: '>', value: 10000, actionDescription: 'Split order' }
      },
    ]
  },
  {
    id: 'production',
    name: '产能与产线约束',
    items: [
      { id: 'c4', label: '产线专线专用', description: '特定型号仅在认证产线生产，避免频繁转产', enabled: true, impactLevel: 'high', logic: { relationType: 'TRIGGER', actionDescription: 'Limit routing' } },
      { id: 'c5', label: '最小批量限制', description: '低于最小经济批量不排产', enabled: true, impactLevel: 'medium', logic: { relationType: 'TRIGGER', attribute: 'quantity', operator: '<', value: 500 } },
    ]
  },
  {
    id: 'inventory',
    name: '物料与库存约束',
    items: [
      { id: 'c7', label: '安全库存硬性红线', description: '低于安全水位立即触发紧急采购', enabled: true, impactLevel: 'high', logic: { relationType: 'TRIGGER', attribute: 'inventoryLevel', operator: '<', value: 2000, actionDescription: 'Trigger PO' } },
    ]
  }
];

// New: Simulation Scenarios
export const INITIAL_SCENARIOS: ScenarioEvent[] = [
  {
    id: 'evt_supply_delay',
    type: 'SUPPLY_DELAY',
    label: '赣锋锂业 - 原料物流延期',
    description: '受暴雨影响，原料预计延期7天抵达常州/洛阳基地，影响排产。',
    targetNodeId: 'sup-0', // Maps to 赣锋锂业
    severity: 'high',
    active: false
  },
  {
    id: 'evt_demand_spike',
    type: 'DEMAND_SPIKE',
    label: '小鹏 - 交付提前',
    description: '客户要求W42批次提前3天交付，需插单生产。',
    targetNodeId: 'cust-0', // Maps to 小鹏
    severity: 'medium',
    active: false
  },
  {
    id: 'evt_forecast_drop',
    type: 'FORECAST_DROP',
    label: '马自达 - 季度预测缩减',
    description: 'Q4销售预测下调15%，导致专用产线产能过剩。',
    targetNodeId: 'cust-2', // Maps to 马自达
    severity: 'medium',
    active: false
  },
  {
    id: 'evt_inventory_overflow',
    type: 'INVENTORY_OVERFLOW',
    label: '江门基地 - NCM成品积压',
    description: '成品库存超过警戒水位线20%，需优先去库存。',
    targetNodeId: 'base-8', // Maps to 江门基地
    severity: 'high',
    active: false
  }
];

// Helper to generate sparkline data
const generateInventoryHistory = (baseLevel: number) => {
    return Array.from({ length: 14 }, (_, i) => ({
        day: `D-${14-i}`,
        value: baseLevel * (0.8 + Math.random() * 0.4), // +/- variance
        safeLine: 2000
    }));
};

const generateProductionLines = (baseId: string): ProductionLineData[] => {
    const types: ('LFP' | 'NCM' | 'Pack')[] = ['LFP', 'NCM', 'Pack'];
    return Array.from({ length: 3 }, (_, i) => ({
        id: `${baseId}-line-${i}`,
        name: `Line ${i+1} (${types[i]})`,
        type: types[i],
        status: Math.random() > 0.85 ? 'maintenance' : (Math.random() > 0.9 ? 'error' : 'running'),
        efficiency: 92 + Math.random() * 6, // 92-98%
        yieldRate: 95 + Math.random() * 4, // 95-99%
        currentProduct: types[i] === 'Pack' ? 'Pack-590Mod' : 'Cell-280Ah'
    }));
};

// Generate realistic orders based on a target volume to match forecast logic
const generateOrders = (custId: string, targetVolume: number): OrderData[] => {
    const orderCount = Math.floor(Math.random() * 3) + 2; // 2 to 4 orders
    const orders: OrderData[] = [];
    let currentTotal = 0;

    for (let i = 0; i < orderCount - 1; i++) {
        // Distribute 20-50% of target to each order
        const vol = Math.floor((targetVolume - currentTotal) * (0.2 + Math.random() * 0.3));
        currentTotal += vol;
        orders.push({
            id: `ORD-${custId.split('-')[1]}-${100+i}`,
            product: Math.random() > 0.5 ? '5系高压三元' : '磷酸铁锂-储能',
            volume: vol,
            progress: Math.floor(Math.random() * 90),
            dueDate: `2024-11-${15 + i*5}`,
            status: Math.random() > 0.85 ? 'delayed' : 'on-track'
        });
    }

    // Add remaining volume to last order to ensure sum ≈ target
    const remaining = Math.max(100, targetVolume - currentTotal);
    orders.push({
        id: `ORD-${custId.split('-')[1]}-${100+orderCount-1}`,
        product: 'Battery',
        volume: remaining,
        progress: Math.floor(Math.random() * 90),
        dueDate: `2024-12-05`,
        status: Math.random() > 0.9 ? 'delayed' : 'on-track'
    });
    
    return orders;
};

// Generate Mock Data for the Graph
const generateMockData = (): GraphData => {
  const nodes: NodeData[] = [];
  const links: LinkData[] = [];

  // 1. Suppliers (10)
  const supplierNames = ['赣锋锂业', '天齐锂业', '杉杉股份', '恩捷股份', '天赐材料', '容百科技', '当升科技', '中伟股份', '诺德股份', '璞泰来'];
  supplierNames.forEach((name, i) => {
    // Random status
    const rand = Math.random();
    const status = rand > 0.9 ? 'critical' : rand > 0.8 ? 'warning' : 'normal';
    
    nodes.push({
      id: `sup-${i}`,
      name,
      type: NodeType.SUPPLIER,
      status: status as any,
      inventoryLevel: Math.floor(Math.random() * 5000) + 1000,
      activeAlerts: status !== 'normal' ? 1 + Math.floor(Math.random() * 2) : 0,
      deliveryAccuracy: 95 + Math.random() * 5
    });
  });

  // 2. Bases (10)
  const baseLocations = ['常州基地', '洛阳基地', '厦门基地', '成都基地', '武汉基地', '合肥基地', '黑龙江基地', '广州基地', '江门基地', '眉山基地'];
  baseLocations.forEach((name, i) => {
    const inventory = Math.floor(Math.random() * 20000) + 5000;
    // Random status
    const rand = Math.random();
    const status = rand > 0.85 ? 'critical' : rand > 0.7 ? 'warning' : 'normal';

    nodes.push({
      id: `base-${i}`,
      name,
      type: NodeType.BASE,
      status: status as any,
      capacityUtilization: 85 + Math.random() * 10,
      inventoryLevel: inventory,
      inventoryCapacity: 30000,
      inventoryHistory: generateInventoryHistory(inventory),
      productionLines: generateProductionLines(`base-${i}`),
      activeAlerts: status !== 'normal' ? 2 : 0,
      details: {
        batchDelivery: ['2023-W42', '2023-W44', '2023-W46'],
        monthlyForecast: [120, 130, 145, 140, 155, 160],
        actualSales: [118, 129, 142, 138, 150, 158]
      }
    });
  });

  // 3. Customers (7)
  const customers = ['小鹏', '广汽', '马自达', '长安', '深蓝', '东风乘用车', '零跑'];
  customers.forEach((name, i) => {
    // Generate Forecast (Base 5000-10000)
    const forecast = Math.floor(Math.random() * 5000) + 5000;
    
    // Generate Target Order Volume
    const ratio = 0.7 + (Math.random() * 0.6); // Range: 0.7x to 1.3x
    const targetOrderVolume = Math.floor(forecast * ratio);
    
    // Random status
    const rand = Math.random();
    const status = rand > 0.9 ? 'critical' : rand > 0.8 ? 'warning' : 'normal';

    nodes.push({
      id: `cust-${i}`,
      name,
      type: NodeType.CUSTOMER,
      status: status as any,
      demandForecast: forecast,
      deliveryAccuracy: 92 + Math.random() * 8,
      onTimeRate: 90 + Math.random() * 10,
      activeOrders: generateOrders(`cust-${i}`, targetOrderVolume),
      activeAlerts: status !== 'normal' ? 1 : 0,
      supplyingBases: [], // Filled during linking
      details: {
        batchDelivery: ['批次A-101', '批次B-202', '批次C-303'],
        monthlyForecast: Array.from({length: 6}, () => Math.floor(Math.random() * 1000) + 500),
        actualSales: []
      }
    });
  });

  // Generate Links
  // Suppliers -> Bases
  nodes.filter(n => n.type === NodeType.SUPPLIER).forEach((sup, i) => {
    let targetIndices = [];
    if (i === 0) {
      targetIndices = [0, 1, 4];
    } else {
       targetIndices = [
        (i + 1) % 10, 
        (i + 3) % 10
      ];
    }
    
    targetIndices.forEach(baseIndex => {
      // Simulate Material Flow Volume (e.g., Tons/Month)
      const flowVolume = Math.floor(Math.random() * 800) + 200;
      links.push({
        source: sup.id,
        target: `base-${baseIndex}`,
        value: flowVolume,
        type: 'material',
        status: sup.status === 'critical' ? 'critical' : 'normal'
      });
    });
  });

  // Bases -> Customers (Explicit Logic)
  const customerCount = customers.length;
  nodes.filter(n => n.type === NodeType.BASE).forEach((base, i) => {
    // Distribute bases to customers in a round-robin + overlap fashion to ensure connectivity
    const custIndex1 = i % customerCount;
    const custIndex2 = (i + 1) % customerCount;
    
    // Add extra random connection for density for first few bases
    const targets = [custIndex1, custIndex2];
    if (i < 3) targets.push((i + 3) % customerCount);

    targets.forEach(custIndex => {
      const custNode = nodes.find(n => n.id === `cust-${custIndex}`);
      if (custNode && custNode.supplyingBases) {
          // Avoid duplicates in the supplying bases list text
          if (!custNode.supplyingBases.includes(base.name)) {
              custNode.supplyingBases.push(base.name);
          }
      }

      const isMainRoute = Math.random() > 0.6;
      const flowVolume = isMainRoute ? Math.floor(Math.random() * 3000) + 2000 : Math.floor(Math.random() * 1000) + 500;
      
      links.push({
        source: base.id,
        target: `cust-${custIndex}`,
        value: flowVolume,
        type: 'pack',
        status: base.status === 'critical' ? 'critical' : 'normal'
      });
    });
  });

  return { nodes, links };
};

export const MOCK_DATA = generateMockData();
