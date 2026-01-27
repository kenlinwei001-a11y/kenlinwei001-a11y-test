import { ConstraintCategory, GraphData, NodeType, NodeData, LinkData, ScenarioEvent } from './types';

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
    description: '受暴雨影响，原料预计延期7天抵达宁德/宜宾基地，影响排产。',
    targetNodeId: 'sup-0', // Maps to 赣锋锂业
    severity: 'high',
    active: false
  },
  {
    id: 'evt_demand_spike',
    type: 'DEMAND_SPIKE',
    label: '某头部新势力A - 交付提前',
    description: '客户要求W42批次提前3天交付，需插单生产。',
    targetNodeId: 'cust-0', // Maps to 某头部新势力A
    severity: 'medium',
    active: false
  },
  {
    id: 'evt_forecast_drop',
    type: 'FORECAST_DROP',
    label: '国际巨头C - 季度预测缩减',
    description: 'Q4销售预测下调15%，导致专用产线产能过剩。',
    targetNodeId: 'cust-2', // Maps to 国际巨头C
    severity: 'medium',
    active: false
  },
  {
    id: 'evt_inventory_overflow',
    type: 'INVENTORY_OVERFLOW',
    label: '福鼎基地 - NCM成品积压',
    description: '成品库存超过警戒水位线20%，需优先去库存。',
    targetNodeId: 'base-8', // Maps to 福鼎基地
    severity: 'high',
    active: false
  }
];

// Generate Mock Data for the Graph
const generateMockData = (): GraphData => {
  const nodes: NodeData[] = [];
  const links: LinkData[] = [];

  // 1. Suppliers (10)
  const supplierNames = ['赣锋锂业', '天齐锂业', '杉杉股份', '恩捷股份', '天赐材料', '容百科技', '当升科技', '中伟股份', '诺德股份', '璞泰来'];
  supplierNames.forEach((name, i) => {
    nodes.push({
      id: `sup-${i}`,
      name,
      type: NodeType.SUPPLIER,
      status: 'normal',
      inventoryLevel: Math.floor(Math.random() * 5000) + 1000,
      activeAlerts: Math.random() > 0.8 ? 1 : 0
    });
  });

  // 2. Bases (10)
  const baseLocations = ['宁德基地', '宜宾基地', '溧阳基地', '西宁基地', '肇庆基地', '宜春基地', '贵阳基地', '厦门基地', '福鼎基地', '德国图林根'];
  baseLocations.forEach((name, i) => {
    nodes.push({
      id: `base-${i}`,
      name,
      type: NodeType.BASE,
      status: 'normal',
      capacityUtilization: 85 + Math.random() * 10,
      inventoryLevel: Math.floor(Math.random() * 20000) + 5000,
      details: {
        batchDelivery: ['2023-W42', '2023-W44', '2023-W46'],
        monthlyForecast: [120, 130, 145, 140, 155, 160],
        actualSales: [118, 129, 142, 138, 150, 158]
      }
    });
  });

  // 3. Customers (5)
  const customers = ['某头部新势力A', '某知名车企B', '国际巨头C', '国内龙头D', '战略合资E'];
  customers.forEach((name, i) => {
    nodes.push({
      id: `cust-${i}`,
      name,
      type: NodeType.CUSTOMER,
      status: 'normal',
      demandForecast: Math.floor(Math.random() * 10000) + 5000,
      deliveryAccuracy: 92 + Math.random() * 8,
      onTimeRate: 90 + Math.random() * 10,
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
        status: 'normal'
      });
    });
  });

  // Bases -> Customers
  nodes.filter(n => n.type === NodeType.BASE).forEach((base, i) => {
    let targetIndices = [];
    if (i === 0 || i === 1) {
        targetIndices = [0, 2];
    } else {
        targetIndices = [(i) % 5, (i + 2) % 5];
    }

    targetIndices.forEach(custIndex => {
      // Simulate Pack Delivery Volume (e.g., Sets/Month)
      // Some links are high volume main supply lines, others are backup
      const isMainRoute = Math.random() > 0.6;
      const flowVolume = isMainRoute ? Math.floor(Math.random() * 3000) + 2000 : Math.floor(Math.random() * 1000) + 500;
      
      links.push({
        source: base.id,
        target: `cust-${custIndex}`,
        value: flowVolume,
        type: 'pack',
        status: 'normal'
      });
    });
  });

  return { nodes, links };
};

export const MOCK_DATA = generateMockData();