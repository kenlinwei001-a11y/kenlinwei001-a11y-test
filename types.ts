
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
  customerId?: string; // Foreign Key for DB
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
  id?: number; // Auto-increment for DB
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
    [key: string]: string | number; // e.g. delayDays: 5, newVolume: 1000
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

// RICH CHAT TYPES
export type AttachmentType = 'inventory_chart' | 'production_table' | 'plan_card';

export interface ChatAttachment {
  type: AttachmentType;
  title: string;
  data: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  attachment?: ChatAttachment; // New: Support rich content
}

// --- SETTINGS & INTEGRATION ---
export type LLMProvider = 'glm' | 'kimi' | 'rendu' | 'gemini';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string; // Optional custom base URL
  modelName?: string; // e.g. 'moonshot-v1-8k'
}

// Theme Configuration
export type LayoutMode = 'bento' | 'cinematic' | 'balanced';
export type GlobalMode = 'light' | 'dark' | 'warm' | 'cool' | 'fresh';

export interface ThemeConfig {
  layoutMode: LayoutMode;
  globalMode: GlobalMode;
  heroColor: string;
  operationsColor: string;
  productionColor: string;
  inventoryColor: string;
  salesColor: string;
  capacityColor: string;
}

// Connector Types
export type DataSourceType = 'SAP' | 'MES' | 'CRM' | 'IOT' | 'WMS' | 'SQL';

export interface DataSourceConfig {
  id: string;
  name: string;
  type: DataSourceType;
  endpoint: string;
  authType: 'API_KEY' | 'OAUTH2' | 'BASIC';
  username?: string; // Optional
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
}

// --- MCP (Model Context Protocol) ---
export type MCPType = 'text2sql' | 'graph_topology' | 'simulation' | 'rag';

export interface MCPDefinition {
    id: MCPType;
    name: string;
    description: string;
    icon: string; // Lucide Icon Name
    color: string;
    enabled: boolean;
}

// --- DOMAIN MODELING (ONTOLOGY) ---
export interface PropertyDef {
  id: string;
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'enum';
  description?: string;
}

export interface ActionParam {
  name: string;
  type: string;
}

export interface ActionDef {
  id: string;
  name: string;
  description: string;
  parameters: ActionParam[];
  type: 'Create' | 'Update' | 'Delete' | 'TriggerWorkflow';
}

export interface ObjectTypeDef {
  id: string;
  name: string; // e.g. "CustomerOrder"
  icon: string; // Lucide icon name
  properties: PropertyDef[];
  actions: ActionDef[];
}

// --- INTELLIGENCE CORE (AIP) ---
export interface AISkill {
  id: string;
  name: string;
  description: string;
  linkedActionId?: string; // Links to Ontology Action
  isEnabled: boolean;
}
