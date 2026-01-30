

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
  onDataImport?: (type: string, data: any) => void;
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

const LAYOUT_OPTIONS = [
    { id: 'bento', label: 'Bento Grid', icon: Grid, desc: '高效紧凑的仪表盘网格布局' },
    { id: 'cinematic', label: 'Cinematic', icon: Monitor, desc: '沉浸式全屏宽幅视觉体验' },
    { id: 'balanced', label: 'Balanced', icon: Columns, desc: '均衡的分栏左右对照视图' },
];

interface ColorPickerProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: {class: string, name: string}[];
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, options }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
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
  const [activeTab, setActiveTab] = useState<'connectors' | 'ontology' | 'intelligence' | 'model' | 'layout' | 'data'>('model');
  
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

  // 0. Data Import
  const renderDataImport = () => (
       <div className="h-full overflow-y-auto bg-slate-50/50 p-6 custom-scrollbar">
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
       </div>
  );

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
                                                              {i === 0 && <KeyIcon size={14} className="text-amber-500 mx-auto" />}
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

  // 6. Model Engine Config
  const renderModelEngine = () => (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-indigo-600 shadow-sm">
                  <Cpu size={24}/>
              </div>
              <div>
                  <h3 className="text-base font-bold text-slate-800">模型推理引擎 (Model Engine)</h3>
                  <p className="text-sm text-slate-500">配置驱动智能决策助手的底层大模型参数。</p>
              </div>
          </div>

          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">LLM Provider</label>
                  <div className="grid grid-cols-4 gap-3">
                      {['gemini', 'glm', 'kimi', 'rendu'].map((p) => (
                          <button
                              key={p}
                              onClick={() => setConfig({...config, provider: p as any})}
                              className={`py-3 rounded-lg text-sm font-bold border-2 transition-all capitalize ${config.provider === p ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                          >
                              {p}
                          </button>
                      ))}
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">API Key</label>
                  <div className="relative">
                      <input 
                          type="password" 
                          value={config.apiKey}
                          onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-lg p-3 pl-10 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                          placeholder="sk-..."
                      />
                      <KeyIcon size={16} className="absolute left-3 top-3.5 text-slate-400"/>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                      <Lock size={12}/> 您的密钥仅存储在本地浏览器，不会上传至服务器。
                  </p>
              </div>

              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Model Name</label>
                  <input 
                      type="text" 
                      value={config.modelName || ''}
                      onChange={(e) => setConfig({...config, modelName: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g. gemini-pro"
                  />
              </div>
          </div>
      </div>
  );

  const renderAIPConsole = () => (
      <div className="p-8 grid grid-cols-2 gap-6 animate-in fade-in">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <h3 className="text-2xl font-bold">AIP 智能体平台</h3>
                      <p className="text-white/80 text-sm">Agent Intelligence Platform</p>
                  </div>
                  <BrainCircuit size={32} className="text-white/20"/>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                      <div className="text-2xl font-bold">3</div>
                      <div className="text-xs text-white/70">Active Agents</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                      <div className="text-2xl font-bold">128</div>
                      <div className="text-xs text-white/70">Daily Invocations</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                      <div className="text-2xl font-bold">98%</div>
                      <div className="text-xs text-white/70">Success Rate</div>
                  </div>
              </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Activity size={18}/> 系统健康度</h3>
              <div className="space-y-4">
                  <div>
                      <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">API Latency</span>
                          <span className="font-bold text-slate-700">245ms</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2"><div className="w-1/3 bg-emerald-500 h-2 rounded-full"></div></div>
                  </div>
                  <div>
                      <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">Token Usage</span>
                          <span className="font-bold text-slate-700">1.2M / 5M</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2"><div className="w-1/4 bg-blue-500 h-2 rounded-full"></div></div>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderAgentBuilder = () => (
      <div className="p-6 h-full flex flex-col animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ArrowLeft size={20}/></button>
              <h2 className="text-xl font-bold text-slate-800">{selectedItem?.isNew ? '创建新智能体' : `编辑: ${selectedItem?.name}`}</h2>
          </div>
          {/* Mock Form */}
          <div className="space-y-4 max-w-2xl">
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">智能体名称</label>
                  <input type="text" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" defaultValue={selectedItem?.name} />
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">角色设定 (Role)</label>
                  <textarea className="w-full border border-slate-300 rounded-lg p-2.5 text-sm h-24" placeholder="You are a helpful assistant..." defaultValue={selectedItem?.description}></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                  <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-sm hover:bg-indigo-700">保存配置</button>
              </div>
          </div>
      </div>
  );

  const renderSkillManagement = () => (
      <div className="p-6 space-y-4 animate-in fade-in">
           <div className="flex justify-between items-center">
               <h2 className="text-lg font-bold text-slate-800">技能库 (Skills)</h2>
               <button onClick={handleCreateNewSkill} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold flex items-center gap-1"><Plus size={14}/> 注册新技能</button>
           </div>
           <div className="grid gap-3">
               {MOCK_SKILLS.map(skill => (
                   <div key={skill.id} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors">
                       <div className="flex justify-between items-start mb-2">
                           <div>
                               <h3 className="font-bold text-slate-700">{skill.label}</h3>
                               <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{skill.name}</code>
                           </div>
                           <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100 font-bold">{skill.type}</span>
                       </div>
                       <p className="text-sm text-slate-500 mb-3">{skill.description}</p>
                       <div className="flex gap-2 text-xs text-slate-400">
                           {skill.usedBy.map(u => <span key={u} className="flex items-center gap-1"><Bot size={10}/> {u}</span>)}
                       </div>
                   </div>
               ))}
           </div>
      </div>
  );

  const renderTools = () => (
      <div className="p-6 space-y-4 animate-in fade-in">
           <div className="flex justify-between items-center">
               <h2 className="text-lg font-bold text-slate-800">外部工具 (Tools)</h2>
               <button className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold flex items-center gap-1"><Plus size={14}/> 接入工具</button>
           </div>
           <div className="grid grid-cols-2 gap-4">
               {MOCK_TOOLS.map(tool => (
                   <div key={tool.id} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors group">
                       <div className="flex items-center gap-3 mb-3">
                           <div className="p-2 bg-slate-100 rounded text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"><Wrench size={18}/></div>
                           <div>
                               <div className="font-bold text-slate-700 text-sm">{tool.name}</div>
                               <div className="text-[10px] text-slate-400">{tool.system}</div>
                           </div>
                       </div>
                       <p className="text-xs text-slate-500 line-clamp-2 mb-2">{tool.desc}</p>
                       <div className="flex justify-between items-center text-[10px]">
                           <span className={`px-1.5 py-0.5 rounded ${tool.status === 'Connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{tool.status}</span>
                           <span className="text-slate-400">{tool.type}</span>
                       </div>
                   </div>
               ))}
           </div>
      </div>
  );

  const renderWorkflowOrchestration = () => (
      <div className="flex flex-col items-center justify-center h-full p-10 text-slate-400 animate-in fade-in">
           <Workflow size={48} className="mb-4 opacity-20"/>
           <h3 className="font-bold text-lg text-slate-600 mb-1">流程编排器</h3>
           <p className="text-sm max-w-sm text-center">可视化编排 Agent 的任务执行流程，支持条件分支、循环与人机协作节点。</p>
           <button className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700">创建新工作流</button>
      </div>
  );

  const renderScenarios = () => (
      <div className="p-6 space-y-4 animate-in fade-in">
           <div className="flex justify-between items-center">
               <h2 className="text-lg font-bold text-slate-800">业务场景库</h2>
               <button className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold flex items-center gap-1"><Plus size={14}/> 定义场景</button>
           </div>
           <div className="grid gap-3">
               {MOCK_SCENARIOS.map(sc => (
                   <div key={sc.id} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors">
                       <div className="flex justify-between items-start">
                           <div>
                               <h3 className="font-bold text-slate-700">{sc.name}</h3>
                               <span className="text-xs text-slate-500">{sc.industry} • {sc.workflow}</span>
                           </div>
                           <div className="text-right">
                               <div className="text-xl font-bold text-indigo-600">{sc.calls.toLocaleString()}</div>
                               <div className="text-[10px] text-slate-400">调用次数</div>
                           </div>
                       </div>
                   </div>
               ))}
           </div>
      </div>
  );

  const renderAuditLog = () => (
      <div className="p-6 animate-in fade-in">
          <h2 className="text-lg font-bold text-slate-800 mb-4">操作审计日志</h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                          <th className="px-4 py-3">Timestamp</th>
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">Action</th>
                          <th className="px-4 py-3">Resource</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                      {[
                          { time: '2023-10-27 10:30:00', user: 'admin', action: 'Update Config', res: 'LLM Settings' },
                          { time: '2023-10-27 09:15:22', user: 'system', action: 'Sync', res: 'SAP Connector' },
                          { time: '2023-10-26 16:45:00', user: 'user_01', action: 'Create Agent', res: 'Agent_04' },
                      ].map((log, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-mono text-slate-500">{log.time}</td>
                              <td className="px-4 py-3 font-bold">{log.user}</td>
                              <td className="px-4 py-3">{log.action}</td>
                              <td className="px-4 py-3 text-indigo-600">{log.res}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
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
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              {/* Header Card */}
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
              <div>
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">1. 全局主题 (Global Theme)</h4>
                  <div className="grid grid-cols-5 gap-4">
                      {['light', 'dark', 'warm', 'cool', 'fresh'].map((mode) => (
                          <button
                              key={mode}
                              onClick={() => onThemeChange({...themeConfig, globalMode: mode as GlobalMode})}
                              className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all text-center relative overflow-hidden group bg-white hover:shadow-md ${
                                  themeConfig.globalMode === mode 
                                  ? 'border-indigo-600 shadow-sm ring-1 ring-indigo-100' 
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                          >
                              <div className={`w-full h-10 rounded-lg mb-3 flex items-center justify-center border border-black/5 ${
                                  mode === 'dark' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                  {mode === 'light' ? <Sun size={20}/> : mode === 'dark' ? <Moon size={20}/> : mode === 'warm' ? <Coffee size={20}/> : mode === 'cool' ? <Droplets size={20}/> : <Leaf size={20}/>}
                              </div>
                              <span className={`text-xs font-bold capitalize ${themeConfig.globalMode === mode ? 'text-indigo-700' : 'text-slate-600'}`}>{mode}</span>
                          </button>
                      ))}
                  </div>
              </div>

              {/* Layout Mode */}
              <div>
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">2. 布局模式 (Layout Mode)</h4>
                  <div className="grid grid-cols-3 gap-4">
                      {LAYOUT_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => onThemeChange({...themeConfig, layoutMode: opt.id as LayoutMode})}
                            className={`flex flex-col items-start p-5 rounded-xl border-2 text-left transition-all bg-white hover:shadow-md ${
                                themeConfig.layoutMode === opt.id 
                                ? 'border-indigo-600 shadow-sm ring-1 ring-indigo-100' 
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                             <div className={`p-2 rounded-lg mb-3 ${themeConfig.layoutMode === opt.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                 <opt.icon size={24} />
                             </div>
                             <span className={`text-sm font-bold mb-1 ${themeConfig.layoutMode === opt.id ? 'text-indigo-700' : 'text-slate-800'}`}>{opt.label}</span>
                             <span className="text-xs text-slate-400 leading-snug">{opt.desc}</span>
                          </button>
                      ))}
                  </div>
              </div>
              
              {/* Colors Grid */}
              <div>
                 <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">3. 卡片配色 (Card Colors)</h4>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                     {cardConfigMap.map(card => (
                         <ColorPicker
                            key={card.key}
                            label={card.label}
                            value={(themeConfig as any)[card.key]}
                            onChange={(v) => onThemeChange({...themeConfig, [card.key]: v})}
                            options={COLOR_OPTIONS}
                         />
                     ))}
                 </div>
              </div>
          </div>
      );
  };

  return (
    <div className="flex h-full bg-slate-50">
       {/* Settings Sidebar */}
       <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
           <div className="p-6 border-b border-slate-100">
               <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                   <Settings size={24} className="text-slate-400"/>
                   系统设置
               </h2>
           </div>
           <div className="p-4 space-y-1">
               <button onClick={() => setActiveTab('model')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'model' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                   <Cpu size={18}/> 模型引擎配置
               </button>
               <button onClick={() => setActiveTab('connectors')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'connectors' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                   <Plug size={18}/> 系统集成 (Connectors)
               </button>
               <button onClick={() => setActiveTab('ontology')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'ontology' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                   <Cuboid size={18}/> 业务对象 (Ontology)
               </button>
               <button onClick={() => setActiveTab('intelligence')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'intelligence' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                   <BrainCircuit size={18}/> AIP 智能体平台
               </button>
               <button onClick={() => setActiveTab('layout')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'layout' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                   <Layout size={18}/> 界面个性化
               </button>
               <button onClick={() => setActiveTab('data')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'data' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                   <Database size={18}/> 数据导入 (Data)
               </button>
           </div>
           
           <div className="mt-auto p-4 border-t border-slate-100">
               <button onClick={handleSaveConfig} className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                    {showSaved ? <Check size={18}/> : <Save size={18}/>}
                    {showSaved ? '已保存配置' : '保存全局配置'}
               </button>
           </div>
       </div>

       {/* Content Area */}
       <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           <div className="max-w-5xl mx-auto">
               {activeTab === 'model' && renderModelEngine()}
               {activeTab === 'connectors' && renderConnectors()}
               {activeTab === 'ontology' && (ontologyMode === 'overview' ? renderOntologyOverview() : renderOntologyDesigner())}
               {activeTab === 'layout' && renderLayoutConfig()}
               {activeTab === 'data' && renderDataImport()}
               
               {activeTab === 'intelligence' && (
                   <div className="space-y-6">
                       {/* AIP Sub-nav */}
                       <div className="flex gap-2 border-b border-slate-200 pb-1 mb-6">
                           {[
                               { id: 'console', label: '控制台', icon: LayoutDashboard },
                               { id: 'agent', label: 'Agent管理', icon: Bot },
                               { id: 'skill', label: '技能(Skills)', icon: Zap },
                               { id: 'tool', label: '工具箱', icon: Wrench },
                               { id: 'workflow', label: '流程编排', icon: Workflow },
                               { id: 'scenario', label: '业务场景', icon: Layers },
                               { id: 'audit', label: '审计日志', icon: FileText },
                           ].map(item => (
                               <button 
                                key={item.id}
                                onClick={() => setAipSubView(item.id as any)}
                                className={`px-4 py-2 rounded-t-lg text-sm font-bold flex items-center gap-2 transition-all ${aipSubView === item.id ? 'bg-white border-x border-t border-slate-200 text-indigo-600 relative top-[1px]' : 'text-slate-500 hover:text-slate-700'}`}
                               >
                                   <item.icon size={14}/> {item.label}
                               </button>
                           ))}
                       </div>
                       
                       {/* AIP Content */}
                       <div className="bg-white rounded-xl min-h-[500px]">
                           {aipSubView === 'console' && renderAIPConsole()}
                           {aipSubView === 'agent' && (selectedItem ? renderAgentBuilder() : (
                               <div className="space-y-4 animate-in fade-in">
                                   <div className="flex justify-between items-center">
                                       <h2 className="text-xl font-bold text-slate-800">智能体 (Agents)</h2>
                                       <button onClick={handleCreateNewAgent} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700"><Plus size={16}/> 创建 Agent</button>
                                   </div>
                                   <div className="grid grid-cols-3 gap-4">
                                       {MOCK_AGENTS.map(agent => (
                                           <div key={agent.id} onClick={() => setSelectedItem(agent)} className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all">
                                               <div className="flex justify-between items-start mb-3">
                                                   <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Bot size={20}/></div>
                                                   <span className={`text-xs px-2 py-1 rounded font-bold ${agent.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{agent.status}</span>
                                               </div>
                                               <h3 className="font-bold text-slate-800 text-lg mb-1">{agent.name}</h3>
                                               <p className="text-xs text-slate-500 mb-4">{agent.type}</p>
                                               <div className="flex items-center gap-3 text-xs text-slate-400">
                                                   <span className="flex items-center gap-1"><Zap size={12}/> {agent.skills} Skills</span>
                                                   <span className="flex items-center gap-1"><Wrench size={12}/> {agent.tools} Tools</span>
                                               </div>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           ))}
                           {aipSubView === 'skill' && renderSkillManagement()}
                           {aipSubView === 'tool' && renderTools()}
                           {aipSubView === 'workflow' && renderWorkflowOrchestration()}
                           {aipSubView === 'scenario' && renderScenarios()}
                           {aipSubView === 'audit' && renderAuditLog()}
                       </div>
                   </div>
               )}
           </div>
       </div>
    </div>
  );
};

export default SettingsPanel;
