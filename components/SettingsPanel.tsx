
import React, { useState, useEffect } from 'react';
import { 
  Save, Server, Upload, Bot, Database, Globe, Lock, Box, Cuboid, Plus, 
  Settings, Share2, Layout, Cpu, BrainCircuit, Wrench, BookOpen, Code2, 
  Search, ArrowLeft, ArrowRight, Check, Trash2, FileText, FileSpreadsheet, 
  AlertCircle, CheckCircle2, RefreshCw, Zap, Link as LinkIcon, Variable, 
  ChevronRight, Sparkles, Terminal, FileType, GitFork, Layers, Plug, Activity,
  Palette, Grid, Columns, Monitor, LayoutTemplate, Sun, Moon, Coffee, Droplets, Leaf,
  Network, Key as KeyIcon, TableProperties, Workflow, MousePointerClick, MoreHorizontal,
  LayoutDashboard, ShieldCheck, PlayCircle, Split, List, Edit3, X, ArrowUpRight, Unlink,
  Code, Braces, Play, Clock, Eye, Command, Filter, Send, ShoppingCart, Truck, Factory, Users,
  HardDrive, Puzzle, Cog, Package
} from 'lucide-react';
import { LLMConfig, DataSourceConfig, ObjectTypeDef, AISkill, ThemeConfig, LayoutMode, GlobalMode } from '../types';

interface Props {
  currentConfig: LLMConfig;
  themeConfig?: ThemeConfig;
  onConfigSave: (config: LLMConfig) => void;
  onThemeChange?: (theme: ThemeConfig) => void;
  onDataImport: (type: 'graph' | 'inventory' | 'orders' | 'production', data: any) => void;
}

// --- MOCK DATA ---
const MOCK_OBJECTS: ObjectTypeDef[] = [
    { 
        id: 'obj_order', name: '生产订单 (ProductionOrder)', icon: 'FileText', 
        properties: [
            { id: 'p1', name: 'order_id', dataType: 'string', description: 'Primary Key' },
            { id: 'p2', name: 'product_sku', dataType: 'string', description: 'Linked Product' },
            { id: 'p3', name: 'quantity', dataType: 'number', description: 'Target Volume' },
            { id: 'p4', name: 'due_date', dataType: 'date', description: 'Delivery Deadline' },
            { id: 'p5', name: 'status', dataType: 'enum', description: 'Current State' }
        ], 
        actions: [
            { id: 'act_reschedule', name: '调整排期 (Reschedule)', description: '修改订单交付日期，触发排程重算', parameters: [{name: 'new_date', type: 'date'}], type: 'Update' },
            { id: 'act_split', name: '拆分工单 (Split)', description: '按比例拆分生产批次到不同产线', parameters: [{name: 'ratio', type: 'percentage'}], type: 'TriggerWorkflow' },
            { id: 'act_lock', name: '锁定订单 (Lock)', description: '冻结订单状态，禁止后续变更', parameters: [], type: 'Update' }
        ] 
    },
    { 
        id: 'obj_inventory', name: '物料库存 (Inventory)', icon: 'Box', 
        properties: [
            { id: 'i1', name: 'sku_id', dataType: 'string', description: 'Material ID' },
            { id: 'i2', name: 'warehouse_loc', dataType: 'string', description: 'Location Code' },
            { id: 'i3', name: 'quantity_on_hand', dataType: 'number', description: 'Current Stock' },
            { id: 'i4', name: 'safety_stock', dataType: 'number', description: 'Min Threshold' }
        ], 
        actions: [
            { id: 'act_transfer', name: '库存调拨 (Transfer)', description: '跨基地调货申请', parameters: [], type: 'Update' },
            { id: 'act_po', name: '创建采购单 (Create PO)', description: '触发紧急采购流程', parameters: [], type: 'Create' }
        ] 
    },
    { 
        id: 'obj_line', name: '产线设备 (Equipment)', icon: 'Server', 
        properties: [
            { id: 'e1', name: 'equipment_id', dataType: 'string', description: 'Asset Tag' },
            { id: 'e2', name: 'oee_score', dataType: 'number', description: 'Efficiency Metric' },
            { id: 'e3', name: 'last_maintenance', dataType: 'date', description: 'Last Service' }
        ], 
        actions: [
            { id: 'act_maint', name: '安排维保 (Schedule Maint)', description: '创建维修工单', parameters: [], type: 'TriggerWorkflow' }
        ] 
    }
];

const MOCK_AGENTS = [
    { id: 'agt_01', name: '库存优化专家', type: '分析型', status: 'active', skills: 3, tools: 2, scenario: '库存平衡' },
    { id: 'agt_02', name: '排产调度员', type: '执行型', status: 'active', skills: 5, tools: 4, scenario: 'S&OP计划' },
    { id: 'agt_03', name: '风险预警哨兵', type: '监控型', status: 'inactive', skills: 2, tools: 1, scenario: '全链路风控' },
];

const MOCK_SKILLS = [
    { id: 'sk_01', name: 'calculate_safety_stock', label: '安全库存动态计算', description: '根据历史消耗波动率和服务水平目标，计算建议的安全库存水位。', type: '计算', version: 'v1.2.0', usedBy: ['库存优化专家'], args: [{ name: 'sku_id', type: 'string', desc: '物料编号', required: true }] },
    { id: 'sk_02', name: 'prioritize_orders', label: '订单优先级排序', description: '基于客户等级、交付紧迫度和利润率对生产订单进行排序。', type: '规则', version: 'v2.0.1', usedBy: ['排产调度员'], args: [{ name: 'order_list', type: 'array', desc: '待排序订单ID列表', required: true }] },
    { id: 'sk_03', name: 'infer_shortage_impact', label: '供需缺口推理', description: '分析原材料短缺对下游成品交付的具体影响范围。', type: '推理', version: 'v1.0.0', usedBy: ['库存优化专家', '排产调度员'], args: [{ name: 'material_id', type: 'string', desc: '短缺物料ID', required: true }, { name: 'shortage_qty', type: 'number', desc: '缺口数量', required: true }] },
];

// Expanded Mock Tools
const MOCK_TOOLS = [
    { id: 'tool_01', name: 'SAP_Inv_Read', system: 'SAP ERP', type: 'Read', risk: 'Low', status: 'Connected', desc: 'Read Inventory Levels (MM Module)' },
    { id: 'tool_02', name: 'MES_Line_Ctrl', system: 'Siemens MES', type: 'Exec', risk: 'High', status: 'Connected', desc: 'Control Production Line Start/Stop' },
    { id: 'tool_03', name: 'WMS_Order_Write', system: 'Infor WMS', type: 'Write', risk: 'Medium', status: 'Error', desc: 'Create Warehouse Transfer Orders' },
    { id: 'tool_04', name: 'SF_CRM_Query', system: 'Salesforce', type: 'Read', risk: 'Low', status: 'Connected', desc: 'Query Customer Order Status & Priority' },
    { id: 'tool_05', name: 'IoT_Sensor_Stream', system: 'Azure IoT', type: 'Read', risk: 'Low', status: 'Connected', desc: 'Real-time Temperature & Vibration Data' },
    { id: 'tool_06', name: 'SAP_BOM_Explode', system: 'SAP ERP', type: 'Read', risk: 'Low', status: 'Connected', desc: 'Get Multi-level BOM Structure' },
];

const MOCK_SCENARIOS = [
    { id: 'scn_01', name: '产销协同计划 (S&OP)', industry: '离散制造', workflow: '月度S&OP规划流程', calls: 12450 },
    { id: 'scn_02', name: '设备故障应急响应', industry: '设备维护', workflow: '紧急插单重排流程', calls: 856 },
];

// --- MANUFACTURING CONNECTOR LIBRARY ---
const MANUFACTURING_CONNECTORS = [
    {
        id: 'conn_sap',
        name: 'SAP S/4HANA (ERP)',
        category: 'ERP',
        icon: Database,
        color: 'bg-[#0a2540] text-white',
        modules: ['MM (物料管理)', 'PP (生产计划)', 'SD (销售分销)', 'BOM Master']
    },
    {
        id: 'conn_mes',
        name: 'Siemens Opcenter (MES)',
        category: 'MES',
        icon: Factory,
        color: 'bg-[#009999] text-white',
        modules: ['Work Order Status', 'OEE Monitoring', 'Quality Check', 'Traceability']
    },
    {
        id: 'conn_plm',
        name: 'Teamcenter (PLM)',
        category: 'PLM',
        icon: Layers,
        color: 'bg-[#1423dc] text-white',
        modules: ['Engineering BOM', 'CAD Integration', 'Change Management']
    },
    {
        id: 'conn_wms',
        name: 'Oracle WMS Cloud',
        category: 'WMS',
        icon: Package,
        color: 'bg-[#c74634] text-white',
        modules: ['Inbound Logistics', 'Inventory Snapshot', 'Picking Optimization']
    },
    {
        id: 'conn_scada',
        name: 'Ignition SCADA',
        category: 'IoT',
        icon: Activity,
        color: 'bg-[#f7901e] text-white',
        modules: ['Real-time Tag Data', 'Alarm Events', 'Equipment State']
    },
    {
        id: 'conn_crm',
        name: 'Salesforce Mfg Cloud',
        category: 'CRM',
        icon: Users,
        color: 'bg-[#00a1e0] text-white',
        modules: ['Sales Agreements', 'Account Forecasting', 'Opportunity Pipeline']
    }
];

// --- CONSTANTS ---
const COLOR_OPTIONS = [
    { class: 'bg-white', name: '纯净白 (Clean)' },
    { class: 'bg-slate-50', name: '云雾灰 (Mist)' },
    { class: 'bg-blue-50', name: '冰川蓝 (Ice)' },
    { class: 'bg-emerald-50', name: '薄荷绿 (Mint)' },
    { class: 'bg-amber-100', name: '纸莎草 (Papyrus)' },
    { class: 'bg-slate-900', name: '暗夜黑 (Dark)' },
    { class: 'bg-blue-700', name: '深海蓝 (Navy)' },
    { class: 'bg-indigo-600', name: '睿智紫 (Indigo)' },
    { class: 'bg-emerald-600', name: '森林绿 (Forest)' },
    { class: 'bg-rose-600', name: '警示红 (Rose)' },
];

interface ColorPickerProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: {class: string, name: string}[];
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, options }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
        <label className="block text-sm font-bold text-slate-700 mb-3">{label}</label>
        <div className="flex flex-wrap gap-2.5">
            {options.map((opt) => {
                const isLight = opt.class.includes('-50') || opt.class.includes('white') || opt.class.includes('100') || opt.class.includes('200');
                return (
                <button
                    key={opt.class}
                    onClick={() => onChange(opt.class)}
                    className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center shadow-sm hover:shadow-md ${value === opt.class ? 'border-slate-800 ring-2 ring-slate-200 scale-110' : 'border-slate-100 hover:scale-110'}`}
                    style={{ backgroundColor: opt.class.startsWith('bg-[#') ? opt.class.slice(4, -1) : undefined }}
                    title={opt.name}
                >
                    <div className={`w-full h-full rounded-full ${opt.class}`}></div>
                    {value === opt.class && <Check size={16} className={isLight ? 'text-slate-800' : 'text-white'} />}
                </button>
                );
            })}
        </div>
    </div>
);

const SettingsPanel: React.FC<Props> = ({ currentConfig, themeConfig, onConfigSave, onThemeChange, onDataImport }) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'connectors' | 'ontology' | 'intelligence' | 'model' | 'layout' | 'manual'>('model');
  
  // AIP Platform Sub-View State
  const [aipSubView, setAipSubView] = useState<'console' | 'agent' | 'skill' | 'tool' | 'workflow' | 'scenario' | 'audit'>('console');
  const [selectedItem, setSelectedItem] = useState<any>(null); 
  
  // Agent Builder Wizard State
  const [agentWizardStep, setAgentWizardStep] = useState<1 | 2>(1); // 1: Identity, 2: Workflow
  const [editingNode, setEditingNode] = useState<any>(null); // For Node Editor Modal

  // Editor States
  const [isEditingTool, setIsEditingTool] = useState(false);
  const [isEditingScenario, setIsEditingScenario] = useState(false);
  const [isAddingConnector, setIsAddingConnector] = useState(false);

  // Ontology Sub-View State
  const [ontologyMode, setOntologyMode] = useState<'overview' | 'designer'>('overview');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>('obj_order');
  const [designerTab, setDesignerTab] = useState<'properties' | 'links' | 'actions'>('properties');
  
  const [config, setConfig] = useState<LLMConfig>(currentConfig);
  const [ontologyObjects, setOntologyObjects] = useState<ObjectTypeDef[]>(MOCK_OBJECTS);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => { setConfig(currentConfig); }, [currentConfig]);

  const handleSaveConfig = () => {
    onConfigSave(config);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleCreateNewAgent = () => {
      setSelectedItem({
          id: `new_agent_${Date.now()}`,
          name: '未命名智能体',
          type: '助理型',
          description: '',
          goal: '',
          workflowNodes: [], 
          isNew: true
      });
      setAgentWizardStep(1); // Reset to Step 1
  };

  const handleCreateNewSkill = () => {
      setSelectedItem({
          id: `new_skill_${Date.now()}`,
          name: 'new_function_name',
          label: '未命名技能',
          description: '',
          type: '计算',
          version: 'v0.0.1',
          args: [],
          isNew: true
      });
  };

  const handleAddNode = () => {
      const newNode = {
          id: `node_${Date.now()}`,
          type: 'Action',
          label: '新流程节点',
          component: '',
          mcp: '',
          skill: '',
          dataAccess: []
      };
      // Add to workflow
      setSelectedItem({
          ...selectedItem,
          workflowNodes: [...(selectedItem.workflowNodes || []), newNode]
      });
      // Open Editor
      setEditingNode(newNode);
  };

  const handleUpdateNode = (updatedNode: any) => {
      setSelectedItem({
          ...selectedItem,
          workflowNodes: selectedItem.workflowNodes.map((n: any) => n.id === updatedNode.id ? updatedNode : n)
      });
      setEditingNode(null);
  };

  // --- RENDER HELPERS ---

  // 1. Connectors Management (Enhanced with Library)
  const renderConnectors = () => {
    if (isAddingConnector) {
        return (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsAddingConnector(false)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                            <ArrowLeft size={20}/>
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">添加新数据源</h2>
                            <p className="text-sm text-slate-500">选择离散制造行业标准系统连接器</p>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-3 gap-5 overflow-y-auto pb-4">
                    {MANUFACTURING_CONNECTORS.map((conn) => (
                        <div key={conn.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between h-56">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-lg ${conn.color} shadow-sm`}>
                                        <conn.icon size={24}/>
                                    </div>
                                    <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">{conn.category}</span>
                                </div>
                                <h3 className="font-bold text-slate-800 text-base mb-2">{conn.name}</h3>
                                <ul className="space-y-1.5">
                                    {conn.modules.map(mod => (
                                        <li key={mod} className="text-xs text-slate-500 flex items-center gap-2">
                                            <div className="w-1 h-1 bg-slate-300 rounded-full"></div> {mod}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <button className="w-full py-2 mt-4 bg-slate-50 text-slate-600 font-bold text-xs rounded-lg hover:bg-indigo-600 hover:text-white transition-colors group-hover:shadow-sm flex items-center justify-center gap-1">
                                <Plus size={14}/> 配置连接
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">系统集成 (Connectors)</h2>
                <button onClick={() => setIsAddingConnector(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm">
                    <Plus size={16}/> 新建数据连接
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 border border-slate-200 rounded-xl bg-white flex justify-between items-center shadow-sm hover:border-indigo-300 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#0a2540] text-white rounded-lg shadow-sm"><Database size={24}/></div>
                        <div>
                            <div className="font-bold text-slate-800 text-base">SAP S/4HANA</div>
                            <div className="text-xs text-slate-400 mt-0.5">ERP Core Data • Last sync: 10m ago</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded font-bold"><CheckCircle2 size={12}/> Connected</span>
                        <button className="text-slate-400 hover:text-indigo-600 p-2 hover:bg-slate-50 rounded transition-colors"><Settings size={16}/></button>
                    </div>
                </div>
                <div className="p-5 border border-slate-200 rounded-xl bg-white flex justify-between items-center shadow-sm hover:border-indigo-300 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#00a1e0] text-white rounded-lg shadow-sm"><Globe size={24}/></div>
                        <div>
                            <div className="font-bold text-slate-800 text-base">Salesforce</div>
                            <div className="text-xs text-slate-400 mt-0.5">CRM Customer Data • Last sync: 2h ago</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded font-bold"><CheckCircle2 size={12}/> Connected</span>
                        <button className="text-slate-400 hover:text-indigo-600 p-2 hover:bg-slate-50 rounded transition-colors"><Settings size={16}/></button>
                    </div>
                </div>
            </div>
            
            <div className="bg-slate-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                <div className="text-blue-500 mt-0.5"><Activity size={18}/></div>
                <div className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-bold text-blue-700 block mb-1">集成状态监控</span>
                    当前已连接 2 个核心系统。数据同步策略配置为：ERP (T+1), CRM (实时)。
                    若需接入 IoT 设备数据，请点击右上角新建连接并选择 "Ignition SCADA" 适配器。
                </div>
            </div>
        </div>
    );
  };

  // 2. Ontology Overview (Restored Rich List View)
  const renderOntologyOverview = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl flex items-start gap-4">
             <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                 <Cuboid size={28}/>
             </div>
             <div className="flex-1">
                 <h3 className="text-base font-bold text-slate-800">业务对象语义层 (Semantic Layer)</h3>
                 <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                     定义数字孪生体的业务含义、属性结构及关联关系。构建 "Object-Action-Link" 动态本体网络，
                     使 AI 能够理解并操作实际业务实体。
                 </p>
             </div>
          </div>
          
          <div>
              <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">已定义对象 ({ontologyObjects.length})</h4>
                  <span className="text-xs text-slate-400">上次同步: 2分钟前</span>
              </div>
              <div className="grid gap-3">
                  {ontologyObjects.map(obj => (
                      <div 
                        key={obj.id} 
                        onClick={() => { setSelectedObjectId(obj.id); setOntologyMode('designer'); }}
                        className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between hover:shadow-md hover:border-indigo-300 cursor-pointer group transition-all"
                      >
                          <div className="flex items-center gap-4">
                              <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                {obj.icon === 'FileText' ? <FileText size={20}/> : obj.icon === 'Box' ? <Box size={20}/> : <Server size={20}/>}
                              </div>
                              <div>
                                  <span className="text-base font-bold text-slate-700 block group-hover:text-indigo-700 transition-colors">{obj.name}</span>
                                  <span className="text-xs text-slate-400 font-mono">{obj.id}</span>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                              <span className="text-xs bg-slate-50 text-slate-500 px-2 py-1 rounded border border-slate-100">
                                  {obj.properties.length} 属性
                              </span>
                              <span className="text-xs bg-slate-50 text-slate-500 px-2 py-1 rounded border border-slate-100">
                                  {obj.actions.length} 动作
                              </span>
                              <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400"/>
                          </div>
                      </div>
                  ))}
                  <button onClick={() => { setSelectedObjectId(null); setOntologyMode('designer'); }} className="p-4 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center gap-2 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all">
                      <Plus size={20}/> 定义新对象
                  </button>
              </div>
          </div>
      </div>
  );

  // 3. Ontology Designer (Restored Rich Designer)
  const renderOntologyDesigner = () => {
      const selectedObject = ontologyObjects.find(o => o.id === selectedObjectId);

      return (
          <div className="flex flex-col h-full -m-6 animate-in zoom-in-95 duration-200 bg-white">
              {/* Toolbar */}
              <div className="h-14 border-b border-slate-200 bg-slate-50 flex items-center justify-between px-4 shrink-0">
                  <div className="flex items-center gap-3">
                      <button onClick={() => setOntologyMode('overview')} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                          <ArrowLeft size={18}/>
                      </button>
                      <div className="h-6 w-px bg-slate-300"></div>
                      <span className="font-bold text-slate-700 flex items-center gap-2">
                          <Cuboid size={18} className="text-indigo-600"/> 语义本体设计器
                      </span>
                  </div>
                  <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-50 flex items-center gap-1">
                          <GitFork size={14}/> 变更历史
                      </button>
                      <button className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1 shadow-sm">
                          <Save size={14}/> 保存定义
                      </button>
                  </div>
              </div>

              {/* Designer Body */}
              <div className="flex flex-1 overflow-hidden">
                  
                  {/* Left Sidebar: Object List */}
                  <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
                      <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                          <span className="text-xs font-bold text-slate-500 uppercase">Object Types</span>
                          <button className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-indigo-600"><Plus size={16}/></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 space-y-1">
                          {ontologyObjects.map(obj => (
                              <button
                                  key={obj.id}
                                  onClick={() => setSelectedObjectId(obj.id)}
                                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm transition-colors ${selectedObjectId === obj.id ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
                              >
                                  {obj.icon === 'FileText' ? <FileText size={16}/> : obj.icon === 'Box' ? <Box size={16}/> : <Server size={16}/>}
                                  <div className="truncate flex-1">
                                      <div className="truncate">{obj.name.split(' ')[0]}</div>
                                      <div className="text-[10px] font-mono opacity-60 truncate">{obj.id}</div>
                                  </div>
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Main Canvas / Editor */}
                  <div className="flex-1 bg-slate-50/50 flex flex-col overflow-hidden">
                      {selectedObject ? (
                          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                              <div className="max-w-5xl mx-auto space-y-6 pb-10">
                                  
                                  {/* Header Info */}
                                  <div className="flex items-start gap-5">
                                      <div className="w-16 h-16 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm text-2xl shrink-0">
                                          {selectedObject.icon === 'FileText' ? <FileText size={32}/> : selectedObject.icon === 'Box' ? <Box size={32}/> : <Server size={32}/>}
                                      </div>
                                      <div className="flex-1">
                                          <div className="flex items-center gap-3">
                                              <h2 className="text-2xl font-bold text-slate-800">{selectedObject.name}</h2>
                                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 font-bold">Active</span>
                                          </div>
                                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 select-all">{selectedObject.id}</span>
                                              <span className="w-px h-3 bg-slate-300"></span>
                                              <span className="flex items-center gap-1.5"><Database size={14} className="text-emerald-600"/> Backing Datasource: <span className="font-bold text-slate-700">SAP.VBAK</span></span>
                                          </div>
                                      </div>
                                  </div>

                                  {/* Inner Navigation Tabs */}
                                  <div className="flex border-b border-slate-200 gap-6 mt-4">
                                      {[
                                          { id: 'properties', label: '属性定义 (Properties)', icon: TableProperties },
                                          { id: 'links', label: '关联关系 (Links)', icon: Network },
                                          { id: 'actions', label: '动作定义 (Actions)', icon: MousePointerClick }
                                      ].map(tab => (
                                          <button
                                              key={tab.id}
                                              onClick={() => setDesignerTab(tab.id as any)}
                                              className={`pb-3 flex items-center gap-2 text-sm font-bold border-b-2 transition-colors ${designerTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                          >
                                              <tab.icon size={16}/>
                                              {tab.label}
                                          </button>
                                      ))}
                                  </div>

                                  {/* --- TAB CONTENT: PROPERTIES --- */}
                                  {designerTab === 'properties' && (
                                      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                              <span className="text-xs font-bold text-slate-500 uppercase">Schema Definition</span>
                                              <button className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1 transition-colors"><Plus size={14}/> 添加属性</button>
                                          </div>
                                          <table className="w-full text-left text-sm">
                                              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                                  <tr>
                                                      <th className="px-5 py-2 w-10"></th>
                                                      <th className="px-5 py-2">ID / API Name</th>
                                                      <th className="px-5 py-2">Type</th>
                                                      <th className="px-5 py-2">Description</th>
                                                      <th className="px-5 py-2 w-20 text-center">Mapped</th>
                                                      <th className="px-5 py-2 w-10"></th>
                                                  </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-100">
                                                  {selectedObject.properties.map((prop, i) => (
                                                      <tr key={prop.id} className="hover:bg-slate-50 group">
                                                          <td className="px-5 py-3 text-center">
                                                              {i === 0 && <KeyIcon size={14} className="text-amber-500 mx-auto" title="Primary Key"/>}
                                                          </td>
                                                          <td className="px-5 py-3 font-mono text-slate-700 font-bold">{prop.name}</td>
                                                          <td className="px-5 py-3">
                                                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                                  prop.dataType === 'string' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                                  prop.dataType === 'number' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                  prop.dataType === 'date' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                  'bg-purple-50 text-purple-700 border-purple-100'
                                                              }`}>
                                                                  {prop.dataType}
                                                              </span>
                                                          </td>
                                                          <td className="px-5 py-3 text-slate-500 text-xs">{prop.description}</td>
                                                          <td className="px-5 py-3 text-center">
                                                              <Check size={14} className="text-emerald-500 mx-auto"/>
                                                          </td>
                                                          <td className="px-5 py-3 text-right">
                                                              <button className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                                          </td>
                                                      </tr>
                                                  ))}
                                              </tbody>
                                          </table>
                                      </div>
                                  )}

                                  {designerTab === 'links' && (
                                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 mb-4">
                                              <Network size={20} className="text-blue-600 mt-0.5"/>
                                              <div className="text-sm text-blue-800">
                                                  <span className="font-bold block">本体图谱关系 (Ontology Graph)</span>
                                                  定义对象之间的关联路径。AI 将利用这些链接进行跨对象推理和多跳查询（Multi-hop Reasoning）。
                                              </div>
                                          </div>
                                      </div>
                                  )}
                                  
                                  {designerTab === 'actions' && (
                                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                          <div className="flex justify-between items-center mb-2">
                                               <span className="text-xs font-bold text-slate-500 uppercase">Registered Actions</span>
                                               <button className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-1"><Plus size={14}/> 注册新动作</button>
                                          </div>
                                          
                                          <div className="space-y-3">
                                              {selectedObject.actions.map(action => (
                                                  <div key={action.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-indigo-300 transition-colors group">
                                                      <div className="flex justify-between items-start">
                                                          <div className="flex items-start gap-3">
                                                              <div className={`p-2 rounded-lg mt-0.5 ${
                                                                  action.type === 'Update' ? 'bg-blue-50 text-blue-600' : 
                                                                  action.type === 'Create' ? 'bg-emerald-50 text-emerald-600' :
                                                                  'bg-purple-50 text-purple-600'
                                                              }`}>
                                                                  <Workflow size={18}/>
                                                              </div>
                                                              <div>
                                                                  <div className="font-bold text-slate-800 text-base flex items-center gap-2">
                                                                      {action.name}
                                                                  </div>
                                                                  <div className="text-sm text-slate-500 mt-1">{action.description}</div>
                                                              </div>
                                                          </div>
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  )}

                              </div>
                          </div>
                      ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                              <Cuboid size={48} className="mb-4 opacity-20"/>
                              <p className="text-sm">请从左侧选择一个对象类型进行编辑</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  // 2. Agent Management (New Wizard Flow) - KEPT FROM PREVIOUS TURN
  const renderAgentBuilder = () => {
      // Internal Node Editor Component
      const NodeEditor = ({ node, onSave, onCancel }: any) => {
          const [localNode, setLocalNode] = useState(node);

          return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-white rounded-xl shadow-2xl w-[800px] h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                      <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-600 text-white rounded-lg"><Settings size={20}/></div>
                              <div>
                                  <h3 className="font-bold text-slate-800 text-lg">节点配置: {localNode.label}</h3>
                                  <span className="text-xs text-slate-500 font-mono">ID: {localNode.id}</span>
                              </div>
                          </div>
                          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
                          {/* 1. Basic Info */}
                          <div className="space-y-4">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">基础信息</h4>
                              <div className="grid grid-cols-2 gap-6">
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-2">节点名称</label>
                                      <input 
                                        type="text" 
                                        value={localNode.label} 
                                        onChange={(e) => setLocalNode({...localNode, label: e.target.value})}
                                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-2">节点类型</label>
                                      <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white">
                                          <option>Action (执行)</option>
                                          <option>Trigger (触发器)</option>
                                          <option>Decision (判断)</option>
                                          <option>Analysis (分析)</option>
                                      </select>
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-2">节点描述</label>
                                  <textarea className="w-full border border-slate-200 rounded-lg p-2.5 text-sm h-20 resize-none outline-none focus:border-indigo-500" placeholder="描述该节点在工作流中的作用..."></textarea>
                              </div>
                          </div>

                          {/* 2. Capability Binding */}
                          <div className="space-y-4">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2"><Cpu size={14}/> 能力绑定 (Capability)</h4>
                              <div className="grid grid-cols-3 gap-6">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 mb-1.5">调用组件 (Component)</label>
                                      <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white">
                                          <option value="">-- 选择系统组件 --</option>
                                          <option>InventoryManager</option>
                                          <option>OrderProcessor</option>
                                          <option>Notifier</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 mb-1.5">调用 MCP 工具</label>
                                      <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white">
                                          <option value="">-- 选择 MCP --</option>
                                          {MOCK_TOOLS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 mb-1.5">调用 Skill 技能</label>
                                      <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white">
                                          <option value="">-- 选择 AI Skill --</option>
                                          {MOCK_SKILLS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                      </select>
                                  </div>
                              </div>
                          </div>

                          {/* 3. Resource & Data Binding (Moved here from main tabs) */}
                          <div className="space-y-4">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2"><Database size={14}/> 数据与资源绑定 (Data Binding)</h4>
                              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                  <label className="block text-sm font-bold text-slate-700 mb-2">访问对象权限 (Object Access)</label>
                                  <div className="grid grid-cols-2 gap-3">
                                      {MOCK_OBJECTS.map(obj => (
                                          <label key={obj.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors">
                                              <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"/>
                                              <div className="flex items-center gap-2">
                                                  <div className="text-slate-400"><Cuboid size={16}/></div>
                                                  <span className="text-sm font-medium text-slate-700">{obj.name}</span>
                                              </div>
                                          </label>
                                      ))}
                                  </div>
                                  <div className="mt-4">
                                       <label className="block text-sm font-bold text-slate-700 mb-2">规则库引用 (Constraints)</label>
                                       <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white">
                                           <option>安全库存硬性红线</option>
                                           <option>订单锁定不做调整</option>
                                       </select>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                          <button onClick={onCancel} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">取消</button>
                          <button onClick={() => onSave(localNode)} className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-2">
                              <CheckCircle2 size={16}/> 保存配置
                          </button>
                      </div>
                  </div>
              </div>
          );
      };

      return (
          <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {/* Wizard Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                          <ArrowLeft size={18}/>
                      </button>
                      <div>
                          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                              {selectedItem.name}
                              {selectedItem.isNew && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded">New</span>}
                          </h2>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span>Agent Builder Wizard</span>
                              <span>•</span>
                              <span className={agentWizardStep === 1 ? 'text-indigo-600 font-bold' : ''}>1. 基础定义</span>
                              <ChevronRight size={12}/>
                              <span className={agentWizardStep === 2 ? 'text-indigo-600 font-bold' : ''}>2. 编排工作流</span>
                          </div>
                      </div>
                  </div>
                  <div className="flex gap-2">
                      <button className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">保存草稿</button>
                      <button onClick={() => setSelectedItem(null)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2">
                          <Save size={16}/> 发布 Agent
                      </button>
                  </div>
              </div>

              {/* Wizard Content */}
              <div className="flex-1 overflow-hidden relative">
                  {/* Step 1: Identity */}
                  {agentWizardStep === 1 && (
                      <div className="h-full overflow-y-auto p-12 animate-in fade-in slide-in-from-right-8">
                          <div className="max-w-2xl mx-auto space-y-8">
                              <div className="text-center mb-8">
                                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                      <Bot size={32}/>
                                  </div>
                                  <h3 className="text-2xl font-bold text-slate-800">定义智能体画像</h3>
                                  <p className="text-slate-500 mt-2">设定 Agent 的基本角色、目标与行为准则</p>
                              </div>

                              <div className="space-y-5">
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-2">Agent 名称</label>
                                      <input type="text" className="w-full border border-slate-200 rounded-xl p-4 text-base focus:border-indigo-500 outline-none shadow-sm" defaultValue={selectedItem.name}/>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-2">角色类型</label>
                                      <div className="grid grid-cols-4 gap-3">
                                          {['分析型', '执行型', '监控型', '助理型'].map(t => (
                                              <button key={t} className={`py-3 rounded-lg text-sm font-bold border transition-all ${selectedItem.type === t ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                                  {t}
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-2">核心目标 (Goal)</label>
                                      <textarea className="w-full h-24 border border-slate-200 rounded-xl p-4 text-base resize-none focus:border-indigo-500 outline-none shadow-sm" defaultValue={selectedItem.goal} placeholder="例如：维持库存周转天数在合理区间..."/>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-2">系统提示词 (System Prompt)</label>
                                      <textarea className="w-full h-32 border border-slate-200 rounded-xl p-4 text-sm font-mono text-slate-600 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none shadow-inner" defaultValue={selectedItem.description} placeholder="You are an expert in supply chain management..."/>
                                  </div>
                              </div>

                              <div className="pt-6 border-t border-slate-100 flex justify-end">
                                  <button onClick={() => setAgentWizardStep(2)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-base font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 transition-transform active:scale-95">
                                      下一步: 编排工作流 <ArrowRight size={18}/>
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* Step 2: Workflow Orchestration */}
                  {agentWizardStep === 2 && (
                      <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-8 bg-slate-50/50">
                          <div className="flex-1 overflow-y-auto p-8 relative">
                              <div className="max-w-4xl mx-auto">
                                  <div className="flex justify-between items-end mb-6">
                                      <div>
                                          <h3 className="text-xl font-bold text-slate-800">编排工作流 (Workflow Orchestration)</h3>
                                          <p className="text-sm text-slate-500 mt-1">定义 Agent 的思维链与执行步骤。点击“添加节点”配置详细逻辑与资源绑定。</p>
                                      </div>
                                      <button onClick={() => setAgentWizardStep(1)} className="text-slate-400 text-sm font-bold hover:text-slate-600 flex items-center gap-1">
                                          <ArrowLeft size={14}/> 返回上一步
                                      </button>
                                  </div>

                                  {/* Workflow Canvas (List Representation) */}
                                  <div className="space-y-6 relative pb-20">
                                      {/* Vertical Line */}
                                      <div className="absolute left-8 top-6 bottom-6 w-0.5 bg-slate-200 -z-10"></div>

                                      {/* Start Node */}
                                      <div className="flex items-center gap-6">
                                          <div className="w-16 h-16 rounded-full bg-slate-100 border-4 border-white shadow-sm flex items-center justify-center text-slate-400 z-10 font-bold text-xs uppercase tracking-wider">Start</div>
                                          <div className="text-xs text-slate-400 italic">Workflow Trigger (e.g. User Input, Schedule)</div>
                                      </div>

                                      {/* Nodes */}
                                      {(selectedItem.workflowNodes || []).map((node: any, idx: number) => (
                                          <div key={idx} className="flex items-start gap-6 group">
                                              <div className={`w-16 h-16 rounded-full border-4 border-white shadow-md flex items-center justify-center z-10 shrink-0 ${
                                                  node.type === 'Trigger' ? 'bg-blue-100 text-blue-600' : 
                                                  node.type === 'Action' ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-500'
                                              }`}>
                                                  {idx + 1}
                                              </div>
                                              
                                              <div className="flex-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all relative">
                                                  <div className="flex justify-between items-start mb-2">
                                                      <div>
                                                          <div className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                                              {node.label}
                                                              <span className="text-xs font-normal bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{node.type}</span>
                                                          </div>
                                                      </div>
                                                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                          <button onClick={() => setEditingNode(node)} className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"><Edit3 size={16}/></button>
                                                          <button className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                                      </div>
                                                  </div>
                                                  
                                                  <div className="grid grid-cols-2 gap-4 mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                      {node.component && <div className="flex items-center gap-2"><Puzzle size={14} className="text-indigo-400"/> Component: <span className="font-bold text-slate-700">{node.component}</span></div>}
                                                      {node.mcp && <div className="flex items-center gap-2"><Plug size={14} className="text-emerald-400"/> MCP: <span className="font-bold text-slate-700">{node.mcp}</span></div>}
                                                      {node.skill && <div className="flex items-center gap-2"><Zap size={14} className="text-amber-400"/> Skill: <span className="font-bold text-slate-700">{node.skill}</span></div>}
                                                  </div>
                                              </div>
                                          </div>
                                      ))}

                                      {/* Add Node Button */}
                                      <div className="pl-22">
                                          <button 
                                            onClick={handleAddNode}
                                            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 text-sm font-bold hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 bg-white"
                                          >
                                              <Plus size={18}/> 添加流程节点 (Add Node)
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              {/* Render Node Editor Modal if active */}
              {editingNode && (
                  <NodeEditor 
                    node={editingNode} 
                    onSave={handleUpdateNode} 
                    onCancel={() => setEditingNode(null)} 
                  />
              )}
          </div>
      );
  };

  // 3. Main Agent List (Entry Point)
  const renderAgentList = () => (
      <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-2">
          <div className="space-y-4">
              <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-800">Agent 智能体管理</h2>
                  <button onClick={handleCreateNewAgent} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2"><Plus size={16}/> 新建 Agent</button>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                          <tr>
                              <th className="px-5 py-3">Agent 名称</th>
                              <th className="px-5 py-3">类型</th>
                              <th className="px-5 py-3 text-center">工作流节点</th>
                              <th className="px-5 py-3">所属场景</th>
                              <th className="px-5 py-3">状态</th>
                              <th className="px-5 py-3 text-right">操作</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {MOCK_AGENTS.map(agent => (
                              <tr key={agent.id} className="hover:bg-slate-50 group cursor-pointer" onClick={() => setSelectedItem(agent)}>
                                  <td className="px-5 py-3 font-bold text-slate-700">{agent.name}</td>
                                  <td className="px-5 py-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">{agent.type}</span></td>
                                  <td className="px-5 py-3 text-center font-mono text-indigo-600 font-bold">{agent.skills + agent.tools}</td>
                                  <td className="px-5 py-3 text-slate-600">{agent.id === 'agt_01' ? '库存平衡' : agent.id === 'agt_02' ? 'S&OP计划' : '全链路风控'}</td>
                                  <td className="px-5 py-3">
                                      <span className={`flex items-center gap-1.5 text-xs font-bold ${agent.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                          <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                          {agent.status === 'active' ? '启用' : '禁用'}
                                      </span>
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                      <button className="p-1.5 hover:bg-white rounded text-indigo-600 hover:shadow-sm"><Edit3 size={16}/></button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
  );

  const renderAIPConsole = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
          <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">AIP 控制台</h2>
              <div className="text-sm text-slate-500">运行状态: <span className="text-emerald-600 font-bold">正常</span></div>
          </div>
          <div className="grid grid-cols-4 gap-4">
               {[
                   { label: '活跃 Agents', val: 3, icon: Bot, color: 'text-indigo-600 bg-indigo-50' },
                   { label: '已注册 Skills', val: 12, icon: Zap, color: 'text-amber-600 bg-amber-50' },
                   { label: 'MCP 工具', val: 6, icon: Plug, color: 'text-emerald-600 bg-emerald-50' },
                   { label: '日均调用', val: '1.2k', icon: Activity, color: 'text-blue-600 bg-blue-50' },
               ].map((stat, i) => (
                   <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                       <div className={`p-3 rounded-lg ${stat.color}`}>
                           <stat.icon size={24}/>
                       </div>
                       <div>
                           <div className="text-2xl font-bold text-slate-800">{stat.val}</div>
                           <div className="text-xs text-slate-500">{stat.label}</div>
                       </div>
                   </div>
               ))}
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-64 flex items-center justify-center text-slate-400 flex-col gap-2">
              <Activity size={48} className="opacity-20"/>
              <span>系统运行指标监控图表 (Placeholder)</span>
          </div>
      </div>
  );

  // 4. Skill Management (Restored Rich Skill Studio)
  const renderSkillManagement = () => (
      <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-2">
          {!selectedItem ? (
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-slate-800">Skill 能力模块管理</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                      {MOCK_SKILLS.map(skill => (
                          <div key={skill.id} className="bg-white border border-slate-200 p-5 rounded-xl hover:shadow-md transition-all cursor-pointer group" onClick={() => setSelectedItem(skill)}>
                              <div className="flex justify-between items-start mb-3">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${skill.type === '计算' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                      <Zap size={20}/>
                                  </div>
                                  <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">{skill.version}</span>
                              </div>
                              <h3 className="font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{skill.label}</h3>
                              <div className="text-xs font-mono text-slate-400 mb-2">{skill.name}()</div>
                              <div className="text-xs text-slate-500 mb-4 line-clamp-2 h-8">{skill.description}</div>
                              
                              <div className="pt-3 border-t border-slate-100">
                                  <div className="text-xs text-slate-400 mb-1">Params:</div>
                                  <div className="flex flex-wrap gap-1">
                                      {skill.args?.map(arg => (
                                          <span key={arg.name} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{arg.name}</span>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      ))}
                      <div onClick={handleCreateNewSkill} className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer min-h-[200px]">
                          <Plus size={32} className="mb-2"/>
                          <span className="font-bold text-sm">定义新 Skill</span>
                      </div>
                  </div>
              </div>
          ) : (
              // --- Skill Editor (Skill Studio) ---
              <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-4">
                          <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                              <ArrowLeft size={18}/>
                          </button>
                          <div>
                              <div className="flex items-center gap-2">
                                  <Zap size={16} className="text-indigo-600"/>
                                  <h2 className="text-lg font-bold text-slate-800">{selectedItem.isNew ? '创建新技能 (Skill Studio)' : '编辑技能配置'}</h2>
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">Define tools for LLM Function Calling</div>
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <button className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1">
                              <Play size={12}/> 测试运行
                          </button>
                          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-1 shadow-sm" onClick={() => setSelectedItem(null)}>
                              <Save size={12}/> 保存发布
                          </button>
                      </div>
                  </div>

                  <div className="flex-1 flex overflow-hidden">
                      
                      {/* Left: Definition */}
                      <div className="w-1/2 p-6 overflow-y-auto border-r border-slate-100 custom-scrollbar">
                          <div className="space-y-6">
                              {/* Identity */}
                              <div className="space-y-3">
                                  <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><FileText size={12}/> 技能元数据 (Metadata)</h3>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-xs font-bold text-slate-500 mb-1">显示名称 (Label)</label>
                                          <input type="text" className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none" defaultValue={selectedItem.label} />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-slate-500 mb-1">函数名 (Function Name)</label>
                                          <input type="text" className="w-full text-sm font-mono border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none" defaultValue={selectedItem.name} />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-indigo-600 mb-1 flex items-center gap-1">
                                          <Bot size={12}/> LLM 提示词描述 (System Prompt Context)
                                      </label>
                                      <textarea 
                                          className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none h-20 resize-none" 
                                          defaultValue={selectedItem.description}
                                          placeholder="详细描述该技能的功能、适用场景以及何时不该使用，这将直接作为 Tool Definition 发送给大模型。"
                                      />
                                  </div>
                              </div>

                              {/* Parameters */}
                              <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                      <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Braces size={12}/> 参数定义 (Parameters)</h3>
                                      <button className="text-xs text-blue-600 font-bold hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1"><Plus size={12}/> 添加参数</button>
                                  </div>
                                  
                                  <div className="space-y-2">
                                      {(selectedItem.args || []).map((arg: any, idx: number) => (
                                          <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg group hover:border-indigo-200 transition-colors">
                                              <div className="flex gap-2 mb-2">
                                                  <input type="text" className="flex-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded px-2 py-1" defaultValue={arg.name} placeholder="param_name" />
                                                  <select className="w-24 text-xs bg-white border border-slate-200 rounded px-2 py-1" defaultValue={arg.type}>
                                                      <option value="string">String</option>
                                                      <option value="number">Number</option>
                                                      <option value="boolean">Boolean</option>
                                                      <option value="array">Array</option>
                                                  </select>
                                                  <div className="flex items-center gap-1 px-2">
                                                      <input type="checkbox" defaultChecked={arg.required} />
                                                      <span className="text-xs text-slate-500">Required</span>
                                                  </div>
                                                  <button className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                                              </div>
                                              <input type="text" className="w-full text-xs bg-transparent border-b border-dashed border-slate-300 pb-1 focus:border-indigo-400 outline-none text-slate-600" defaultValue={arg.desc} placeholder="参数描述 (给 LLM 看)" />
                                          </div>
                                      ))}
                                      {(selectedItem.args?.length === 0) && (
                                          <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-lg text-slate-300 text-xs">无参数配置</div>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Right: Implementation & Preview */}
                      <div className="w-1/2 bg-slate-900 flex flex-col overflow-hidden">
                          {/* Logic Binding */}
                          <div className="p-4 border-b border-slate-700">
                              <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><LinkIcon size={12}/> 绑定实现 (Implementation)</h3>
                                  <select className="bg-slate-800 text-white text-xs border border-slate-600 rounded px-2 py-1 outline-none">
                                      <option>Type: Script (Python)</option>
                                      <option>Type: API Connector</option>
                                      <option>Type: SQL Query</option>
                                  </select>
                              </div>
                              <div className="bg-[#0d1117] rounded-lg p-3 font-mono text-xs text-slate-300 border border-slate-800 h-32 overflow-hidden relative">
                                  <div className="absolute top-2 right-2 text-slate-600"><Code2 size={14}/></div>
                                  <span className="text-purple-400">def</span> <span className="text-blue-400">{selectedItem.name}</span>(params):<br/>
                                  &nbsp;&nbsp;<span className="text-slate-500"># Implementation logic here</span><br/>
                                  &nbsp;&nbsp;<span className="text-purple-400">return</span> inventory_service.calc(params)
                              </div>
                          </div>

                          {/* JSON Schema Preview */}
                          <div className="flex-1 p-4 overflow-hidden flex flex-col">
                               <div className="flex justify-between items-center mb-2">
                                  <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Code size={12}/> JSON Schema 预览 (For LLM)</h3>
                                  <span className="text-[10px] text-slate-500">Auto-generated</span>
                               </div>
                               <div className="flex-1 bg-[#0d1117] rounded-lg p-4 font-mono text-xs text-green-400 overflow-auto border border-slate-800 custom-scrollbar">
                                   <pre>{JSON.stringify({
                                       name: selectedItem.name,
                                       description: selectedItem.description,
                                       parameters: {
                                           type: "object",
                                           properties: (selectedItem.args || []).reduce((acc:any, arg:any) => {
                                               acc[arg.name] = { type: arg.type, description: arg.desc };
                                               return acc;
                                           }, {}),
                                           required: (selectedItem.args || []).filter((a:any) => a.required).map((a:any) => a.name)
                                       }
                                   }, null, 2)}</pre>
                               </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );

  const renderTools = () => (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
          <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">工具箱 (Tools & MCP)</h2>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700">
                  <Plus size={16}/> 添加工具
              </button>
          </div>
          <div className="space-y-3">
              {MOCK_TOOLS.map(tool => (
                  <div key={tool.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-lg ${tool.status === 'Connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              <Plug size={20}/>
                          </div>
                          <div>
                              <div className="font-bold text-slate-800">{tool.name}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-2">
                                  <span>{tool.system}</span>
                                  <span>•</span>
                                  <span>{tool.type}</span>
                              </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${tool.status === 'Connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {tool.status}
                          </span>
                          <button className="text-slate-400 hover:text-indigo-600"><Settings size={18}/></button>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  // 5. Workflow Orchestration (Restored Visual Mock)
  const renderWorkflowOrchestration = () => (
      <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-2">
          <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Workflow 流程编排</h2>
              <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-white border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50">导入模版</button>
                  <button className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-bold hover:bg-indigo-700 flex items-center gap-1"><Plus size={14}/> 新建流程</button>
              </div>
          </div>
          
          {/* Visual Editor Layout Simulation */}
          <div className="flex-1 flex bg-slate-100 rounded-xl border border-slate-300 overflow-hidden">
              {/* Left: Components */}
              <div className="w-48 bg-white border-r border-slate-200 flex flex-col">
                  <div className="p-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">组件库</div>
                  <div className="p-2 space-y-2 overflow-y-auto">
                      {['Agent 节点', 'Skill 节点', 'Tool 节点', '逻辑判断', '人工审批'].map((item, i) => (
                          <div key={i} className="p-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700 cursor-move hover:border-indigo-300 hover:shadow-sm flex items-center gap-2">
                              <Box size={14} className="text-slate-400"/> {item}
                          </div>
                      ))}
                  </div>
              </div>

              {/* Center: Canvas (Mock) */}
              <div className="flex-1 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-50 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute top-4 left-4 text-xs text-slate-400 bg-white/80 p-1 rounded">画布编辑器 (Canvas)</div>
                  
                  {/* Simulated DAG Nodes */}
                  <div className="flex items-center gap-8">
                      <div className="w-32 h-16 bg-white border-2 border-slate-300 rounded-lg shadow-sm flex flex-col items-center justify-center relative">
                          <div className="text-xs text-slate-500">Trigger</div>
                          <div className="font-bold text-sm">每月 1号</div>
                          <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-slate-300"></div>
                      </div>
                      
                      <div className="w-32 h-16 bg-white border-2 border-indigo-500 rounded-lg shadow-md flex flex-col items-center justify-center relative">
                          <div className="text-xs text-indigo-500">Agent</div>
                          <div className="font-bold text-sm">库存分析</div>
                          <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-slate-300"></div>
                      </div>

                      <div className="w-32 h-16 bg-white border-2 border-amber-500 rounded-lg shadow-md flex flex-col items-center justify-center relative">
                          <div className="text-xs text-amber-500">Decision</div>
                          <div className="font-bold text-sm">缺口 {'>'} 10%?</div>
                          <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-slate-300"></div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 h-4 w-0.5 bg-slate-300"></div>
                      </div>

                      <div className="w-32 h-16 bg-white border-2 border-emerald-500 rounded-lg shadow-md flex flex-col items-center justify-center relative">
                          <div className="text-xs text-emerald-500">Tool</div>
                          <div className="font-bold text-sm">生成采购单</div>
                      </div>
                  </div>
              </div>

              {/* Right: Config */}
              <div className="w-64 bg-white border-l border-slate-200 flex flex-col">
                  <div className="p-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">节点配置</div>
                  <div className="p-4 space-y-4">
                      <div>
                          <label className="text-xs text-slate-500 block mb-1">节点名称</label>
                          <input type="text" className="w-full border border-slate-200 rounded p-2 text-sm" defaultValue="库存分析"/>
                      </div>
                      <div>
                          <label className="text-xs text-slate-500 block mb-1">执行 Agent</label>
                          <select className="w-full border border-slate-200 rounded p-2 text-sm bg-white">
                              <option>库存优化专家</option>
                          </select>
                      </div>
                      <div className="bg-slate-50 p-3 rounded text-xs text-slate-500 leading-relaxed">
                          该节点将调用“库存优化专家”Agent，使用其绑定的“供需缺口推理”Skill 进行计算。
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderScenarios = () => (
       <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
          <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">业务场景 (Scenarios)</h2>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700">
                  <Plus size={16}/> 定义场景
              </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
              {MOCK_SCENARIOS.map(sc => (
                  <div key={sc.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
                      <div className="flex justify-between items-start mb-2">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Layers size={20}/></div>
                          <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">{sc.industry}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-lg mb-1">{sc.name}</h4>
                      <p className="text-xs text-slate-500 mb-4">关联流程: {sc.workflow}</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          <PlayCircle size={14}/> {sc.calls.toLocaleString()} 运行次
                      </div>
                  </div>
              ))}
          </div>
       </div>
  );

  const renderAuditLog = () => (
       <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
          <h2 className="text-xl font-bold text-slate-800">审计日志 (Audit Log)</h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr><th className="px-4 py-3">时间</th><th className="px-4 py-3">操作人</th><th className="px-4 py-3">对象</th><th className="px-4 py-3">动作</th><th className="px-4 py-3">状态</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {[1,2,3,4,5].map(i => (
                          <tr key={i} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-slate-500 font-mono text-xs">2023-10-24 10:3{i}</td>
                              <td className="px-4 py-3 text-slate-700 font-medium">Admin</td>
                              <td className="px-4 py-3 text-indigo-600">Agent_0{i}</td>
                              <td className="px-4 py-3 text-slate-600">Update Configuration</td>
                              <td className="px-4 py-3"><span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">Success</span></td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
       </div>
  );

  // 6. Model Engine (Restored Header Card Style)
  const renderModelEngine = () => (
     <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
         <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-center">
             <div className="mx-auto w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                 <Cpu size={28}/>
             </div>
             <h3 className="text-base font-bold text-slate-800">LLM 模型引擎配置</h3>
             <p className="text-sm text-slate-500 mt-2">
                 配置大模型 API 连接。支持 <strong className="text-blue-600">Function Calling</strong> 自动执行与规则学习。
             </p>
         </div>
         <div className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-slate-500 mb-2">服务提供商 (Provider)</label>
                <div className="grid grid-cols-2 gap-3 mb-2">
                    <button onClick={() => setConfig({ ...config, provider: 'gemini', modelName: 'gemini-3-flash-preview' })} className={`py-4 text-sm font-bold rounded-lg border transition-all flex items-center justify-center gap-2 ${config.provider === 'gemini' ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                        <Sparkles size={18}/> Google Gemini
                    </button>
                    <button onClick={() => setConfig({ ...config, provider: 'glm', modelName: 'glm-4-plus' })} className={`py-4 text-sm font-bold rounded-lg border transition-all ${config.provider === 'glm' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                        智谱 GLM-4
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setConfig({ ...config, provider: 'kimi', modelName: 'moonshot-v1-8k' })} className={`py-3 text-sm font-bold rounded-lg border transition-all ${config.provider === 'kimi' ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                        Moonshot Kimi
                    </button>
                    <button onClick={() => setConfig({ ...config, provider: 'rendu', modelName: 'rendu-pro' })} className={`py-3 text-sm font-bold rounded-lg border transition-all ${config.provider === 'rendu' ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                        传神 Rendu
                    </button>
                </div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">API Key (令牌)</label>
                    <div className="relative">
                        <input 
                            type="password" 
                            value={config.apiKey} 
                            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} 
                            className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm pl-10 focus:ring-2 focus:ring-blue-500 outline-none font-mono" 
                            placeholder={process.env.API_KEY ? "已通过环境变量配置 (可覆盖)" : "sk-..."} 
                        />
                        <Lock size={16} className="absolute left-3 top-3.5 text-slate-400"/>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                        您的 Key 将仅存储在本地浏览器中，用于直连大模型 API。
                    </p>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Model Name (模型ID)</label>
                    <input type="text" value={config.modelName} onChange={(e) => setConfig({ ...config, modelName: e.target.value })} className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono" placeholder="e.g. gemini-3-flash-preview" />
                </div>
            </div>
         </div>
     </div>
  );

  // 7. Layout Configuration (Restored Detailed Color Pickers)
  const renderLayoutConfig = () => {
      if (!themeConfig || !onThemeChange) return null;

      // Card Config Map
      const cardConfigMap = [
          { key: 'heroColor', label: '全景拓扑卡片 (Hero Card)' },
          { key: 'operationsColor', label: '运营看板卡片 (Operations)' },
          { key: 'productionColor', label: '产线监控卡片 (Production)' },
          { key: 'inventoryColor', label: '库存管理卡片 (Inventory)' },
          { key: 'salesColor', label: '产销协同卡片 (Sales)' },
          { key: 'capacityColor', label: '产能预测卡片 (Capacity)' },
      ];

      return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-indigo-600 shadow-sm">
                      <Palette size={24}/>
                  </div>
                  <div>
                      <h3 className="text-base font-bold text-slate-800">界面个性化 (UI Customization)</h3>
                      <p className="text-sm text-slate-500">自定义布局结构与主题色彩。</p>
                  </div>
              </div>

              {/* Global Theme Selector */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <label className="block text-sm font-bold text-slate-700 mb-3">全局主题风格 (Global Theme)</label>
                  <div className="grid grid-cols-5 gap-3">
                      {['light', 'dark', 'warm', 'cool', 'fresh'].map((mode) => (
                          <button
                              key={mode}
                              onClick={() => onThemeChange({...themeConfig, globalMode: mode as GlobalMode})}
                              className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center relative overflow-hidden group ${
                                  themeConfig.globalMode === mode 
                                  ? 'border-indigo-600 shadow-sm' 
                                  : 'border-slate-100 hover:border-slate-300'
                              }`}
                          >
                              <div className={`w-full h-12 rounded-lg mb-2 flex items-center justify-center border border-black/5`}>
                                  {mode === 'light' ? <Sun size={20}/> : mode === 'dark' ? <Moon size={20}/> : mode === 'warm' ? <Coffee size={20}/> : mode === 'cool' ? <Droplets size={20}/> : <Leaf size={20}/>}
                              </div>
                              <span className={`text-xs font-bold ${themeConfig.globalMode === mode ? 'text-indigo-700' : 'text-slate-500'}`}>{mode}</span>
                          </button>
                      ))}
                  </div>
              </div>

              {/* Layout Mode */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <label className="block text-sm font-bold text-slate-700 mb-3">仪表盘布局模式 (Layout Mode)</label>
                  <div className="grid grid-cols-3 gap-4">
                      {[
                          { id: 'bento', label: '标准 Bento', desc: '经典 12 格网格布局', icon: Grid },
                          { id: 'cinematic', label: '影院宽屏', desc: '全景拓扑图置顶', icon: Monitor },
                          { id: 'balanced', label: '左右均衡', desc: '左右对比分析', icon: Columns }
                      ].map((mode) => (
                          <button
                              key={mode.id}
                              onClick={() => onThemeChange({...themeConfig, layoutMode: mode.id as LayoutMode})}
                              className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all text-center relative overflow-hidden group ${
                                  themeConfig.layoutMode === mode.id 
                                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm' 
                                  : 'border-slate-100 hover:border-slate-300 text-slate-500 hover:bg-slate-50'
                              }`}
                          >
                              <div className={`p-2 rounded-lg mb-2 ${themeConfig.layoutMode === mode.id ? 'bg-white shadow-sm' : 'bg-slate-100 group-hover:bg-white'}`}>
                                  <mode.icon size={24}/>
                              </div>
                              <span className="font-bold text-sm">{mode.label}</span>
                              <span className="text-xs opacity-70 mt-1">{mode.desc}</span>
                          </button>
                      ))}
                  </div>
              </div>

              {/* Specific Card Colors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cardConfigMap.map((card) => (
                      <ColorPicker 
                        key={card.key}
                        label={card.label} 
                        value={themeConfig[card.key as keyof ThemeConfig] as string}
                        onChange={(v) => onThemeChange({...themeConfig, [card.key]: v})}
                        options={COLOR_OPTIONS}
                      />
                  ))}
              </div>
          </div>
      );
  };

  const renderDataImport = () => (
       <div className="max-w-2xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-4">
           <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer group">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                    <Upload size={40}/>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">点击或拖拽上传数据文件</h3>
                <p className="text-slate-500 mb-6 max-w-sm">支持 .json, .csv 格式。可导入拓扑图结构、库存记录、订单列表或产线配置。</p>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600">下载模板</button>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700">选择文件</button>
                </div>
           </div>
           
           <div className="mt-8 space-y-4">
               <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">最近导入记录</h4>
               <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                   {[
                       { file: 'inventory_20231024.csv', size: '2.4 MB', status: 'Success', time: '10 mins ago' },
                       { file: 'graph_topology_v2.json', size: '156 KB', status: 'Success', time: '2 hours ago' },
                   ].map((log, i) => (
                       <div key={i} className="flex justify-between items-center p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                           <div className="flex items-center gap-3">
                               <FileSpreadsheet size={20} className="text-emerald-600"/>
                               <div>
                                   <div className="font-bold text-slate-700 text-sm">{log.file}</div>
                                   <div className="text-xs text-slate-400">{log.size} • {log.time}</div>
                               </div>
                           </div>
                           <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">{log.status}</span>
                       </div>
                   ))}
               </div>
           </div>
       </div>
  );

  return (
    <div className="flex flex-col h-full bg-white w-full">
      {/* Settings Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50 shrink-0">
        <h2 className="font-bold text-slate-800 text-xl flex items-center gap-2">
          <Server className="text-slate-600" size={24} />
          系统配置中心
        </h2>
        <p className="text-sm text-slate-500 mt-1">全域配置与集成中心</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-2 overflow-x-auto no-scrollbar shrink-0">
        {[
            { id: 'model', label: '模型引擎', icon: Cpu },
            { id: 'ontology', label: '业务定义', icon: Cuboid },
            { id: 'connectors', label: '系统集成', icon: Plug },
            { id: 'intelligence', label: '智能中枢', icon: BrainCircuit },
            { id: 'layout', label: '界面布局', icon: Layout },
            { id: 'manual', label: '数据导入', icon: Upload },
        ].map((tab) => (
            <button 
                key={tab.id}
                onClick={() => {
                    setActiveTab(tab.id as any);
                }}
                className={`flex-1 min-w-[80px] py-4 text-sm font-bold flex flex-col items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
                <tab.icon size={18}/>
                {tab.label}
            </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 overflow-y-auto p-6 custom-scrollbar">
            {activeTab === 'connectors' && renderConnectors()}
            
            {/* Ontology Tab Switching logic */}
            {activeTab === 'ontology' && (
                ontologyMode === 'overview' ? renderOntologyOverview() : renderOntologyDesigner()
            )}

            {/* Intelligence Tab - Handled by Sub-views inside */}
            {activeTab === 'intelligence' && (
                <div className="flex h-full -m-6 bg-slate-50">
                    {/* Left Sidebar */}
                    <div className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
                        <div className="p-5 border-b border-slate-100">
                            <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg">
                                <BrainCircuit size={24}/> AIP 智能中枢
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">Platform Console v2.0</div>
                        </div>
                        <div className="flex-1 p-3 space-y-1">
                            {[
                                { id: 'console', label: '首页 / 控制台', icon: LayoutDashboard },
                                { id: 'agent', label: 'Agent 管理', icon: Cpu },
                                { id: 'skill', label: 'Skill 管理', icon: Zap },
                                { id: 'tool', label: 'Tool / MCP 管理', icon: Plug },
                                { id: 'workflow', label: 'Workflow 编排', icon: GitFork },
                                { id: 'scenario', label: '场景 (Scenario) 管理', icon: Layers },
                                { id: 'audit', label: '运行与审计', icon: ShieldCheck },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { 
                                        setAipSubView(item.id as any); 
                                        setSelectedItem(null); 
                                        setIsEditingTool(false); 
                                        setIsEditingScenario(false);
                                        setAgentWizardStep(1); // Reset Wizard
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                        aipSubView === item.id 
                                        ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                >
                                    <item.icon size={18} className={aipSubView === item.id ? 'text-indigo-600' : 'text-slate-400'}/>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                        {aipSubView === 'console' && renderAIPConsole()}
                        {aipSubView === 'agent' && (selectedItem ? renderAgentBuilder() : renderAgentList())}
                        {aipSubView === 'skill' && renderSkillManagement()}
                        {aipSubView === 'tool' && renderTools()}
                        {aipSubView === 'workflow' && renderWorkflowOrchestration()}
                        {aipSubView === 'scenario' && renderScenarios()}
                        {aipSubView === 'audit' && renderAuditLog()}
                    </div>
                </div>
            )}

            {/* Other Tabs */}
            {activeTab === 'model' && renderModelEngine()}
            {activeTab === 'layout' && renderLayoutConfig()}
            {activeTab === 'manual' && renderDataImport()}
          </div>
      </div>

      {/* Footer Save Action */}
      <div className="p-5 border-t border-slate-200 bg-white shrink-0">
          <button 
            onClick={handleSaveConfig}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3.5 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
          >
            {showSaved ? <CheckCircle2 size={20} className="text-emerald-400"/> : <Save size={20}/>}
            {showSaved ? '配置已保存' : '保存系统设置'}
          </button>
      </div>
    </div>
  );
};

export default SettingsPanel;
