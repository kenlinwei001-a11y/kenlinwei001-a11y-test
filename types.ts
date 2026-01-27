export enum NodeType {
  SUPPLIER = 'SUPPLIER',
  BASE = 'BASE',
  PRODUCTION_LINE = 'PRODUCTION_LINE',
  CUSTOMER = 'CUSTOMER'
}

export type NodeStatus = 'normal' | 'warning' | 'critical';

export interface NodeData {
  id: string;
  name: string;
  type: NodeType;
  status?: NodeStatus; // visual status
  x?: number; 
  y?: number;
  // Dynamic Metrics
  inventoryLevel?: number; 
  capacityUtilization?: number; 
  demandForecast?: number; 
  deliveryAccuracy?: number; 
  onTimeRate?: number; 
  qualityYield?: number; 
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

export interface ConstraintItem {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  impactLevel: 'low' | 'medium' | 'high';
  formula?: string; // Mathematical or logical representation
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