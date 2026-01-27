
import React, { useState, useEffect } from 'react';
import { Save, Server, Upload, FileJson, AlertCircle, CheckCircle2, Bot, Database } from 'lucide-react';
import { LLMConfig, GraphData, NodeData } from '../types';

interface Props {
  currentConfig: LLMConfig;
  onConfigSave: (config: LLMConfig) => void;
  onDataImport: (type: 'graph' | 'inventory' | 'orders' | 'production', data: any) => void;
}

const SettingsPanel: React.FC<Props> = ({ currentConfig, onConfigSave, onDataImport }) => {
  const [activeTab, setActiveTab] = useState<'model' | 'data'>('model');
  
  // Model Config State
  const [config, setConfig] = useState<LLMConfig>(currentConfig);
  const [showSaved, setShowSaved] = useState(false);

  // Data Import State
  const [importStatus, setImportStatus] = useState<{[key: string]: string}>({});

  useEffect(() => {
    setConfig(currentConfig);
  }, [currentConfig]);

  const handleSave = () => {
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
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 bg-white sticky top-0 z-10">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Server className="text-slate-600" size={20}/>
          系统设置中心
        </h2>
        <p className="text-xs text-slate-500 mt-1">System Configuration & Data Management</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white">
        <button 
          onClick={() => setActiveTab('model')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'model' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Bot size={16}/> 模型配置 (LLM)
        </button>
        <button 
          onClick={() => setActiveTab('data')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'data' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Database size={16}/> 数据导入
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* === MODEL CONFIG TAB === */}
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
                onClick={handleSave}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                {showSaved ? <CheckCircle2 size={16}/> : <Save size={16}/>}
                {showSaved ? '配置已保存' : '保存配置'}
              </button>
            </div>
          </div>
        )}

        {/* === DATA IMPORT TAB === */}
        {activeTab === 'data' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
             <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-800 flex items-start gap-2">
               <AlertCircle size={16} className="shrink-0 mt-0.5"/>
               <p>请上传标准 JSON 格式数据。导入操作将直接覆盖当前的演示数据，请谨慎操作。</p>
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
