
import React, { useState, useEffect } from 'react';
import { 
  Save, Server, Upload, Bot, Database, Globe, Lock, Box, Cuboid, Plus, 
  Settings, Share2, Layout, Cpu, BrainCircuit, Wrench, BookOpen, Code2, 
  Search, ArrowLeft, ArrowRight, Check, Trash2, FileText, FileSpreadsheet, 
  AlertCircle, CheckCircle2, RefreshCw, Zap, Link as LinkIcon, Variable, 
  ChevronRight, Sparkles, Terminal, FileType, GitFork, Layers, Plug, Activity,
  Palette, Grid, Columns, Monitor, LayoutTemplate, Sun, Moon, Coffee, Droplets, Leaf,
  Network, Key as KeyIcon, TableProperties, Workflow, MousePointerClick, MoreHorizontal
} from 'lucide-react';
import { LLMConfig, DataSourceConfig, DataPipelineConfig, ObjectTypeDef, AISkill, ThemeConfig, LayoutMode, GlobalMode } from '../types';

interface Props {
  currentConfig: LLMConfig;
  themeConfig?: ThemeConfig;
  onConfigSave: (config: LLMConfig) => void;
  onThemeChange?: (theme: ThemeConfig) => void;
  onDataImport: (type: 'graph' | 'inventory' | 'orders' | 'production', data: any) => void;
}

// --- MOCK DATA (本地模拟数据) ---
// Enhanced Mock Objects for the Editor
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
            { id: 'act_reschedule', name: '调整排期', description: '修改订单交付日期', parameters: [], type: 'Update' },
            { id: 'act_split', name: '拆分工单', description: '按比例拆分生产批次', parameters: [], type: 'TriggerWorkflow' }
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
            { id: 'act_transfer', name: '库存调拨', description: '跨基地调货', parameters: [], type: 'Update' },
            { id: 'act_po', name: '创建采购单', description: '触发紧急采购流程', parameters: [], type: 'Create' }
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
            { id: 'act_maint', name: '安排维保', description: '创建维修工单', parameters: [], type: 'TriggerWorkflow' }
        ] 
    }
];

const INITIAL_SKILLS: AISkill[] = [
    { id: 'skill-001', name: '库存水位穿透分析', description: '查询特定物料在全网基地的实时库存，并计算周转天数。', isEnabled: true, linkedActionId: '' },
    { id: 'skill-002', name: '订单智能重排', description: '当检测到产能冲突时，自动建议最优的订单排期调整方案。', isEnabled: true, linkedActionId: 'act_reschedule' },
    { id: 'skill-003', name: '供应链风险预演', description: '基于图谱拓扑结构，模拟上游断供对交付的影响范围。', isEnabled: false, linkedActionId: '' },
];

const SettingsPanel: React.FC<Props> = ({ currentConfig, themeConfig, onConfigSave, onThemeChange, onDataImport }) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'connectors' | 'ontology' | 'intelligence' | 'model' | 'layout' | 'manual'>('model');
  
  // Intelligence Sub-View State
  const [intelView, setIntelView] = useState<'menu' | 'skills_list' | 'skills_detail' | 'knowledge' | 'prompt'>('menu');
  
  // Ontology Sub-View State
  const [ontologyMode, setOntologyMode] = useState<'overview' | 'designer'>('overview');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>('obj_order');
  
  // Data State
  const [config, setConfig] = useState<LLMConfig>(currentConfig);
  const [skills, setSkills] = useState<AISkill[]>(INITIAL_SKILLS);
  const [ontologyObjects, setOntologyObjects] = useState<ObjectTypeDef[]>(MOCK_OBJECTS);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => { setConfig(currentConfig); }, [currentConfig]);

  // Handlers
  const handleSaveConfig = () => {
    onConfigSave(config);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  // --- RENDER HELPERS ---

  // 1. 系统集成 (Connectors)
  const renderConnectors = () => (
      <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3">
              <Plug className="text-blue-600 mt-0.5 shrink-0" size={20} />
              <div className="text-sm text-blue-800">
                  <p className="font-bold mb-1">多源异构数据集成</p>
                  已配置 3 个核心业务系统连接器。数据同步策略：实时(MES) / T+1(ERP)。
              </div>
          </div>
          
          <div className="space-y-4">
              {[
                  { name: 'SAP S/4HANA (Global)', type: 'ERP', status: 'active', sync: '10分钟前' },
                  { name: 'Siemens Opcenter', type: 'MES', status: 'active', sync: '实时' },
                  { name: 'Salesforce CRM', type: 'CRM', status: 'error', sync: '2天前' },
              ].map((conn, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm text-white ${conn.type === 'ERP' ? 'bg-[#0a2540]' : conn.type === 'MES' ? 'bg-orange-600' : 'bg-blue-500'}`}>
                              {conn.type}
                          </div>
                          <div>
                              <div className="font-bold text-slate-700 text-base group-hover:text-indigo-600 transition-colors">{conn.name}</div>
                              <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                  <Lock size={12}/> OAuth 2.0 • {conn.sync}
                              </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${conn.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                          <ChevronRight size={20} className="text-slate-300"/>
                      </div>
                  </div>
              ))}
              <button className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 text-sm font-bold hover:bg-slate-50 hover:border-slate-400 flex items-center justify-center gap-2 transition-all">
                  <Plus size={18}/> 新建数据连接
              </button>
          </div>
      </div>
  );

  // 2. 业务本体 (Ontology) - OVERVIEW MODE
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
                  <h4 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">已定义对象 ({MOCK_OBJECTS.length})</h4>
                  <span className="text-xs text-slate-400">上次同步: 2分钟前</span>
              </div>
              <div className="grid gap-3">
                  {MOCK_OBJECTS.map(obj => (
                      <div key={obj.id} className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between hover:shadow-sm group transition-all">
                          <div className="flex items-center gap-4">
                              <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                {obj.icon === 'FileText' ? <FileText size={20}/> : obj.icon === 'Box' ? <Box size={20}/> : <Server size={20}/>}
                              </div>
                              <div>
                                  <span className="text-base font-bold text-slate-700 block">{obj.name}</span>
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
                          </div>
                      </div>
                  ))}
              </div>
          </div>
          <div className="pt-4 border-t border-slate-100">
             <button 
                onClick={() => setOntologyMode('designer')}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
             >
                 <Network size={20}/> 进入业务语义编辑器 (Ontology Editor)
             </button>
          </div>
      </div>
  );

  // 2. 业务本体 (Ontology) - DESIGNER MODE
  const renderOntologyDesigner = () => {
      const selectedObject = ontologyObjects.find(o => o.id === selectedObjectId);

      return (
          <div className="flex flex-col h-full -m-6 animate-in zoom-in-95 duration-200">
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
                      <button className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-50">
                          生成图谱预览
                      </button>
                      <button className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1">
                          <Save size={14}/> 保存变更
                      </button>
                  </div>
              </div>

              {/* Designer Body */}
              <div className="flex flex-1 overflow-hidden">
                  
                  {/* Left Sidebar: Object List */}
                  <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
                      <div className="p-3 border-b border-slate-100 flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400 uppercase">Object Types</span>
                          <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600"><Plus size={16}/></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 space-y-1">
                          {ontologyObjects.map(obj => (
                              <button
                                  key={obj.id}
                                  onClick={() => setSelectedObjectId(obj.id)}
                                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm transition-colors ${selectedObjectId === obj.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                              >
                                  {obj.icon === 'FileText' ? <FileText size={16}/> : obj.icon === 'Box' ? <Box size={16}/> : <Server size={16}/>}
                                  <div className="truncate">
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
                              <div className="max-w-4xl mx-auto space-y-8 pb-10">
                                  
                                  {/* Header Info */}
                                  <div className="flex items-start gap-4">
                                      <div className="w-16 h-16 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm text-2xl">
                                          {selectedObject.icon === 'FileText' ? <FileText size={32}/> : selectedObject.icon === 'Box' ? <Box size={32}/> : <Server size={32}/>}
                                      </div>
                                      <div className="flex-1">
                                          <h2 className="text-2xl font-bold text-slate-800">{selectedObject.name}</h2>
                                          <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                                              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{selectedObject.id}</span>
                                              <span>•</span>
                                              <span className="flex items-center gap-1"><Database size={14}/> Mapped to: <span className="font-bold">SAP.VBAK</span></span>
                                          </div>
                                      </div>
                                  </div>

                                  {/* Properties Section */}
                                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                          <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                                              <TableProperties size={16} className="text-blue-500"/> 属性定义 (Properties)
                                          </h3>
                                          <button className="text-xs font-bold text-blue-600 hover:underline">+ 添加属性</button>
                                      </div>
                                      <table className="w-full text-left text-sm">
                                          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                              <tr>
                                                  <th className="px-5 py-2 w-10"></th>
                                                  <th className="px-5 py-2">ID / API Name</th>
                                                  <th className="px-5 py-2">Type</th>
                                                  <th className="px-5 py-2">Description</th>
                                                  <th className="px-5 py-2 w-10"></th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                              {selectedObject.properties.map((prop, i) => (
                                                  <tr key={prop.id} className="hover:bg-slate-50 group">
                                                      <td className="px-5 py-3 text-center">
                                                          {i === 0 && <KeyIcon size={14} className="text-amber-500 mx-auto" />}
                                                      </td>
                                                      <td className="px-5 py-3 font-mono text-slate-700 font-medium">{prop.name}</td>
                                                      <td className="px-5 py-3">
                                                          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                                                              prop.dataType === 'string' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                              prop.dataType === 'number' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                              prop.dataType === 'date' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                              'bg-purple-50 text-purple-700 border-purple-100'
                                                          }`}>
                                                              {prop.dataType}
                                                          </span>
                                                      </td>
                                                      <td className="px-5 py-3 text-slate-500">{prop.description}</td>
                                                      <td className="px-5 py-3 text-right">
                                                          <button className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                                      </td>
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>

                                  {/* Relationships (Visual Mock) */}
                                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                          <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                                              <Network size={16} className="text-purple-500"/> 关联关系 (Links)
                                          </h3>
                                          <button className="text-xs font-bold text-purple-600 hover:underline">+ 新增关联</button>
                                      </div>
                                      <div className="p-5 flex gap-4 overflow-x-auto">
                                          {/* Mock Links */}
                                          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg min-w-[200px]">
                                              <div className="p-1.5 bg-white border border-slate-200 rounded shadow-sm text-slate-500"><Box size={16}/></div>
                                              <div className="flex-1 text-center border-b-2 border-dashed border-slate-300 text-[10px] text-slate-400 font-mono relative top-[-1px]">
                                                  Many-to-One
                                              </div>
                                              <div className="p-1.5 bg-indigo-100 border border-indigo-200 rounded shadow-sm text-indigo-600"><FileText size={16}/></div>
                                          </div>
                                          <div className="flex items-center justify-center min-w-[200px] border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-bold cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-500 transition-all">
                                              Create New Link
                                          </div>
                                      </div>
                                  </div>

                                  {/* Actions Section */}
                                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                          <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                                              <MousePointerClick size={16} className="text-rose-500"/> 绑定动作 (Actions)
                                          </h3>
                                          <button className="text-xs font-bold text-rose-600 hover:underline">+ 注册动作</button>
                                      </div>
                                      <div className="divide-y divide-slate-100">
                                          {selectedObject.actions.map(action => (
                                              <div key={action.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 group">
                                                  <div className="flex items-center gap-3">
                                                      <div className={`p-1.5 rounded ${action.type === 'Update' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                                                          <Workflow size={16}/>
                                                      </div>
                                                      <div>
                                                          <div className="text-sm font-bold text-slate-700">{action.name}</div>
                                                          <div className="text-xs text-slate-400">{action.description}</div>
                                                      </div>
                                                  </div>
                                                  <div className="flex items-center gap-4">
                                                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">{action.id}</span>
                                                      <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={16}/></button>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>

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

  // 3. 智能体编排 (Intelligence) - Sub-views
  const renderIntelligence = () => {
      if (intelView === 'menu') {
          return (
              <div className="h-full flex flex-col gap-5 animate-in zoom-in-95 duration-300">
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
                      <div className="flex items-center gap-3 mb-2">
                          <BrainCircuit size={28} className="text-indigo-200"/>
                          <h3 className="text-xl font-bold">智能中枢 (AIP)</h3>
                      </div>
                      <p className="text-sm text-indigo-100 leading-relaxed opacity-90">
                          配置 AI 智能体的认知能力与执行边界。通过编排技能、注入知识库和设定提示词，打造企业级决策助手。
                      </p>
                  </div>

                  <div className="grid gap-4">
                      {/* Cards omitted for brevity - kept same as before */}
                      <div onClick={() => setIntelView('skills_list')} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 cursor-pointer transition-all group flex items-start gap-5">
                          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Wrench size={24}/></div>
                          <div className="flex-1"><h4 className="font-bold text-slate-800 text-lg group-hover:text-purple-700">技能注册中心</h4><p className="text-sm text-slate-500">注册 AI 可调用的工具函数。</p></div>
                      </div>
                      <div onClick={() => setIntelView('knowledge')} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group flex items-start gap-5">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><BookOpen size={24}/></div>
                          <div className="flex-1"><h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-700">知识图谱映射</h4><p className="text-sm text-slate-500">上传企业SOP，构建 RAG 检索增强。</p></div>
                      </div>
                  </div>
              </div>
          );
      }
      // Simplified other views for this update, assuming previous content exists or user navigates
      if (intelView === 'skills_list') return <div className="p-4">Skills List Placeholder <button onClick={()=>setIntelView('menu')} className="text-blue-500 underline">Back</button></div>;
      if (intelView === 'knowledge') return <div className="p-4">Knowledge Base Placeholder <button onClick={()=>setIntelView('menu')} className="text-blue-500 underline">Back</button></div>;
      return null;
  };

  // 4. 模型引擎 (Model)
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
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Model Name (模型ID)</label>
                    <input type="text" value={config.modelName} onChange={(e) => setConfig({ ...config, modelName: e.target.value })} className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono" placeholder="e.g. gemini-3-flash-preview" />
                </div>
            </div>
         </div>
     </div>
  );

  // 5. Layout Configuration (Updated with Global Theme Selector)
  const renderLayoutConfig = () => {
      if (!themeConfig || !onThemeChange) return null;

      const ColorPicker = ({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: {class: string, name: string}[] }) => (
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

      // Global Theme Selector Options
      const globalThemes = [
          { id: 'light', label: '极简白', desc: 'Default Light', icon: Sun, color: 'bg-slate-50', text: 'text-slate-800' },
          { id: 'dark', label: '深邃黑', desc: 'Midnight Dark', icon: Moon, color: 'bg-slate-900', text: 'text-slate-100' },
          { id: 'warm', label: '护眼暖', desc: 'Soft Paper', icon: Coffee, color: 'bg-[#fdfbf7]', text: 'text-stone-700' },
          { id: 'cool', label: '海洋蓝', desc: 'Ocean Breeze', icon: Droplets, color: 'bg-blue-50', text: 'text-blue-900' },
          { id: 'fresh', label: '清新绿', desc: 'Forest Mint', icon: Leaf, color: 'bg-emerald-50', text: 'text-emerald-900' },
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

              {/* Global Theme Selector (New) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <label className="block text-sm font-bold text-slate-700 mb-3">全局主题风格 (Global Theme)</label>
                  <div className="grid grid-cols-5 gap-3">
                      {globalThemes.map((mode) => (
                          <button
                              key={mode.id}
                              onClick={() => onThemeChange({...themeConfig, globalMode: mode.id as GlobalMode})}
                              className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center relative overflow-hidden group ${
                                  themeConfig.globalMode === mode.id 
                                  ? 'border-indigo-600 shadow-sm' 
                                  : 'border-slate-100 hover:border-slate-300'
                              }`}
                          >
                              <div className={`w-full h-12 rounded-lg mb-2 flex items-center justify-center ${mode.color} ${mode.text} border border-black/5`}>
                                  <mode.icon size={20}/>
                              </div>
                              <span className={`text-xs font-bold ${themeConfig.globalMode === mode.id ? 'text-indigo-700' : 'text-slate-500'}`}>{mode.label}</span>
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

              {/* Specific Card Colors */}
              <div className="grid grid-cols-1 gap-6">
                  {/* Reuse existing color options logic */}
                  <ColorPicker 
                    label="全景拓扑卡片 (Hero Card)" 
                    value={themeConfig.heroColor}
                    onChange={(v) => onThemeChange({...themeConfig, heroColor: v})}
                    options={[
                        { class: 'bg-slate-900', name: 'Slate Dark' },
                        { class: 'bg-emerald-600', name: 'Emerald Vibrant' },
                        { class: 'bg-blue-600', name: 'Blue Vibrant' },
                        { class: 'bg-indigo-600', name: 'Indigo Vibrant' },
                        { class: 'bg-slate-100', name: 'Slate Light' },
                    ]}
                  />
              </div>
          </div>
      );
  };

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
                    // Reset ontology view when switching to it, or keep state? Keeping state is better UX usually.
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

            {activeTab === 'intelligence' && renderIntelligence()}
            {activeTab === 'model' && renderModelEngine()}
            {activeTab === 'layout' && renderLayoutConfig()}
            {activeTab === 'manual' && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                    <Upload size={56} className="opacity-20"/>
                    <p className="text-sm">请选择上方 <span className="font-bold text-slate-600">“系统集成”</span> 标签页配置自动同步，<br/>或在此处拖拽 JSON 文件进行离线更新。</p>
                </div>
            )}
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
