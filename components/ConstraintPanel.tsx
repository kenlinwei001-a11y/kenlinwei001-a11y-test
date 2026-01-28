
import React, { useState, useEffect } from 'react';
import { ConstraintCategory, ConstraintItem, NodeData, NodeType, ScenarioConfig, ConstraintLogic, ConstraintRelationType } from '../types';
import { Settings, Sliders, Activity, Zap, Search, Plus, Save, X, Sparkles, Trash2, List, Edit2, ArrowDown, GitCommit, Database as DbIcon, Link as LinkIcon, AlertTriangle, BrainCircuit, Truck, TrendingUp, Factory, Package } from 'lucide-react';

interface Props {
  constraints: ConstraintCategory[];
  nodes: NodeData[]; // Need access to graph nodes to populate dropdowns
  onToggleConstraint: (categoryId: string, itemId: string) => void;
  onRunSimulation: (configs: ScenarioConfig[]) => void;
  onAnalyzeConstraint: (text: string) => Promise<Partial<ConstraintItem>>;
  onAddConstraint: (item: ConstraintItem) => void;
  isSimulating: boolean;
  initialTab?: 'constraints' | 'scenarios'; // New Prop
}

const ConstraintPanel: React.FC<Props> = ({ 
    constraints, 
    nodes, 
    onToggleConstraint, 
    onRunSimulation, 
    onAnalyzeConstraint,
    onAddConstraint,
    isSimulating,
    initialTab = 'scenarios'
}) => {
  const [activeTab, setActiveTab] = useState<'constraints' | 'scenarios'>(initialTab);
  
  // Sync tab when prop changes (e.g. clicking different sidebar icons)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Multi-Scenario State
  const [pendingScenarios, setPendingScenarios] = useState<ScenarioConfig[]>([]);

  // Scenario Builder Form State
  const [selectedType, setSelectedType] = useState<string>('SUPPLY_DELAY'); 
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [formParams, setFormParams] = useState<any>({});
  
  // Constraint Logic Builder State
  const [isEditingConstraint, setIsEditingConstraint] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  
  // The Constraint being edited
  const [currentConstraint, setCurrentConstraint] = useState<ConstraintItem>({
      id: '',
      label: '',
      description: '',
      enabled: true,
      impactLevel: 'medium',
      logic: {
          relationType: 'IMPACT',
          operator: '>'
      },
      source: 'manual'
  });

  // AI Parsing State
  const [newConstraintText, setNewConstraintText] = useState('');
  const [analyzingConstraint, setAnalyzingConstraint] = useState(false);

  // Computed properties for the Scenario builder
  let targetNodeType = NodeType.SUPPLIER;
  if (selectedType === 'DEMAND_CHANGE') targetNodeType = NodeType.CUSTOMER;
  if (selectedType === 'PRODUCTION_ISSUE' || selectedType === 'INVENTORY_ISSUE') targetNodeType = NodeType.BASE;
  
  const targetNodes = nodes.filter(n => n.type === targetNodeType);
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // Reset form when type changes
  useEffect(() => {
    setSelectedNodeId('');
    setFormParams({});
  }, [selectedType]);

  // Set default values when node is selected
  useEffect(() => {
    if (selectedNode) {
        if (selectedType === 'SUPPLY_DELAY') {
            setFormParams({ delayDays: 7, supplyVolume: (selectedNode.inventoryLevel || 5000) * 0.5 });
        } else if (selectedType === 'DEMAND_CHANGE') {
            setFormParams({ demandChange: -20, deliveryDate: '2024-W44' });
        } else if (selectedType === 'PRODUCTION_ISSUE') {
            setFormParams({ downtimeDays: 3, efficiencyLoss: 50 });
        } else if (selectedType === 'INVENTORY_ISSUE') {
            setFormParams({ currentLevel: (selectedNode.inventoryLevel || 10000) * 1.5, threshold: 12000 });
        }
    }
  }, [selectedNode, selectedType]);

  const handleAddScenario = () => {
    if (!selectedNode) return;

    let desc = '';
    if (selectedType === 'SUPPLY_DELAY') desc = `${selectedNode.name} 物流延期 ${formParams.delayDays} 天`;
    if (selectedType === 'DEMAND_CHANGE') desc = `${selectedNode.name} 需求调整 ${formParams.demandChange}%`;
    if (selectedType === 'PRODUCTION_ISSUE') desc = `${selectedNode.name} 产线故障停机 ${formParams.downtimeDays} 天`;
    if (selectedType === 'INVENTORY_ISSUE') desc = `${selectedNode.name} 库存超限 (当前: ${formParams.currentLevel})`;

    const newScenario: ScenarioConfig = {
        id: Date.now().toString(),
        targetNodeId: selectedNode.id,
        targetNodeName: selectedNode.name,
        type: selectedType as any,
        parameters: { ...formParams },
        description: desc
    };

    setPendingScenarios([...pendingScenarios, newScenario]);
    setSelectedNodeId('');
  };

  const removeScenario = (id: string) => {
    setPendingScenarios(pendingScenarios.filter(s => s.id !== id));
  };

  const handleRunJointSimulation = () => {
      if (pendingScenarios.length === 0) return;
      onRunSimulation(pendingScenarios);
  };

  // === Constraint Logic Builder Functions ===

  const handleStartCreateConstraint = () => {
      setEditMode('create');
      setCurrentConstraint({
          id: `custom-${Date.now()}`,
          label: '',
          description: '',
          enabled: true,
          impactLevel: 'medium',
          logic: { relationType: 'TRIGGER', operator: '>' },
          source: 'manual'
      });
      setIsEditingConstraint(true);
      setNewConstraintText('');
  };

  const handleStartEditConstraint = (item: ConstraintItem) => {
      setEditMode('edit');
      // Ensure logic object exists
      setCurrentConstraint({
          ...item,
          logic: item.logic || { relationType: 'TRIGGER', operator: '>' }
      });
      setIsEditingConstraint(true);
  };

  const handleAnalyzeClick = async () => {
      if (!newConstraintText.trim()) return;
      setAnalyzingConstraint(true);
      try {
          const result = await onAnalyzeConstraint(newConstraintText);
          setCurrentConstraint(prev => ({
              ...prev,
              label: result.label || prev.label,
              description: result.description || prev.description,
              impactLevel: result.impactLevel as any || prev.impactLevel,
              formula: result.formula,
              // Simple heuristic to map formula to logic struct if possible, otherwise keep defaults
              logic: {
                  ...prev.logic!,
                  actionDescription: result.formula // Store basic formula in action for now
              }
          }));
      } finally {
          setAnalyzingConstraint(false);
      }
  };

  const handleSaveConstraint = () => {
      if (!currentConstraint.label) return;
      onAddConstraint(currentConstraint);
      setIsEditingConstraint(false);
  };

  const updateLogic = (field: keyof ConstraintLogic, value: any) => {
      setCurrentConstraint(prev => ({
          ...prev,
          logic: { ...prev.logic!, [field]: value }
      }));
  };

  // --- Visual Helpers for Scenario Types ---
  const SCENARIO_TYPES = [
      { id: 'SUPPLY_DELAY', label: '上游供货延期', icon: Truck, color: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
      { id: 'DEMAND_CHANGE', label: '下游需求变更', icon: TrendingUp, color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
      { id: 'PRODUCTION_ISSUE', label: '基地产线故障', icon: Factory, color: 'bg-red-100 text-red-700', border: 'border-red-200' },
      { id: 'INVENTORY_ISSUE', label: '库存水位预警', icon: Package, color: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-200' },
  ];

  return (
    <div className="flex flex-col h-full bg-white w-full">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-200 shrink-0 bg-white z-10">
        <button 
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-2 ${activeTab === 'scenarios' ? 'text-indigo-600 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}
            onClick={() => setActiveTab('scenarios')}
        >
            <Zap size={16} />
            场景模拟 (Simulation)
        </button>
        <button 
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-2 ${activeTab === 'constraints' ? 'text-indigo-600 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}
            onClick={() => setActiveTab('constraints')}
        >
            <Sliders size={16} />
            推演配置 (Rules)
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'constraints' ? (
           // CONSTRAINTS VIEW: Centered layout with max-width
           <div className="h-full overflow-y-auto bg-slate-50/50 p-6 custom-scrollbar">
              <div className="max-w-2xl mx-auto space-y-6 pb-10">
                  {!isEditingConstraint ? (
                      <>
                        <button 
                            onClick={handleStartCreateConstraint}
                            className="w-full py-4 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-xl hover:bg-indigo-50 hover:border-indigo-400 transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-sm"
                        >
                            <Plus size={18} />
                            新增规则对象
                        </button>

                        {constraints.map((category) => (
                            <div key={category.id} className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
                                    {category.name}
                                </h3>
                                <div className="space-y-3">
                                    {category.items.map((item) => (
                                    <div key={item.id} className={`group bg-white rounded-xl p-4 border transition-all shadow-sm hover:shadow-md ${item.source === 'ai' ? 'border-purple-200 bg-purple-50/10' : 'border-slate-200 hover:border-indigo-200'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => handleStartEditConstraint(item)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <label className="text-sm font-bold text-slate-800 cursor-pointer select-none">
                                                    {item.label}
                                                </label>
                                                {item.source === 'ai' && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-purple-500 px-1.5 py-0.5 rounded-full">
                                                        <BrainCircuit size={10} /> AI
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative inline-block w-9 align-middle select-none transition duration-200 ease-in">
                                                <input 
                                                type="checkbox" 
                                                checked={item.enabled}
                                                onChange={() => onToggleConstraint(category.id, item.id)}
                                                className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-5 transition-all duration-200"
                                                style={{ top: '2px', borderColor: item.enabled ? '#4f46e5' : '#cbd5e1' }}
                                                />
                                                <div className={`block overflow-hidden h-5 rounded-full cursor-pointer transition-colors duration-200 ${item.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed pl-9">
                                            {item.description}
                                        </p>
                                        {/* Mini Ontology Visualization */}
                                        {item.logic && (
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 border border-slate-100 rounded px-2 py-1 w-fit mt-3 ml-9">
                                                <span className="font-mono text-indigo-600 font-bold">{item.logic.relationType}</span>
                                                <ArrowDown size={10} className="-rotate-90 text-slate-300"/>
                                                <span>{item.logic.attribute || 'Event'}</span>
                                            </div>
                                        )}
                                    </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                      </>
                  ) : (
                      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-6 space-y-6 animate-in fade-in zoom-in-95">
                          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                              <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                                  {editMode === 'create' ? <Plus size={16}/> : <Edit2 size={16}/>}
                                  {editMode === 'create' ? '新建规则对象' : '编辑规则配置'}
                              </h3>
                              <button onClick={() => setIsEditingConstraint(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded transition-colors">
                                  <X size={18} />
                              </button>
                          </div>

                          {/* AI Helper */}
                          {editMode === 'create' && (
                              <div className="bg-gradient-to-r from-indigo-50 to-white p-4 rounded-xl border border-indigo-100 space-y-3">
                                   <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 mb-1">
                                       <Sparkles size={14}/> AI 辅助生成
                                   </div>
                                   <textarea 
                                    className="w-full h-20 p-3 bg-white border border-indigo-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none resize-none shadow-sm placeholder:text-slate-400"
                                    placeholder="输入自然语言描述 (例如: '如果库存低于2000，则触发紧急采购报警')"
                                    value={newConstraintText}
                                    onChange={(e) => setNewConstraintText(e.target.value)}
                                 />
                                 <button 
                                    onClick={handleAnalyzeClick}
                                    disabled={analyzingConstraint || !newConstraintText.trim()}
                                    className="w-full bg-white border border-indigo-200 text-indigo-600 py-2 rounded-lg text-xs font-bold hover:bg-indigo-50 flex items-center justify-center gap-2 transition-colors"
                                 >
                                    {analyzingConstraint ? <span className="animate-spin">⌛</span> : 'AI 填充表单'}
                                 </button>
                              </div>
                          )}
                          
                          {/* === Ontology/Workflow Builder === */}
                          <div className="space-y-0 relative pl-4 border-l-2 border-slate-200 ml-2">
                              {/* Step 1: Trigger/Source */}
                              <div className="relative z-10 bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-sm">
                                    <div className="absolute -left-[25px] top-4 w-4 h-4 rounded-full bg-slate-200 border-2 border-white"></div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                        <GitCommit size={14} className="text-blue-500"/> 触发对象 (Subject)
                                    </div>
                                    <select 
                                        className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        value={currentConstraint.logic?.sourceNodeId || ''}
                                        onChange={(e) => updateLogic('sourceNodeId', e.target.value)}
                                    >
                                        <option value="">(任意节点 / 全局)</option>
                                        {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <select 
                                            className="flex-1 text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50"
                                            value={currentConstraint.logic?.attribute || ''}
                                            onChange={(e) => updateLogic('attribute', e.target.value)}
                                        >
                                            <option value="">选择属性...</option>
                                            <option value="inventoryLevel">库存水平</option>
                                            <option value="capacityUtilization">产能利用率</option>
                                            <option value="onTimeRate">交付及时率</option>
                                            <option value="activeAlerts">报警数量</option>
                                        </select>
                                        <select 
                                            className="w-20 text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-center font-mono font-bold"
                                            value={currentConstraint.logic?.operator || '>'}
                                            onChange={(e) => updateLogic('operator', e.target.value)}
                                        >
                                            <option value=">">&gt;</option>
                                            <option value="<">&lt;</option>
                                            <option value="=">=</option>
                                            <option value="CHANGE">Δ</option>
                                        </select>
                                        <input 
                                            type="text"
                                            className="w-24 text-sm border border-slate-300 rounded-lg p-2.5 text-center font-mono"
                                            placeholder="Value"
                                            value={currentConstraint.logic?.value || ''}
                                            onChange={(e) => updateLogic('value', e.target.value)}
                                        />
                                    </div>
                              </div>

                              {/* Step 2: Relation Logic */}
                              <div className="relative z-10 bg-indigo-50/50 border-2 border-indigo-100 rounded-lg p-4 space-y-3 my-4">
                                    <div className="absolute -left-[25px] top-4 w-4 h-4 rounded-full bg-indigo-200 border-2 border-white"></div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase">
                                        <LinkIcon size={14}/> 逻辑关系 (Predicate)
                                    </div>
                                    <div className="flex gap-2">
                                        {(['IMPACT', 'TRIGGER', 'QUERY'] as ConstraintRelationType[]).map(t => (
                                            <button
                                                key={t}
                                                onClick={() => updateLogic('relationType', t)}
                                                className={`flex-1 text-xs py-2 rounded-lg font-bold transition-all ${currentConstraint.logic?.relationType === t ? 'bg-indigo-600 text-white shadow-md transform scale-105' : 'bg-white text-slate-500 border border-indigo-100 hover:border-indigo-300'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                              </div>

                              {/* Step 3: Target/Effect */}
                              <div className="relative z-10 bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-sm">
                                    <div className="absolute -left-[25px] top-4 w-4 h-4 rounded-full bg-slate-200 border-2 border-white"></div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                        <DbIcon size={14} className="text-emerald-500"/> 影响对象/动作 (Object)
                                    </div>
                                     <select 
                                        className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        value={currentConstraint.logic?.targetNodeId || ''}
                                        onChange={(e) => updateLogic('targetNodeId', e.target.value)}
                                    >
                                        <option value="">(关联下游 / 自身)</option>
                                        <optgroup label="物料关联 - 上游企业">
                                            {nodes.filter(n => n.type === NodeType.SUPPLIER).map(n => (
                                                <option key={n.id} value={n.id}>{n.name}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="工艺型号关联 - 基地产线">
                                            {nodes.filter(n => n.type === NodeType.BASE).map(n => (
                                                <option key={n.id} value={n.id}>{n.name}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="电池型号关联 - 下游客户">
                                            {nodes.filter(n => n.type === NodeType.CUSTOMER).map(n => (
                                                <option key={n.id} value={n.id}>{n.name}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                    <input 
                                        type="text" 
                                        placeholder="执行动作描述 (e.g. 'Lock Orders')"
                                        className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50"
                                        value={currentConstraint.logic?.actionDescription || ''}
                                        onChange={(e) => updateLogic('actionDescription', e.target.value)}
                                    />
                              </div>
                          </div>

                          {/* General Info */}
                          <div className="pt-4 border-t border-slate-100 space-y-4">
                              <div className="grid grid-cols-1 gap-4">
                                  <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase">规则名称</label>
                                        <input 
                                        type="text" 
                                        value={currentConstraint.label} 
                                        onChange={(e) => setCurrentConstraint({...currentConstraint, label: e.target.value})}
                                        className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                                        placeholder="请输入简短的规则名称"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase">业务含义</label>
                                        <textarea 
                                        value={currentConstraint.description} 
                                        onChange={(e) => setCurrentConstraint({...currentConstraint, description: e.target.value})}
                                        className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-lg h-20 resize-none focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                                        placeholder="详细描述该规则的业务背景和影响..."
                                        />
                                    </div>
                              </div>
                          </div>

                          <button 
                            onClick={handleSaveConstraint}
                            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                          >
                            <Save size={18} />
                            {editMode === 'create' ? '保存并启用规则' : '保存修改'}
                          </button>
                      </div>
                  )}
              </div>
           </div>
        ) : (
          // SCENARIOS VIEW: Split Layout (Builder Left / Queue Right)
          <div className="flex h-full">
             
             {/* Left: Builder Panel */}
             <div className="flex-1 overflow-y-auto p-8 border-r border-slate-100 custom-scrollbar">
                 <div className="max-w-3xl mx-auto space-y-8">
                     
                     {/* Header Intro */}
                     <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                        <div className="p-2 bg-white rounded-lg text-blue-600 h-fit shadow-sm"><Activity size={20}/></div>
                        <div className="text-sm text-blue-800 leading-relaxed">
                            <span className="font-bold block mb-1">多场景联合推演 (Scenario Builder)</span>
                            请按顺序配置事件类型、对象及参数。系统将分析多个并发事件对供应链网络的叠加冲击效应。
                        </div>
                     </div>

                     {/* Step 1: Type Selection Grid */}
                     <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. 选择事件类型</label>
                        <div className="grid grid-cols-2 gap-4">
                            {SCENARIO_TYPES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedType(t.id)}
                                    className={`relative flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all group ${
                                        selectedType === t.id 
                                        ? `border-indigo-600 bg-indigo-50/50 shadow-sm` 
                                        : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
                                    }`}
                                >
                                    <div className={`p-3 rounded-lg ${t.color} ${selectedType === t.id ? 'shadow-md' : ''}`}>
                                        <t.icon size={20}/>
                                    </div>
                                    <div>
                                        <div className={`font-bold text-sm ${selectedType === t.id ? 'text-indigo-900' : 'text-slate-700'}`}>{t.label}</div>
                                        {selectedType === t.id && <div className="text-xs text-indigo-600/70 mt-0.5 font-medium">已选择</div>}
                                    </div>
                                    {selectedType === t.id && (
                                        <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 translate-x-full">
                                            <ArrowDown size={20} className="-rotate-90 text-indigo-300"/>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                     </div>

                     {/* Step 2: Node Selection */}
                     <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. 选择影响对象</label>
                        <div className="relative group">
                            <select 
                                value={selectedNodeId}
                                onChange={(e) => setSelectedNodeId(e.target.value)}
                                className="w-full appearance-none bg-white border-2 border-slate-200 text-slate-700 text-base font-medium rounded-xl pl-4 pr-10 py-4 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer hover:border-slate-300"
                            >
                                <option value="" disabled>-- 请从网络图中选择节点 --</option>
                                {targetNodes.map(n => (
                                    <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
                                ))}
                            </select>
                            <Search className="absolute right-4 top-4.5 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" size={20} />
                        </div>
                     </div>

                     {/* Step 3: Parameters */}
                     {selectedNode && (
                         <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">3. 设定关键参数</label>
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 grid grid-cols-2 gap-5">
                                {selectedType === 'SUPPLY_DELAY' && (
                                    <>
                                        <div><label className="text-xs font-bold text-slate-500 block mb-1.5">延期天数 (Days)</label><input type="number" value={formParams.delayDays || 0} onChange={(e) => setFormParams({...formParams, delayDays: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"/></div>
                                        <div><label className="text-xs font-bold text-slate-500 block mb-1.5">影响货量 (Tons)</label><input type="number" disabled value={formParams.supplyVolume || 0} className="w-full border border-slate-200 bg-slate-100 rounded-lg p-2.5 text-sm text-slate-500"/></div>
                                    </>
                                )}
                                {selectedType === 'DEMAND_CHANGE' && (
                                    <>
                                        <div><label className="text-xs font-bold text-slate-500 block mb-1.5">需求波动 (%)</label><input type="number" value={formParams.demandChange || 0} onChange={(e) => setFormParams({...formParams, demandChange: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"/></div>
                                        <div><label className="text-xs font-bold text-slate-500 block mb-1.5">生效批次</label><input type="text" value={formParams.deliveryDate || ''} disabled className="w-full border border-slate-200 bg-slate-100 rounded-lg p-2.5 text-sm text-slate-500"/></div>
                                    </>
                                )}
                                {selectedType === 'PRODUCTION_ISSUE' && (
                                    <>
                                        <div><label className="text-xs font-bold text-slate-500 block mb-1.5">停机天数</label><input type="number" value={formParams.downtimeDays || 0} onChange={(e) => setFormParams({...formParams, downtimeDays: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"/></div>
                                        <div><label className="text-xs font-bold text-slate-500 block mb-1.5">效率损失 (%)</label><input type="number" value={formParams.efficiencyLoss || 0} onChange={(e) => setFormParams({...formParams, efficiencyLoss: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"/></div>
                                    </>
                                )}
                                {selectedType === 'INVENTORY_ISSUE' && (
                                     <>
                                        <div><label className="text-xs font-bold text-slate-500 block mb-1.5">当前模拟库存</label><input type="number" value={formParams.currentLevel || 0} onChange={(e) => setFormParams({...formParams, currentLevel: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"/></div>
                                        <div><label className="text-xs font-bold text-slate-500 block mb-1.5">触发阈值</label><input type="number" disabled value={formParams.threshold || 0} className="w-full border border-slate-200 bg-slate-100 rounded-lg p-2.5 text-sm text-slate-500"/></div>
                                     </>
                                )}
                            </div>

                            <button 
                                onClick={handleAddScenario}
                                className="w-full bg-slate-800 text-white hover:bg-slate-900 py-3.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Plus size={18} /> 添加到推演队列
                            </button>
                         </div>
                     )}
                 </div>
             </div>

             {/* Right: Queue Panel (Fixed Width) */}
             <div className="w-96 bg-slate-50 p-6 flex flex-col border-l border-slate-200 shrink-0 h-full">
                 <div className="flex items-center gap-2 mb-6 text-slate-800">
                    <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm"><List size={18}/></div>
                    <h3 className="font-bold text-sm">推演事件队列</h3>
                    <span className="ml-auto bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">{pendingScenarios.length}</span>
                 </div>
                 
                 {/* Queue List */}
                 <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {pendingScenarios.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                            <Activity size={32} className="mb-2 opacity-50"/>
                            <p className="text-sm font-medium">队列为空</p>
                            <p className="text-xs mt-1">请在左侧配置并添加事件</p>
                        </div>
                    ) : (
                        pendingScenarios.map((sc, idx) => (
                            <div key={sc.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all relative group animate-in slide-in-from-right-2 fade-in fill-mode-backwards" style={{animationDelay: `${idx * 50}ms`}}>
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{sc.type}</span>
                                    <button onClick={() => removeScenario(sc.id!)} className="text-slate-300 hover:text-red-500 transition-colors p-1 -mr-2 -mt-2">
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className="font-bold text-slate-700 text-sm mb-1">{sc.targetNodeName}</div>
                                <div className="text-xs text-slate-500 leading-snug">{sc.description}</div>
                            </div>
                        ))
                    )}
                 </div>

                 {/* Bottom Action */}
                 <div className="pt-6 border-t border-slate-200 mt-auto">
                    <button 
                        onClick={handleRunJointSimulation}
                        disabled={pendingScenarios.length === 0 || isSimulating}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        {isSimulating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                正在推演计算...
                            </>
                        ) : (
                            <>
                                <Zap size={18} fill="currentColor" />
                                执行联合推演
                            </>
                        )}
                    </button>
                 </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConstraintPanel;
