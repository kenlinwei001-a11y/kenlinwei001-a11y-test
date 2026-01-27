import React, { useState, useEffect } from 'react';
import { ConstraintCategory, ConstraintItem, NodeData, NodeType, ScenarioConfig } from '../types';
import { Settings, Sliders, Activity, Zap, Search, Plus, Save, X, Sparkles, Trash2, List } from 'lucide-react';

interface Props {
  constraints: ConstraintCategory[];
  nodes: NodeData[]; // Need access to graph nodes to populate dropdowns
  onToggleConstraint: (categoryId: string, itemId: string) => void;
  onRunSimulation: (configs: ScenarioConfig[]) => void;
  onAnalyzeConstraint: (text: string) => Promise<Partial<ConstraintItem>>;
  onAddConstraint: (item: ConstraintItem) => void;
  isSimulating: boolean;
}

const ConstraintPanel: React.FC<Props> = ({ 
    constraints, 
    nodes, 
    onToggleConstraint, 
    onRunSimulation, 
    onAnalyzeConstraint,
    onAddConstraint,
    isSimulating 
}) => {
  const [activeTab, setActiveTab] = useState<'constraints' | 'scenarios'>('scenarios');
  
  // Multi-Scenario State
  const [pendingScenarios, setPendingScenarios] = useState<ScenarioConfig[]>([]);

  // Builder Form State
  const [selectedType, setSelectedType] = useState<string>('SUPPLY_DELAY'); // Scenario Type
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [formParams, setFormParams] = useState<any>({});
  
  // New Constraint Creation State
  const [isCreatingConstraint, setIsCreatingConstraint] = useState(false);
  const [newConstraintText, setNewConstraintText] = useState('');
  const [analyzingConstraint, setAnalyzingConstraint] = useState(false);
  const [parsedConstraint, setParsedConstraint] = useState<Partial<ConstraintItem> | null>(null);

  // Computed properties for the builder
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
    // Reset selection slightly to allow adding another
    setSelectedNodeId('');
  };

  const removeScenario = (id: string) => {
    setPendingScenarios(pendingScenarios.filter(s => s.id !== id));
  };

  const handleRunJointSimulation = () => {
      if (pendingScenarios.length === 0) return;
      onRunSimulation(pendingScenarios);
  };

  const handleAnalyzeClick = async () => {
      if (!newConstraintText.trim()) return;
      setAnalyzingConstraint(true);
      try {
          const result = await onAnalyzeConstraint(newConstraintText);
          setParsedConstraint(result);
      } finally {
          setAnalyzingConstraint(false);
      }
  };

  const handleSaveConstraint = () => {
      if (!parsedConstraint || !parsedConstraint.label) return;
      const newItem: ConstraintItem = {
          id: `custom-${Date.now()}`,
          label: parsedConstraint.label || 'New Rule',
          description: parsedConstraint.description || '',
          enabled: true,
          impactLevel: parsedConstraint.impactLevel as any || 'medium',
          formula: parsedConstraint.formula
      };
      onAddConstraint(newItem);
      setIsCreatingConstraint(false);
      setNewConstraintText('');
      setParsedConstraint(null);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 shadow-sm w-80">
      <div className="flex border-b border-slate-200">
        <button 
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'scenarios' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('scenarios')}
        >
            <Zap size={16} />
            场景模拟
        </button>
        <button 
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'constraints' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('constraints')}
        >
            <Sliders size={16} />
            约束配置
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'constraints' ? (
           <>
              {!isCreatingConstraint ? (
                  <button 
                    onClick={() => setIsCreatingConstraint(true)}
                    className="w-full py-2 border-2 border-dashed border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all flex items-center justify-center gap-2 font-semibold text-sm"
                  >
                    <Plus size={16} />
                    新增约束条件
                  </button>
              ) : (
                  <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex justify-between items-center">
                          <h3 className="text-xs font-bold text-slate-800 uppercase">定义新规则</h3>
                          <button onClick={() => setIsCreatingConstraint(false)} className="text-slate-400 hover:text-slate-600">
                              <X size={16} />
                          </button>
                      </div>
                      
                      {!parsedConstraint ? (
                          <>
                             <textarea 
                                className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                                placeholder="请输入自然语言描述，例如：'如果宁德基地的库存低于2000，则触发紧急补货报警'"
                                value={newConstraintText}
                                onChange={(e) => setNewConstraintText(e.target.value)}
                             />
                             <button 
                                onClick={handleAnalyzeClick}
                                disabled={analyzingConstraint || !newConstraintText.trim()}
                                className="w-full bg-indigo-600 text-white py-2 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                             >
                                {analyzingConstraint ? <span className="animate-spin">⌛</span> : <Sparkles size={14} />}
                                智能解析生成
                             </button>
                          </>
                      ) : (
                          <div className="space-y-3">
                              {/* ... (Existing parsing result UI) ... */}
                              <div>
                                  <label className="text-xs font-semibold text-slate-500 block mb-1">规则名称</label>
                                  <input 
                                    type="text" 
                                    value={parsedConstraint.label} 
                                    onChange={(e) => setParsedConstraint({...parsedConstraint, label: e.target.value})}
                                    className="w-full text-sm p-2 bg-slate-50 border rounded"
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-semibold text-slate-500 block mb-1">公式/逻辑</label>
                                  <div className="font-mono text-xs bg-slate-900 text-green-400 p-2 rounded">
                                      <input 
                                        type="text" 
                                        value={parsedConstraint.formula} 
                                        onChange={(e) => setParsedConstraint({...parsedConstraint, formula: e.target.value})}
                                        className="w-full bg-transparent border-none outline-none font-mono text-green-400 p-0"
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className="text-xs font-semibold text-slate-500 block mb-1">影响等级</label>
                                  <div className="flex gap-2">
                                      {['low', 'medium', 'high'].map(level => (
                                          <button 
                                            key={level}
                                            onClick={() => setParsedConstraint({...parsedConstraint, impactLevel: level as any})}
                                            className={`flex-1 py-1 text-xs uppercase font-bold rounded border ${parsedConstraint.impactLevel === level 
                                                ? (level === 'high' ? 'bg-red-100 text-red-700 border-red-200' : level === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-green-100 text-green-700 border-green-200')
                                                : 'bg-white text-slate-400 border-slate-200'}`}
                                          >
                                              {level}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                              <button 
                                onClick={handleSaveConstraint}
                                className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2 mt-2"
                              >
                                <Save size={14} />
                                确认添加
                              </button>
                          </div>
                      )}
                  </div>
              )}

              {constraints.map((category) => (
                <div key={category.id} className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    {category.name}
                  </h3>
                  <div className="space-y-3">
                    {category.items.map((item) => (
                      <div key={item.id} className="group bg-slate-50 rounded-lg p-3 border border-slate-100 hover:border-slate-300 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <label className="text-sm font-semibold text-slate-700 cursor-pointer select-none" htmlFor={item.id}>
                            {item.label}
                          </label>
                           <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input 
                              type="checkbox" 
                              name={item.id} 
                              id={item.id} 
                              checked={item.enabled}
                              onChange={() => onToggleConstraint(category.id, item.id)}
                              className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-5 transition-all duration-200"
                              style={{ top: '2px', borderColor: item.enabled ? '#3b82f6' : '#cbd5e1' }}
                            />
                            <label 
                              htmlFor={item.id} 
                              className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ${item.enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                            ></label>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {item.description}
                        </p>
                         {item.formula && (
                           <div className="mt-2 pt-2 border-t border-slate-200/50">
                               <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded w-fit">
                                    <Activity size={10} />
                                    {item.formula}
                               </div>
                           </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
           </>
        ) : (
          <div className="space-y-4">
             {/* Pending Scenarios List */}
             {pendingScenarios.length > 0 && (
                <div className="mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                        <List size={12}/> 待推演事件列表 ({pendingScenarios.length})
                    </h3>
                    <div className="space-y-2">
                        {pendingScenarios.map((sc) => (
                            <div key={sc.id} className="bg-white border border-slate-200 rounded p-2 text-xs flex justify-between items-start shadow-sm">
                                <div>
                                    <div className="font-bold text-slate-700">{sc.targetNodeName}</div>
                                    <div className="text-slate-500">{sc.description}</div>
                                </div>
                                <button onClick={() => removeScenario(sc.id!)} className="text-slate-400 hover:text-red-500">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="border-b border-slate-200 my-4"></div>
                </div>
             )}

             <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 leading-relaxed">
                <span className="font-bold flex items-center gap-1 mb-1"><Activity size={12}/> 多场景联合推演</span>
                您可以添加多个事件（如：上游延期 + 下游减产），系统将分析这些事件的叠加效应。
             </div>

             {/* Step 1: Select Event Type */}
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">1. 选择事件类型</label>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setSelectedType('SUPPLY_DELAY')} className={`py-2 px-1 text-xs rounded border ${selectedType === 'SUPPLY_DELAY' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white'}`}>上游供货延期</button>
                    <button onClick={() => setSelectedType('DEMAND_CHANGE')} className={`py-2 px-1 text-xs rounded border ${selectedType === 'DEMAND_CHANGE' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white'}`}>下游需求变更</button>
                    <button onClick={() => setSelectedType('PRODUCTION_ISSUE')} className={`py-2 px-1 text-xs rounded border ${selectedType === 'PRODUCTION_ISSUE' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white'}`}>基地产线故障</button>
                    <button onClick={() => setSelectedType('INVENTORY_ISSUE')} className={`py-2 px-1 text-xs rounded border ${selectedType === 'INVENTORY_ISSUE' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white'}`}>库存水位预警</button>
                </div>
             </div>

             {/* Step 2: Select Node */}
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">2. 选择对象</label>
                <div className="relative">
                    <select 
                        value={selectedNodeId}
                        onChange={(e) => setSelectedNodeId(e.target.value)}
                        className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow cursor-pointer"
                    >
                        <option value="" disabled>-- 请选择 --</option>
                        {targetNodes.map(n => (
                            <option key={n.id} value={n.id}>{n.name}</option>
                        ))}
                    </select>
                    <Search className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                </div>
             </div>

             {/* Step 3: Modify Parameters */}
             {selectedNode && (
                 <div className="space-y-3 bg-slate-50 p-3 rounded border border-slate-200 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                        <Settings size={14} className="text-slate-400" />
                        <label className="text-xs font-bold text-slate-500 uppercase">3. 设定参数</label>
                    </div>

                    {selectedType === 'SUPPLY_DELAY' && (
                        <>
                            <div><label className="text-xs text-slate-600">延期天数</label><input type="number" value={formParams.delayDays || 0} onChange={(e) => setFormParams({...formParams, delayDays: e.target.value})} className="w-full border rounded p-1 text-sm"/></div>
                        </>
                    )}
                    {selectedType === 'DEMAND_CHANGE' && (
                        <>
                            <div><label className="text-xs text-slate-600">需求波动 (%)</label><input type="number" value={formParams.demandChange || 0} onChange={(e) => setFormParams({...formParams, demandChange: e.target.value})} className="w-full border rounded p-1 text-sm"/></div>
                        </>
                    )}
                    {selectedType === 'PRODUCTION_ISSUE' && (
                        <>
                            <div><label className="text-xs text-slate-600">停机天数</label><input type="number" value={formParams.downtimeDays || 0} onChange={(e) => setFormParams({...formParams, downtimeDays: e.target.value})} className="w-full border rounded p-1 text-sm"/></div>
                            <div><label className="text-xs text-slate-600">效率损失 (%)</label><input type="number" value={formParams.efficiencyLoss || 0} onChange={(e) => setFormParams({...formParams, efficiencyLoss: e.target.value})} className="w-full border rounded p-1 text-sm"/></div>
                        </>
                    )}
                    {selectedType === 'INVENTORY_ISSUE' && (
                         <>
                            <div><label className="text-xs text-slate-600">当前库存 (Ah)</label><input type="number" value={formParams.currentLevel || 0} onChange={(e) => setFormParams({...formParams, currentLevel: e.target.value})} className="w-full border rounded p-1 text-sm"/></div>
                         </>
                    )}

                    <button 
                        onClick={handleAddScenario}
                        className="w-full mt-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                        <Plus size={14} /> 添加到推演列表
                    </button>
                 </div>
             )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        {activeTab === 'scenarios' ? (
             <button 
                onClick={handleRunJointSimulation}
                disabled={pendingScenarios.length === 0 || isSimulating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 px-4 rounded shadow transition-all flex items-center justify-center gap-2"
            >
                {isSimulating ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        推演计算中...
                    </>
                ) : (
                    <>
                        <Zap size={16} fill="currentColor" />
                        执行联合推演 ({pendingScenarios.length})
                    </>
                )}
            </button>
        ) : (
            <button className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold py-2.5 px-4 rounded shadow-sm transition-colors flex items-center justify-center gap-2">
                <Save size={16} />
                保存配置更改
            </button>
        )}
      </div>
    </div>
  );
};

export default ConstraintPanel;