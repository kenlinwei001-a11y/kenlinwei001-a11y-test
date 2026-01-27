
import React, { useState, useEffect } from 'react';
import { Save, Server, Upload, FileJson, AlertCircle, CheckCircle2, Bot, Database, Plug, RefreshCw, Table, ArrowRightLeft, Check, X, Globe, Lock, Play, Layers, Activity, Link as LinkIcon } from 'lucide-react';
import { LLMConfig, DataSourceConfig, DataPipelineConfig, DataSourceType } from '../types';

interface Props {
  currentConfig: LLMConfig;
  onConfigSave: (config: LLMConfig) => void;
  onDataImport: (type: 'graph' | 'inventory' | 'orders' | 'production', data: any) => void;
}

// Initial Mock Connectors
const INITIAL_CONNECTORS: DataSourceConfig[] = [
    { id: 'conn-1', name: 'SAP S/4HANA (Global)', type: 'SAP', endpoint: 'https://api.sap.corp/erp/v1', authType: 'OAUTH2', status: 'connected', lastSync: '10 mins ago' },
    { id: 'conn-2', name: 'Siemens Opcenter (Jintan)', type: 'MES', endpoint: 'wss://mes-cn-jintan.factory.local', authType: 'API_KEY', status: 'connected', lastSync: 'Live' },
    { id: 'conn-3', name: 'Salesforce CRM', type: 'CRM', endpoint: 'https://na1.salesforce.com', authType: 'OAUTH2', status: 'error', lastSync: '2 days ago' },
];

// Initial Mock Pipelines
const INITIAL_PIPELINES: DataPipelineConfig[] = [
    { id: 'pipe-1', name: '每日库存快照同步', sourceId: 'conn-1', targetEntity: 'Inventory', syncFrequency: 'daily', aggregationLogic: 'SELECT SUM(qty) GROUP BY plant_id', active: true },
    { id: 'pipe-2', name: '产线 OEE 实时流', sourceId: 'conn-2', targetEntity: 'Production', syncFrequency: 'realtime', aggregationLogic: 'STREAM WHERE machine_state CHANGE', active: true },
];

const SettingsPanel: React.FC<Props> = ({ currentConfig, onConfigSave, onDataImport }) => {
  const [activeTab, setActiveTab] = useState<'model' | 'connectors' | 'logic' | 'manual'>('connectors');
  
  // Model Config State
  const [config, setConfig] = useState<LLMConfig>(currentConfig);
  const [showSaved, setShowSaved] = useState(false);

  // Integration State
  const [connectors, setConnectors] = useState<DataSourceConfig[]>(INITIAL_CONNECTORS);
  const [pipelines, setPipelines] = useState<DataPipelineConfig[]>(INITIAL_PIPELINES);
  const [isSyncing, setIsSyncing] = useState<string | null>(null); // Pipeline ID currently syncing

  // Data Import State
  const [importStatus, setImportStatus] = useState<{[key: string]: string}>({});
  
  // New Connector Form State
  const [showAddConnector, setShowAddConnector] = useState(false);
  const [newConnector, setNewConnector] = useState<Partial<DataSourceConfig>>({ type: 'SAP', authType: 'API_KEY' });

  useEffect(() => {
    setConfig(currentConfig);
  }, [currentConfig]);

  const handleSaveConfig = () => {
    onConfigSave(config);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleFileUpload = (type: 'graph' | 'inventory' | 'orders' | 'production', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onDataImport(type, json);
        setImportStatus(prev => ({...prev, [type]: `成功导入: ${file.name}`}));
      } catch (err) {
        setImportStatus(prev => ({...prev, [type]: '导入失败: 格式错误'}));
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTestConnection = (id: string) => {
      // Mock testing connection
      const updated = connectors.map(c => {
          if (c.id === id) return { ...c, status: 'connected' as const };
          return c;
      });
      setConnectors(updated);
  };

  const handleRunPipeline = (id: string) => {
      setIsSyncing(id);
      setTimeout(() => {
          setIsSyncing(null);
      }, 2000);
  };

  const handleAddConnector = () => {
      if(!newConnector.name || !newConnector.endpoint) return;
      setConnectors([...connectors, {
          id: `conn-${Date.now()}`,
          name: newConnector.name,
          type: newConnector.type as DataSourceType,
          endpoint: newConnector.endpoint,
          authType: newConnector.authType as any,
          status: 'disconnected',
          lastSync: 'Never'
      }]);
      setShowAddConnector(false);
      setNewConnector({ type: 'SAP', authType: 'API_KEY' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 bg-white sticky top-0 z-10">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Server className="text-slate-600" size={20}/>
          集成与配置中心
        </h2>
        <p className="text-xs text-slate-500 mt-1">Enterprise Integration & System Settings</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white overflow-x-auto">
        <button 
          onClick={() => setActiveTab('connectors')}
          className={`flex-1 min-w-[100px] py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'connectors' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Plug size={14}/> 数据连接器
        </button>
        <button 
          onClick={() => setActiveTab('logic')}
          className={`flex-1 min-w-[100px] py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'logic' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <ArrowRightLeft size={14}/> 数据逻辑编排
        </button>
        <button 
          onClick={() => setActiveTab('model')}
          className={`flex-1 min-w-[100px] py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'model' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Bot size={14}/> 大模型配置
        </button>
        <button 
          onClick={() => setActiveTab('manual')}
          className={`flex-1 min-w-[100px] py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'manual' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Upload size={14}/> 手动导入
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* === TAB 1: CONNECTORS === */}
        {activeTab === 'connectors' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Globe size={16}/> 外部系统连接 (External Systems)
                    </h3>
                    <button 
                        onClick={() => setShowAddConnector(!showAddConnector)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                        {showAddConnector ? <X size={14}/> : <Plug size={14}/>}
                        {showAddConnector ? '取消' : '新建连接'}
                    </button>
                </div>

                {/* Add Connector Form */}
                {showAddConnector && (
                    <div className="bg-white border border-indigo-100 p-4 rounded-xl shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">系统名称</label>
                                <input 
                                    type="text" 
                                    className="w-full text-xs border rounded p-2" 
                                    placeholder="e.g., SAP ERP Global"
                                    value={newConnector.name || ''}
                                    onChange={(e) => setNewConnector({...newConnector, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">系统类型</label>
                                <select 
                                    className="w-full text-xs border rounded p-2 bg-white"
                                    value={newConnector.type}
                                    onChange={(e) => setNewConnector({...newConnector, type: e.target.value as any})}
                                >
                                    <option value="SAP">SAP S/4HANA (ERP)</option>
                                    <option value="MES">Manufacturing Execution (MES)</option>
                                    <option value="CRM">CRM / Salesforce</option>
                                    <option value="WMS">Warehouse Mgmt (WMS)</option>
                                    <option value="IOT">Industrial IoT Hub</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">API Endpoint / Connection String</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    className="flex-1 text-xs border rounded p-2 font-mono text-slate-600" 
                                    placeholder="https://api.gateway.corp..."
                                    value={newConnector.endpoint || ''}
                                    onChange={(e) => setNewConnector({...newConnector, endpoint: e.target.value})}
                                />
                                <select 
                                    className="w-24 text-xs border rounded p-2 bg-white"
                                    value={newConnector.authType}
                                    onChange={(e) => setNewConnector({...newConnector, authType: e.target.value as any})}
                                >
                                    <option value="API_KEY">API Key</option>
                                    <option value="OAUTH2">OAuth 2.0</option>
                                    <option value="BASIC">Basic</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-2 flex justify-end">
                             <button 
                                onClick={handleAddConnector}
                                className="bg-slate-800 text-white px-4 py-2 rounded text-xs font-bold"
                             >
                                 保存并连接
                             </button>
                        </div>
                    </div>
                )}

                {/* Connector List */}
                <div className="grid gap-3">
                    {connectors.map(conn => (
                        <div key={conn.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm
                                    ${conn.type === 'SAP' ? 'bg-[#00305e]' : 
                                      conn.type === 'MES' ? 'bg-orange-600' : 
                                      conn.type === 'CRM' ? 'bg-blue-500' : 'bg-slate-600'}
                                `}>
                                    {conn.type}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-700 text-sm">{conn.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                        <Lock size={10}/> {conn.authType} • {conn.endpoint}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className={`text-xs font-bold ${conn.status === 'connected' ? 'text-emerald-600' : conn.status === 'error' ? 'text-red-600' : 'text-slate-400'}`}>
                                        {conn.status === 'connected' ? '● Connected' : conn.status === 'error' ? '● Error' : '○ Disconnected'}
                                    </div>
                                    <div className="text-[10px] text-slate-400">Last Sync: {conn.lastSync}</div>
                                </div>
                                <button 
                                    onClick={() => handleTestConnection(conn.id)}
                                    className="p-2 border border-slate-200 rounded hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition-colors"
                                    title="Test Connection"
                                >
                                    <RefreshCw size={14}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* === TAB 2: DATA LOGIC / PIPELINES === */}
        {activeTab === 'logic' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                 <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-xs text-indigo-800 flex items-start gap-2">
                   <Layers size={16} className="shrink-0 mt-0.5"/>
                   <p>在此定义数据聚合逻辑 (ETL)。将原始系统数据映射到数字孪生图谱节点属性，支持 SQL-like 聚合或 JS 表达式。</p>
                 </div>

                 <div className="space-y-2">
                     <h3 className="text-sm font-bold text-slate-700">数据同步任务编排 (Active Pipelines)</h3>
                     <div className="grid gap-3">
                        {pipelines.map(pipe => {
                            const sourceName = connectors.find(c => c.id === pipe.sourceId)?.name || 'Unknown Source';
                            return (
                                <div key={pipe.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                {pipe.name}
                                                {pipe.active ? <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded-full">Active</span> : <span className="bg-slate-100 text-slate-500 text-[9px] px-1.5 py-0.5 rounded-full">Paused</span>}
                                            </h4>
                                            <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                                                From: <span className="font-semibold text-indigo-600">{sourceName}</span>
                                                <ArrowRightLeft size={10} />
                                                To: <span className="font-semibold text-emerald-600">{pipe.targetEntity} Model</span>
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => handleRunPipeline(pipe.id)}
                                            disabled={!!isSyncing}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-white rounded text-xs font-bold hover:bg-slate-700 disabled:opacity-50"
                                        >
                                            {isSyncing === pipe.id ? (
                                                <RefreshCw size={12} className="animate-spin"/>
                                            ) : (
                                                <Play size={12}/>
                                            )}
                                            {isSyncing === pipe.id ? 'Syncing...' : 'Run Now'}
                                        </button>
                                    </div>
                                    
                                    {/* Logic Visualizer */}
                                    <div className="bg-slate-50 p-2 rounded border border-slate-200 font-mono text-[10px] text-slate-600 flex items-center gap-2">
                                        <Activity size={12} className="text-blue-500"/>
                                        <span className="text-purple-600 font-bold">LOGIC:</span>
                                        {pipe.aggregationLogic}
                                    </div>
                                    <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400">
                                        <div className="flex gap-4">
                                            <span>Frequency: <span className="font-semibold text-slate-600">{pipe.syncFrequency}</span></span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                     </div>
                 </div>
                 
                 <button className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 text-xs font-bold hover:bg-slate-50 hover:border-slate-400 transition-colors flex items-center justify-center gap-2">
                     <Plug size={14}/> 添加新的数据映射规则
                 </button>
            </div>
        )}

        {/* === TAB 3: LLM MODEL CONFIG === */}
        {activeTab === 'model' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">选择模型厂商</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setConfig({...config, provider: 'gemini', modelName: 'gemini-2.5-flash-latest'})}
                    className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${config.provider === 'gemini' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">G</div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">Google Gemini</div>
                      <div className="text-[10px] text-slate-500">推荐: 2.5 Flash</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => setConfig({...config, provider: 'kimi', modelName: 'moonshot-v1-8k'})}
                    className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${config.provider === 'kimi' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="w-8 h-8 rounded bg-black flex items-center justify-center text-white font-bold text-xs">K</div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">Kimi (Moonshot)</div>
                      <div className="text-[10px] text-slate-500">OpenAI 兼容接口</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">API Key</label>
                <input 
                  type="password" 
                  value={config.apiKey}
                  onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                  placeholder={config.provider === 'gemini' ? "Enter Gemini API Key..." : "sk-..."}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {config.provider === 'gemini' ? 'Key 将用于调用 Google GenAI SDK' : 'Key 将作为 Bearer Token 发送至接口'}
                </p>
              </div>

              {config.provider === 'kimi' && (
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">Base URL (API 地址)</label>
                   <input 
                    type="text" 
                    value={config.baseUrl || 'https://api.moonshot.cn/v1'}
                    onChange={(e) => setConfig({...config, baseUrl: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-xs"
                  />
                </div>
              )}
              
               <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">Model Name</label>
                   <input 
                    type="text" 
                    value={config.modelName || ''}
                    onChange={(e) => setConfig({...config, modelName: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-xs"
                  />
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button 
                onClick={handleSaveConfig}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                {showSaved ? <CheckCircle2 size={16}/> : <Save size={16}/>}
                {showSaved ? '配置已保存' : '保存配置'}
              </button>
            </div>
          </div>
        )}

        {/* === TAB 4: MANUAL IMPORT (Legacy) === */}
        {activeTab === 'manual' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
             <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-800 flex items-start gap-2">
               <AlertCircle size={16} className="shrink-0 mt-0.5"/>
               <p>手动导入模式适用于离线数据更新或系统初始化。请确保上传符合 Standard JSON Schema 的文件。</p>
             </div>

             <div className="grid grid-cols-1 gap-4">
               {/* 1. Global Topology */}
               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded">
                        <Database size={18}/>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">供应链拓扑网络</h3>
                        <p className="text-[10px] text-slate-500">Nodes, Links (Graph Structure)</p>
                      </div>
                    </div>
                    {importStatus['graph'] && <span className="text-[10px] text-emerald-600 font-bold">{importStatus['graph']}</span>}
                  </div>
                  <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col items-center pt-5 pb-6">
                          <Upload className="w-6 h-6 text-slate-400 mb-2"/>
                          <p className="text-xs text-slate-500"><span className="font-semibold">点击上传</span> JSON 文件</p>
                      </div>
                      <input type="file" className="hidden" accept=".json" onChange={(e) => handleFileUpload('graph', e)}/>
                  </label>
               </div>

               {/* 2. Inventory Data */}
               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 text-purple-600 rounded">
                        <FileJson size={18}/>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">库存明细数据</h3>
                        <p className="text-[10px] text-slate-500">Warehouse levels per Base</p>
                      </div>
                    </div>
                    {importStatus['inventory'] && <span className="text-[10px] text-emerald-600 font-bold">{importStatus['inventory']}</span>}
                  </div>
                  <label className="flex items-center justify-center w-full h-16 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4 text-slate-400"/>
                          <span className="text-xs text-slate-500">导入库存 JSON</span>
                      </div>
                      <input type="file" className="hidden" accept=".json" onChange={(e) => handleFileUpload('inventory', e)}/>
                  </label>
               </div>

               {/* 3. Orders */}
               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded">
                        <FileJson size={18}/>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">销售订单与预测</h3>
                        <p className="text-[10px] text-slate-500">Orders, Forecast Data</p>
                      </div>
                    </div>
                    {importStatus['orders'] && <span className="text-[10px] text-emerald-600 font-bold">{importStatus['orders']}</span>}
                  </div>
                  <label className="flex items-center justify-center w-full h-16 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4 text-slate-400"/>
                          <span className="text-xs text-slate-500">导入订单 JSON</span>
                      </div>
                      <input type="file" className="hidden" accept=".json" onChange={(e) => handleFileUpload('orders', e)}/>
                  </label>
               </div>

                {/* 4. Production */}
               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-100 text-amber-600 rounded">
                        <FileJson size={18}/>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">产线状态数据</h3>
                        <p className="text-[10px] text-slate-500">MES Production Lines</p>
                      </div>
                    </div>
                    {importStatus['production'] && <span className="text-[10px] text-emerald-600 font-bold">{importStatus['production']}</span>}
                  </div>
                  <label className="flex items-center justify-center w-full h-16 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4 text-slate-400"/>
                          <span className="text-xs text-slate-500">导入产线 JSON</span>
                      </div>
                      <input type="file" className="hidden" accept=".json" onChange={(e) => handleFileUpload('production', e)}/>
                  </label>
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
