
import React, { useState, useEffect } from 'react';
import { 
  Save, Server, Upload, Bot, Database, Globe, Lock, Box, Cuboid, Plus, 
  Settings, Share2, Layout, Cpu, BrainCircuit, Wrench, BookOpen, Code2, 
  Search, ArrowLeft, ArrowRight, Check, Trash2, FileText, FileSpreadsheet, 
  AlertCircle, CheckCircle2, RefreshCw, Zap, Link as LinkIcon, Variable, 
  ChevronRight, Sparkles, Terminal, FileType, GitFork, Layers, Plug, Activity 
} from 'lucide-react';
import { LLMConfig, DataSourceConfig, DataPipelineConfig, ObjectTypeDef, AISkill } from '../types';

interface Props {
  currentConfig: LLMConfig;
  onConfigSave: (config: LLMConfig) => void;
  onDataImport: (type: 'graph' | 'inventory' | 'orders' | 'production', data: any) => void;
}

// --- MOCK DATA (本地模拟数据) ---
const MOCK_OBJECTS: ObjectTypeDef[] = [
    { 
        id: 'obj_order', name: '生产订单 (ProductionOrder)', icon: 'FileText', properties: [], 
        actions: [
            { id: 'act_reschedule', name: '调整排期', description: '修改订单交付日期', parameters: [], type: 'Update' },
            { id: 'act_split', name: '拆分工单', description: '按比例拆分生产批次', parameters: [], type: 'TriggerWorkflow' }
        ] 
    },
    { 
        id: 'obj_inventory', name: '物料库存 (Inventory)', icon: 'Box', properties: [], 
        actions: [
            { id: 'act_transfer', name: '库存调拨', description: '跨基地调货', parameters: [], type: 'Update' },
            { id: 'act_po', name: '创建采购单', description: '触发紧急采购流程', parameters: [], type: 'Create' }
        ] 
    },
    { 
        id: 'obj_line', name: '产线设备 (Equipment)', icon: 'Server', properties: [], 
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

const SettingsPanel: React.FC<Props> = ({ currentConfig, onConfigSave, onDataImport }) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'connectors' | 'ontology' | 'intelligence' | 'model' | 'manual'>('ontology');
  
  // Intelligence Sub-View State
  const [intelView, setIntelView] = useState<'menu' | 'skills_list' | 'skills_detail' | 'knowledge' | 'prompt'>('menu');
  
  // Data State
  const [config, setConfig] = useState<LLMConfig>(currentConfig);
  const [skills, setSkills] = useState<AISkill[]>(INITIAL_SKILLS);
  const [selectedSkill, setSelectedSkill] = useState<AISkill | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => { setConfig(currentConfig); }, [currentConfig]);

  // Handlers
  const handleSaveConfig = () => {
    onConfigSave(config);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
      // Simulation only
      alert(`已开始解析文件并导入 ${type} 数据...`);
  };

  const updateSkill = (updated: AISkill) => {
      setSkills(prev => prev.map(s => s.id === updated.id ? updated : s));
      setSelectedSkill(updated);
  };

  // --- RENDER HELPERS ---

  // 1. 系统集成 (Connectors)
  const renderConnectors = () => (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-start gap-2">
              <Plug className="text-blue-600 mt-0.5 shrink-0" size={16} />
              <div className="text-xs text-blue-800">
                  <p className="font-bold mb-1">多源异构数据集成</p>
                  已配置 3 个核心业务系统连接器。数据同步策略：实时(MES) / T+1(ERP)。
              </div>
          </div>
          
          <div className="space-y-3">
              {[
                  { name: 'SAP S/4HANA (Global)', type: 'ERP', status: 'active', sync: '10分钟前' },
                  { name: 'Siemens Opcenter', type: 'MES', status: 'active', sync: '实时' },
                  { name: 'Salesforce CRM', type: 'CRM', status: 'error', sync: '2天前' },
              ].map((conn, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs text-white ${conn.type === 'ERP' ? 'bg-[#0a2540]' : conn.type === 'MES' ? 'bg-orange-600' : 'bg-blue-500'}`}>
                              {conn.type}
                          </div>
                          <div>
                              <div className="font-bold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">{conn.name}</div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Lock size={10}/> OAuth 2.0 • {conn.sync}
                              </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${conn.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                          <ChevronRight size={16} className="text-slate-300"/>
                      </div>
                  </div>
              ))}
              <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 text-xs font-bold hover:bg-slate-50 hover:border-slate-400 flex items-center justify-center gap-2 transition-all">
                  <Plus size={16}/> 新建数据连接
              </button>
          </div>
      </div>
  );

  // 2. 业务本体 (Ontology)
  const renderOntology = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center space-y-3">
             <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                 <Cuboid size={24}/>
             </div>
             <div>
                 <h3 className="text-sm font-bold text-slate-800">业务对象建模</h3>
                 <p className="text-xs text-slate-500 mt-1">定义实体、属性及其关系，构建数字孪生语义层。</p>
             </div>
          </div>
          
          <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">已定义对象 ({MOCK_OBJECTS.length})</h4>
              <div className="grid gap-2">
                  {MOCK_OBJECTS.map(obj => (
                      <div key={obj.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between hover:shadow-sm">
                          <div className="flex items-center gap-3">
                              <Box size={16} className="text-slate-400"/>
                              <span className="text-sm font-bold text-slate-700">{obj.name}</span>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                              {obj.actions.length} 个动作
                          </span>
                      </div>
                  ))}
              </div>
          </div>
          <div className="text-center">
             <button className="text-xs text-indigo-600 font-bold hover:underline flex items-center justify-center gap-1">
                 进入本体编辑器 <ArrowRight size={12}/>
             </button>
          </div>
      </div>
  );

  // 3. 智能体编排 (Intelligence) - Sub-views
  const renderIntelligence = () => {
      // --- MENU VIEW ---
      if (intelView === 'menu') {
          return (
              <div className="h-full flex flex-col gap-4 animate-in zoom-in-95 duration-300">
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 text-white shadow-lg">
                      <div className="flex items-center gap-3 mb-2">
                          <BrainCircuit size={24} className="text-indigo-200"/>
                          <h3 className="text-lg font-bold">智能中枢 (AIP)</h3>
                      </div>
                      <p className="text-xs text-indigo-100 leading-relaxed opacity-90">
                          配置 AI 智能体的认知能力与执行边界。通过编排技能、注入知识库和设定提示词，打造企业级决策助手。
                      </p>
                  </div>

                  <div className="grid gap-4">
                      {/* Skill Registry Card */}
                      <div 
                        onClick={() => setIntelView('skills_list')}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 cursor-pointer transition-all group flex items-start gap-4"
                      >
                          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              <Wrench size={20}/>
                          </div>
                          <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                  <h4 className="font-bold text-slate-800 group-hover:text-purple-700">技能注册中心</h4>
                                  <ChevronRight size={16} className="text-slate-300 group-hover:text-purple-500"/>
                              </div>
                              <p className="text-xs text-slate-500 leading-tight">注册 AI 可调用的工具函数，并将其映射到本体动作(Actions)。</p>
                          </div>
                      </div>

                      {/* Knowledge Base Card */}
                      <div 
                        onClick={() => setIntelView('knowledge')}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group flex items-start gap-4"
                      >
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              <BookOpen size={20}/>
                          </div>
                          <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                  <h4 className="font-bold text-slate-800 group-hover:text-blue-700">知识图谱映射</h4>
                                  <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500"/>
                              </div>
                              <p className="text-xs text-slate-500 leading-tight">上传企业SOP、历史案例库，构建垂直领域 RAG 检索增强。</p>
                          </div>
                      </div>

                      {/* Prompt Card */}
                      <div 
                        onClick={() => setIntelView('prompt')}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 cursor-pointer transition-all group flex items-start gap-4"
                      >
                          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              <Code2 size={20}/>
                          </div>
                          <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                  <h4 className="font-bold text-slate-800 group-hover:text-emerald-700">系统提示词</h4>
                                  <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500"/>
                              </div>
                              <p className="text-xs text-slate-500 leading-tight">定义智能体的角色人设、思维链(CoT)逻辑及输出规范。</p>
                          </div>
                      </div>
                  </div>
              </div>
          );
      }

      // --- SKILLS LIST VIEW ---
      if (intelView === 'skills_list') {
          return (
              <div className="h-full flex flex-col animate-in slide-in-from-right-8">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                      <button onClick={() => setIntelView('menu')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><ArrowLeft size={16}/></button>
                      <h3 className="font-bold text-slate-800">技能注册中心</h3>
                      <span className="text-xs text-slate-400 ml-auto">{skills.length} 个技能</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3">
                      {skills.map(skill => (
                          <div 
                            key={skill.id}
                            onClick={() => { setSelectedSkill(skill); setIntelView('skills_detail'); }}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md cursor-pointer transition-all"
                          >
                              <div className="flex justify-between items-start mb-2">
                                  <div className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                      {skill.name}
                                      {skill.linkedActionId && <LinkIcon size={12} className="text-purple-500"/>}
                                  </div>
                                  <div className={`w-2 h-2 rounded-full ${skill.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2">{skill.description}</p>
                          </div>
                      ))}
                      <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-2">
                          <Plus size={14}/> 注册新技能
                      </button>
                  </div>
              </div>
          );
      }

      // --- SKILL DETAIL VIEW ---
      if (intelView === 'skills_detail' && selectedSkill) {
          return (
              <div className="h-full flex flex-col animate-in slide-in-from-right-8">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                      <button onClick={() => setIntelView('skills_list')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><ArrowLeft size={16}/></button>
                      <h3 className="font-bold text-slate-800">配置技能</h3>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-5">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">技能名称</label>
                          <input 
                            type="text" 
                            value={selectedSkill.name}
                            onChange={(e) => updateSkill({...selectedSkill, name: e.target.value})}
                            className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
                          />
                      </div>
                      
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">功能描述</label>
                          <textarea 
                            value={selectedSkill.description}
                            onChange={(e) => updateSkill({...selectedSkill, description: e.target.value})}
                            className="w-full text-xs border border-slate-300 rounded-lg p-2.5 h-20 resize-none focus:ring-2 focus:ring-purple-500 outline-none"
                          />
                      </div>

                      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-2 text-purple-800 font-bold text-xs border-b border-purple-100 pb-2">
                              <LinkIcon size={14}/> 业务语义映射
                          </div>
                          <p className="text-[10px] text-purple-600">将此 AI 技能绑定到业务对象的具体执行动作，使智能体具备“写操作”权限。</p>
                          
                          <div className="grid grid-cols-1 gap-3">
                              <div>
                                  <label className="text-[10px] font-bold text-purple-700 block mb-1">目标对象</label>
                                  <select className="w-full text-xs border border-purple-200 rounded p-2 bg-white text-slate-700 outline-none">
                                      <option value="">选择业务对象...</option>
                                      {MOCK_OBJECTS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold text-purple-700 block mb-1">执行动作</label>
                                  <select 
                                    className="w-full text-xs border border-purple-200 rounded p-2 bg-white text-slate-700 outline-none"
                                    value={selectedSkill.linkedActionId || ''}
                                    onChange={(e) => updateSkill({...selectedSkill, linkedActionId: e.target.value})}
                                  >
                                      <option value="">(无绑定 - 仅推理)</option>
                                      {MOCK_OBJECTS.flatMap(o => o.actions).map(a => (
                                          <option key={a.id} value={a.id}>{a.name}</option>
                                      ))}
                                  </select>
                              </div>
                          </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                          <span className="text-xs font-bold text-slate-600">启用此技能</span>
                          <div 
                            onClick={() => updateSkill({...selectedSkill, isEnabled: !selectedSkill.isEnabled})}
                            className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${selectedSkill.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          >
                              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${selectedSkill.isEnabled ? 'left-5.5' : 'left-0.5'}`}></div>
                          </div>
                      </div>
                  </div>
              </div>
          );
      }

      // --- KNOWLEDGE BASE VIEW ---
      if (intelView === 'knowledge') {
          return (
             <div className="h-full flex flex-col animate-in slide-in-from-right-8">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                      <button onClick={() => setIntelView('menu')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><ArrowLeft size={16}/></button>
                      <h3 className="font-bold text-slate-800">知识库配置</h3>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                      {/* Upload Area */}
                      <div className="border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all mb-6 group">
                          <Upload size={24} className="text-slate-400 group-hover:text-blue-500 mb-2 transition-colors"/>
                          <p className="text-sm font-bold text-slate-600">点击或拖拽上传文件</p>
                          <p className="text-[10px] text-slate-400 mt-1">支持 PDF, Word, Excel, Markdown (最大 50MB)</p>
                      </div>

                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 px-1">已索引文档</h4>
                      <div className="space-y-2">
                          {[
                              { name: '2024_Q4_供应链应急预案.pdf', type: 'pdf', status: 'ready', size: '2.4 MB' },
                              { name: '各基地产能参数表_v3.xlsx', type: 'xls', status: 'processing', size: '800 KB' },
                              { name: '物流商合同条款.docx', type: 'doc', status: 'ready', size: '1.2 MB' },
                          ].map((file, i) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm">
                                  <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${file.type === 'pdf' ? 'bg-red-50 text-red-600' : file.type === 'xls' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                          {file.type === 'pdf' ? <FileText size={16}/> : file.type === 'xls' ? <FileSpreadsheet size={16}/> : <FileText size={16}/>}
                                      </div>
                                      <div>
                                          <div className="text-xs font-bold text-slate-700 truncate max-w-[180px]">{file.name}</div>
                                          <div className="text-[10px] text-slate-400">{file.size}</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      {file.status === 'ready' ? (
                                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                              <CheckCircle2 size={10}/> 已就绪
                                          </span>
                                      ) : (
                                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                              <RefreshCw size={10} className="animate-spin"/> 解析中
                                          </span>
                                      )}
                                      <button className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
             </div>
          );
      }

      // --- SYSTEM PROMPT VIEW ---
      if (intelView === 'prompt') {
          return (
             <div className="h-full flex flex-col animate-in slide-in-from-right-8">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                      <button onClick={() => setIntelView('menu')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><ArrowLeft size={16}/></button>
                      <h3 className="font-bold text-slate-800">系统提示词工程</h3>
                  </div>

                  <div className="flex-1 flex gap-4 h-full overflow-hidden">
                      {/* Editor */}
                      <div className="flex-1 relative flex flex-col">
                          <div className="bg-slate-800 text-slate-400 text-[10px] px-3 py-1.5 rounded-t-lg flex items-center justify-between">
                              <span>system_prompt.md</span>
                              <Sparkles size={10} className="text-yellow-400"/>
                          </div>
                          <textarea 
                              className="flex-1 w-full bg-slate-900 text-slate-200 p-4 font-mono text-xs leading-relaxed resize-none focus:outline-none rounded-b-lg custom-scrollbar"
                              defaultValue={`# 角色定义
你是一家大型锂电池制造企业的供应链专家智能助手。
你的目标是优化库存水平、生产排期和物流交付。

# 约束条件
1. 安全优先：永远不要提出违反安全库存限制 (< 2000 Ah) 的计划。
2. 成本与服务：在物流成本和VIP客户交付之间，优先保障VIP客户。

# 输出格式
- 使用 Markdown 表格进行数据对比。
- 总是解释你做出决策背后的推理逻辑。`}
                          />
                      </div>

                      {/* Variable Pool Sidebar */}
                      <div className="w-32 flex flex-col gap-2 shrink-0">
                          <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                              <Variable size={12}/> 上下文变量池
                          </div>
                          {['inventory_level', 'user_role', 'current_date', 'graph_topology', 'alert_count'].map(v => (
                              <div key={v} className="bg-slate-100 border border-slate-200 px-2 py-1.5 rounded text-[10px] font-mono text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 cursor-pointer transition-colors truncate" title={`点击插入 {{${v}}}`}>
                                  {`{{${v}}}`}
                              </div>
                          ))}
                      </div>
                  </div>
             </div>
          );
      }
      return null;
  };

  // 4. 模型引擎 (Model)
  const renderModelEngine = () => (
     <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
         <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
             <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                 <Cpu size={24}/>
             </div>
             <h3 className="text-sm font-bold text-slate-800">LLM 模型引擎配置</h3>
         </div>

         <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">服务提供商 (Provider)</label>
                <div className="grid grid-cols-3 gap-2">
                    {(['gemini', 'kimi', 'rendu'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setConfig({ ...config, provider: p })}
                            className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                                config.provider === p 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {p === 'gemini' ? 'Google Gemini' : p === 'kimi' ? 'Kimi (Moonshot)' : 'Rendu LLM'}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">API 密钥 (Key)</label>
                <div className="relative">
                    <input 
                        type="password" 
                        value={config.apiKey}
                        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs pl-9 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="sk-..."
                    />
                    <Lock size={14} className="absolute left-3 top-2.5 text-slate-400"/>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 size={10} className="text-emerald-500"/> 密钥仅加密存储于本地浏览器，不上传服务器。
                </p>
            </div>
         </div>
     </div>
  );

  return (
    <div className="flex flex-col h-full bg-white w-full">
      {/* Settings Header */}
      <div className="p-5 border-b border-slate-200 bg-slate-50 shrink-0">
        <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <Server className="text-slate-600" size={20} />
          系统配置中心
        </h2>
        <p className="text-xs text-slate-500 mt-1">全域配置与集成中心</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-2 overflow-x-auto no-scrollbar shrink-0">
        {[
            { id: 'ontology', label: '业务定义', icon: Cuboid },
            { id: 'connectors', label: '系统集成', icon: Plug },
            { id: 'intelligence', label: '智能中枢', icon: BrainCircuit },
            { id: 'model', label: '模型引擎', icon: Cpu },
            { id: 'manual', label: '数据导入', icon: Upload },
        ].map((tab) => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[70px] py-3 text-xs font-bold flex flex-col items-center justify-center gap-1.5 border-b-2 transition-colors ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
                <tab.icon size={16}/>
                {tab.label}
            </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 overflow-y-auto p-5 custom-scrollbar">
            {activeTab === 'connectors' && renderConnectors()}
            {activeTab === 'ontology' && renderOntology()}
            {activeTab === 'intelligence' && renderIntelligence()}
            {activeTab === 'model' && renderModelEngine()}
            {activeTab === 'manual' && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                    <Upload size={48} className="opacity-20"/>
                    <p className="text-xs">请选择上方 <span className="font-bold text-slate-600">“系统集成”</span> 标签页配置自动同步，<br/>或在此处拖拽 JSON 文件进行离线更新。</p>
                </div>
            )}
          </div>
      </div>

      {/* Footer Save Action */}
      <div className="p-4 border-t border-slate-200 bg-white shrink-0">
          <button 
            onClick={handleSaveConfig}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
          >
            {showSaved ? <CheckCircle2 size={18} className="text-emerald-400"/> : <Save size={18}/>}
            {showSaved ? '配置已保存' : '保存系统设置'}
          </button>
      </div>
    </div>
  );
};

export default SettingsPanel;
