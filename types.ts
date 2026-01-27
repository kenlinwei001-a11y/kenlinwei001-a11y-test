
export enum NodeType {
  SUPPLIER = 'SUPPLIER',
  BASE = 'BASE',
  PRODUCTION_LINE = 'PRODUCTION_LINE',
  CUSTOMER = 'CUSTOMER'
}

export type NodeStatus = 'normal' | 'warning' | 'critical';

export interface ProductionLineData {
  id: string;
  name: string;
  type: 'LFP' | 'NCM' | 'Pack';
  status: 'running' | 'maintenance' | 'idle' | 'error';
  efficiency: number; // OEE
  yieldRate: number; // Quality Yield
  currentProduct: string;
}

export interface OrderData {
  id: string;
  product: string;
  volume: number;
  progress: number; // 0-100
  dueDate: string;
  status: 'on-track' | 'delayed' | 'risk';
}

export interface NodeData {
  id: string;
  name: string;
  type: NodeType;
  status?: NodeStatus; // visual status
  x?: number; 
  y?: number;
  
  // Base Specific
  inventoryLevel?: number;
  inventoryCapacity?: number;
  inventoryHistory?: { day: string; value: number; safeLine: number }[]; // For Sparkline
  productionLines?: ProductionLineData[];
  
  // Customer Specific
  demandForecast?: number; 
  activeOrders?: OrderData[];
  supplyingBases?: string[]; // Names of bases supplying this customer

  // Supplier Specific
  deliveryAccuracy?: number; 

  // Generic Metrics
  capacityUtilization?: number; 
  onTimeRate?: number; 
  activeAlerts?: number;
  details?: {
    batchDelivery?: string[];
    monthlyForecast?: number[]; 
    actualSales?: number[];
  };
}

export interface LinkData {
  source: string; // ID
  target: string; // ID
  value: number; 
  type: 'material' | 'cell' | 'pack';
  status?: NodeStatus; // visual status for the link
}

export interface GraphData {
  nodes: NodeData[];
  links: LinkData[];
}

export interface ConstraintCategory {
  id: string;
  name: string;
  items: ConstraintItem[];
}

export type ConstraintRelationType = 'IMPACT' | 'TRIGGER' | 'QUERY';

export interface ConstraintLogic {
  sourceNodeId?: string; // The "Subject"
  attribute?: string;    // e.g., 'inventoryLevel'
  operator?: '>' | '<' | '=' | 'CHANGE';
  value?: number | string;
  relationType: ConstraintRelationType; // The "Predicate"
  targetNodeId?: string; // The "Object"
  actionDescription?: string;
}

export interface ConstraintItem {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  impactLevel: 'low' | 'medium' | 'high';
  formula?: string; // Legacy string representation
  logic?: ConstraintLogic; // Structured Ontology Logic
  source?: 'manual' | 'ai'; // Track origin of the rule
}

// Updated Scenario Interface for Manual Input
export interface ScenarioConfig {
  id?: string; // Unique ID for the list
  targetNodeId: string;
  targetNodeName: string;
  type: 'SUPPLY_DELAY' | 'DEMAND_CHANGE' | 'INVENTORY_ISSUE' | 'PRODUCTION_ISSUE';
  parameters: {
    [key: string]: string | number; // e.g., delayDays: 5, newVolume: 1000
  };
  description: string;
}

export interface ScenarioEvent {
  id: string;
  type: string;
  label: string;
  description: string;
  targetNodeId: string;
  severity: 'low' | 'medium' | 'high';
  active: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

// --- NEW TYPES FOR SETTINGS ---
export type LLMProvider = 'gemini' | 'kimi';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string; // Optional custom base URL
  modelName?: string; // e.g. 'moonshot-v1-8k'
}
