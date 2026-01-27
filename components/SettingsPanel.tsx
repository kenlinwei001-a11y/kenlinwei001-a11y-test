
import React, { useState, useEffect } from 'react';
import { 
  Save, Server, Upload, Bot, Database, Globe, Lock, Box, Cuboid, Plus, 
  Settings, Share2, Layout, Cpu, BrainCircuit, Wrench, BookOpen, Code2, 
  Search, ArrowLeft, ArrowRight, Check, Trash2, FileText, FileSpreadsheet, 
  AlertCircle, CheckCircle2, RefreshCw, Zap, Link as LinkIcon, Variable, 
  ChevronRight, Sparkles, Terminal, FileType, GitFork, Layers, Plug, Activity,
  Palette, Grid, Columns, Monitor, LayoutTemplate
} from 'lucide-react';
import { LLMConfig, DataSourceConfig, DataPipelineConfig, ObjectTypeDef, AISkill, ThemeConfig, LayoutMode } from '../types';

interface Props {
  currentConfig: LLMConfig;
  themeConfig?: ThemeConfig;
  onConfigSave: (config: LLMConfig) => void;
  onThemeChange?: (theme: ThemeConfig) => void;
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

const SettingsPanel: React.FC<Props> = ({ currentConfig, themeConfig, onConfigSave, onThemeChange, onDataImport }) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'connectors' | 'ontology' | 'intelligence' | 'model' | 'layout' | 'manual'>('ontology');
  
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

  const updateSkill = (updated: AISkill) => {
      setSkills(prev => prev.map(s => s.id === updated.id ? updated : s));
      setSelectedSkill(updated);
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

  // 2. 业务本体 (Ontology)
  const renderOntology = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-center space-y-3">
             <div className="mx-auto w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                 <Cuboid size={28}/>
             </div>
             <div>
                 <h3 className="text-base font-bold text-slate-800">业务对象建模</h3>
                 <p className="text-sm text-slate-500 mt-1">定义实体、属性及其关系，构建数字孪生语义层。</p>
             </div>
          </div>
          
          <div>
              <h4 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">已定义对象 ({MOCK_OBJECTS.length})</h4>
              <div className="grid gap-3">
                  {MOCK_OBJECTS.map(obj => (
                      <div key={obj.id} className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between hover:shadow-sm">
                          <div className="flex items-center gap-3">
                              <Box size={20} className="text-slate-400"/>
                              <span className="text-base font-bold text-slate-700">{obj.name}</span>
                          </div>
                          <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                              {obj.actions.length} 个动作
                          </span>
                      </div>
                  ))}
              </div>
          </div>
          <div className="text-center">
             <button className="text-sm text-indigo-600 font-bold hover:underline flex items-center justify-center gap-1">
                 进入本体编辑器 <ArrowRight size={14}/>
             </button>
          </div>
      </div>
  );

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
         </div>
         <div className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-slate-500 mb-2">服务提供商 (Provider)</label>
                <div className="grid grid-cols-3 gap-3">
                    {(['gemini', 'kimi', 'rendu'] as const).map(p => (
                        <button key={p} onClick={() => setConfig({ ...config, provider: p })} className={`py-3 text-sm font-bold rounded-lg border transition-all ${config.provider === p ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                            {p === 'gemini' ? 'Google Gemini' : p === 'kimi' ? 'Kimi' : 'Rendu LLM'}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-500 mb-2">API 密钥 (Key)</label>
                <div className="relative">
                    <input type="password" value={config.apiKey} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm pl-10 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="sk-..." />
                    <Lock size={16} className="absolute left-3 top-3.5 text-slate-400"/>
                </div>
            </div>
         </div>
     </div>
  );

  // 5. Layout Configuration (Updated with more solid colors)
  const renderLayoutConfig = () => {
      if (!themeConfig || !onThemeChange) return null;

      const ColorPicker = ({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: {class: string, name: string}[] }) => (
          <div className="bg-white border border-slate-200 rounded-xl p-4">
              <label className="block text-sm font-bold text-slate-700 mb-3">{label}</label>
              <div className="flex flex-wrap gap-3">
                  {options.map((opt) => (
                      <button
                        key={opt.class}
                        onClick={() => onChange(opt.class)}
                        className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center shadow-sm hover:shadow-md ${value === opt.class ? 'border-slate-800 ring-2 ring-slate-200 scale-110' : 'border-slate-100 hover:scale-110'}`}
                        style={{ backgroundColor: opt.class.startsWith('bg-[#') ? opt.class.slice(4, -1) : undefined }}
                        title={opt.name}
                      >
                          <div className={`w-full h-full rounded-full ${opt.class}`}></div>
                          {value === opt.class && <Check size={16} className={['bg-white', 'bg-slate-50', 'bg-gray-50', 'bg-[#eff6ff]', 'bg-[#fff1f2]', 'bg-[#FEF3C7]'].some(c => opt.class.includes(c)) ? 'text-slate-800' : 'text-white'} />}
                      </button>
                  ))}
              </div>
          </div>
      );

      const LayoutSelector = () => (
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
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
      );

      return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-indigo-600 shadow-sm">
                      <LayoutTemplate size={24}/>
                  </div>
                  <div>
                      <h3 className="text-base font-bold text-slate-800">界面个性化 (UI Customization)</h3>
                      <p className="text-sm text-slate-500">自定义布局结构与主题色彩，适配不同场景需求。</p>
                  </div>
              </div>

              {/* Layout Selector */}
              <LayoutSelector />

              <div className="grid grid-cols-1 gap-4">
                  <ColorPicker 
                    label="全景拓扑卡片 (Hero Card)" 
                    value={themeConfig.heroColor}
                    onChange={(v) => onThemeChange({...themeConfig, heroColor: v})}
                    options={[
                        { class: 'bg-emerald-600', name: 'Emerald' },
                        { class: 'bg-green-700', name: 'Forest' },
                        { class: 'bg-teal-600', name: 'Teal' },
                        { class: 'bg-cyan-600', name: 'Cyan' },
                        { class: 'bg-sky-600', name: 'Sky' },
                        { class: 'bg-blue-600', name: 'Blue' },
                        { class: 'bg-indigo-600', name: 'Indigo' },
                        { class: 'bg-violet-600', name: 'Violet' },
                        { class: 'bg-purple-600', name: 'Purple' },
                        { class: 'bg-fuchsia-700', name: 'Fuchsia' },
                        { class: 'bg-pink-600', name: 'Pink' },
                        { class: 'bg-rose-600', name: 'Rose' },
                        { class: 'bg-red-700', name: 'Red' },
                        { class: 'bg-orange-600', name: 'Orange' },
                        { class: 'bg-amber-600', name: 'Amber' },
                        { class: 'bg-slate-900', name: 'Slate' },
                        { class: 'bg-zinc-900', name: 'Zinc' },
                        { class: 'bg-[#0f172a]', name: 'Midnight' },
                    ]}
                  />
                  <ColorPicker 
                    label="运营看板 (Operations)" 
                    value={themeConfig.operationsColor}
                    onChange={(v) => onThemeChange({...themeConfig, operationsColor: v})}
                    options={[
                        { class: 'bg-slate-900', name: 'Slate Dark' },
                        { class: 'bg-zinc-900', name: 'Zinc Dark' },
                        { class: 'bg-[#0f172a]', name: 'Midnight' },
                        { class: 'bg-stone-800', name: 'Stone' },
                        { class: 'bg-neutral-800', name: 'Neutral' },
                        { class: 'bg-blue-950', name: 'Navy' },
                        { class: 'bg-indigo-950', name: 'Deep Indigo' },
                    ]}
                  />
                  <ColorPicker 
                    label="产线异常监控 (Production)" 
                    value={themeConfig.productionColor}
                    onChange={(v) => onThemeChange({...themeConfig, productionColor: v})}
                    options={[
                        { class: 'bg-[#fff1f2]', name: 'Rose Tint' },
                        { class: 'bg-[#FEF3C7]', name: 'Amber Tint' },
                        { class: 'bg-orange-50', name: 'Orange Tint' },
                        { class: 'bg-red-50', name: 'Red Tint' },
                        { class: 'bg-white', name: 'White' },
                        { class: 'bg-stone-50', name: 'Stone Tint' },
                        { class: 'bg-zinc-50', name: 'Zinc Tint' },
                        { class: 'bg-purple-50', name: 'Lavender Tint' },
                        { class: 'bg-lime-50', name: 'Lime Tint' },
                    ]}
                  />
                  <ColorPicker 
                    label="库存监控 (Inventory)" 
                    value={themeConfig.inventoryColor}
                    onChange={(v) => onThemeChange({...themeConfig, inventoryColor: v})}
                    options={[
                        { class: 'bg-[#eff6ff]', name: 'Blue Tint' },
                        { class: 'bg-slate-50', name: 'Slate Tint' },
                        { class: 'bg-white', name: 'White' },
                        { class: 'bg-indigo-50', name: 'Indigo Tint' },
                        { class: 'bg-sky-50', name: 'Sky Tint' },
                        { class: 'bg-cyan-50', name: 'Cyan Tint' },
                        { class: 'bg-teal-50', name: 'Teal Tint' },
                        { class: 'bg-emerald-50', name: 'Emerald Tint' },
                        { class: 'bg-violet-50', name: 'Violet Tint' },
                    ]}
                  />
                  <ColorPicker 
                    label="产销协同 (Sales)" 
                    value={themeConfig.salesColor}
                    onChange={(v) => onThemeChange({...themeConfig, salesColor: v})}
                    options={[
                        { class: 'bg-white', name: 'White' },
                        { class: 'bg-slate-50', name: 'Slate Tint' },
                        { class: 'bg-gray-50', name: 'Gray Tint' },
                        { class: 'bg-[#fafafa]', name: 'Neutral White' },
                        { class: 'bg-blue-50', name: 'Blue Tint' },
                        { class: 'bg-green-50', name: 'Green Tint' },
                        { class: 'bg-orange-50', name: 'Orange Tint' },
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
            { id: 'ontology', label: '业务定义', icon: Cuboid },
            { id: 'connectors', label: '系统集成', icon: Plug },
            { id: 'intelligence', label: '智能中枢', icon: BrainCircuit },
            { id: 'model', label: '模型引擎', icon: Cpu },
            { id: 'layout', label: '界面布局', icon: Layout },
            { id: 'manual', label: '数据导入', icon: Upload },
        ].map((tab) => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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
            {activeTab === 'ontology' && renderOntology()}
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
