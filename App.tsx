import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Database, Activity, Share2, Menu } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import SupplyChainGraph from './components/SupplyChainGraph';
import ConstraintPanel from './components/ConstraintPanel';
import AIChat from './components/AIChat';
import Tooltip from './components/Tooltip';
import { MOCK_DATA, INITIAL_CONSTRAINTS } from './constants';
import { GraphData, NodeData, ConstraintCategory, ScenarioConfig, ChatMessage, NodeType, ConstraintItem } from './types';

function App() {
  const [constraints, setConstraints] = useState<ConstraintCategory[]>(INITIAL_CONSTRAINTS);
  const [graphData, setGraphData] = useState<GraphData>(MOCK_DATA);
  const [hoveredNode, setHoveredNode] = useState<{ node: NodeData | null; x: number; y: number }>({ node: null, x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: window.innerWidth - 680, height: window.innerHeight - 60 });
  
  // Chat State moved to App to allow injection of Simulation Reports
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: '我是您的供应链智能助手。请在左侧“场景模拟”面板添加多个事件（如：某基地产线故障 + 某客户需求激增），然后点击执行联合推演。我将为您生成综合应对方案、数据比对及完整的推理链条。',
      timestamp: new Date()
    }
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Responsive resize handler
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth - 680,
        height: window.innerHeight - 64
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Standard Chat Interaction
  const handleUserMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsAiThinking(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const systemPrompt = `
      你是一个供应链专家助手。
      当前上下文：用户正在浏览锂电产销推演界面。
      历史对话主要围绕方案比对。
      
      请简短、专业地回答用户的问题。如果用户询问某个方案的细节，请基于之前的推演结果（如果有）进行逻辑扩展。
      不要提及Palantir。
      `;

      // We should ideally pass conversation history, but for simplicity we pass the last user prompt + system context
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-latest',
        contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n用户: " + text }] }],
      });

      const reply = response.text || "我暂时无法理解，请重试。";
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: reply, timestamp: new Date() }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: "服务繁忙，请稍后。", timestamp: new Date() }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleAnalyzeConstraint = async (text: string): Promise<Partial<ConstraintItem>> => {
    // Only used for constraint parsing, minimal visual blocking
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const prompt = `
        You are a supply chain expert system.
        Convert the following natural language constraint into a structured configuration.
        Return ONLY a raw JSON object (no markdown formatting).
        
        Input: "${text}"
        
        Output Schema:
        {
          "label": "Short Title (max 10 chars, Chinese)",
          "description": "Formal business rule description (Chinese)",
          "impactLevel": "low" | "medium" | "high",
          "formula": "Pseudo-code logic (e.g. IF inventory < 500 THEN alert)"
        }
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-latest',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const textRes = response.text || "{}";
        // Clean markdown if present
        const jsonStr = textRes.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Parse failed", e);
        return {
            label: "解析失败",
            description: text,
            impactLevel: 'medium',
            formula: "N/A"
        };
    }
  };

  const handleAddConstraint = (item: ConstraintItem) => {
    setConstraints(prev => {
        // Check if item already exists (Update mode)
        let found = false;
        const updatedConstraints = prev.map(cat => ({
            ...cat,
            items: cat.items.map(existingItem => {
                if (existingItem.id === item.id) {
                    found = true;
                    return item; // Replace with updated item
                }
                return existingItem;
            })
        }));

        if (found) {
            return updatedConstraints;
        }

        // Else add as new
        const customCatId = 'custom_rules';
        const exists = prev.find(c => c.id === customCatId);
        
        if (exists) {
            return prev.map(c => c.id === customCatId ? { ...c, items: [...c.items, item] } : c);
        } else {
            return [...prev, { id: customCatId, name: '自定义业务规则', items: [item] }];
        }
    });
  };

  // Run Simulation Logic - UPDATED for Multi-Scenario
  const handleRunSimulation = async (configs: ScenarioConfig[]) => {
    setIsAiThinking(true);
    
    // Deep copy current graph data to apply simulation changes
    const newGraph: GraphData = JSON.parse(JSON.stringify(MOCK_DATA));

    // Iterate through all configs and apply visual impacts cumulatively
    configs.forEach(config => {
        const targetNode = newGraph.nodes.find(n => n.id === config.targetNodeId);
        
        if (targetNode) {
          // Mark the root cause node
          targetNode.status = 'critical';
          targetNode.activeAlerts = (targetNode.activeAlerts || 0) + 1;
          
          // === 场景: 上游供货延期 (Supplier Delay) ===
          if (config.type === 'SUPPLY_DELAY') {
             // 影响: 供应商 -> 基地 -> 客户
             const supplierToBaseLinks = newGraph.links.filter(l => l.source === targetNode.id);
             supplierToBaseLinks.forEach(link => {
                 link.status = 'critical'; 
                 const baseNode = newGraph.nodes.find(n => n.id === link.target);
                 if (baseNode) {
                     baseNode.status = baseNode.status === 'critical' ? 'critical' : 'warning';
                     baseNode.activeAlerts = (baseNode.activeAlerts || 0) + 1;
                     if (baseNode.inventoryLevel) baseNode.inventoryLevel = Math.max(0, baseNode.inventoryLevel * 0.7);
                     
                     const baseToCustomerLinks = newGraph.links.filter(l => l.source === baseNode.id);
                     baseToCustomerLinks.forEach(l2 => {
                         l2.status = 'warning';
                         const custNode = newGraph.nodes.find(n => n.id === l2.target);
                         if (custNode) {
                             custNode.status = 'warning';
                             custNode.activeAlerts = (custNode.activeAlerts || 0) + 1;
                         }
                     });
                 }
             });
          }

          // === 场景: 下游需求变更 (Demand Change) ===
          if (config.type === 'DEMAND_CHANGE') {
              const changePercent = Number(config.parameters.demandChange) || 0;
              const isCut = changePercent < 0; 

              // 影响: 客户 -> 基地 (库存/产能)
              const supplyingLinks = newGraph.links.filter(l => l.target === targetNode.id);
              supplyingLinks.forEach(link => {
                  link.status = 'warning'; 
                  const baseNode = newGraph.nodes.find(n => n.id === link.source);
                  if (baseNode) {
                      baseNode.status = 'warning'; 
                      baseNode.activeAlerts = (baseNode.activeAlerts || 0) + 1;
                      if (isCut) {
                          const increaseFactor = 1 + (Math.abs(changePercent) / 100);
                          baseNode.inventoryLevel = Math.floor((baseNode.inventoryLevel || 5000) * increaseFactor);
                      }
                  }
              });
          }

          // === 场景: 产线故障/库存异常 (Production/Inventory) ===
          if (config.type === 'PRODUCTION_ISSUE' || config.type === 'INVENTORY_ISSUE') {
              // 影响: 基地 -> 客户 (交付风险)
              const baseToCustomerLinks = newGraph.links.filter(l => l.source === targetNode.id);
              baseToCustomerLinks.forEach(l => {
                  l.status = 'critical';
                  const custNode = newGraph.nodes.find(n => n.id === l.target);
                  if (custNode) {
                      custNode.status = 'warning';
                      custNode.activeAlerts = (custNode.activeAlerts || 0) + 1;
                  }
              });
          }
        }
    });

    setGraphData(newGraph);

    // Call Gemini for the Detailed Report
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        
        const scenarioDescriptions = configs.map(c => `- ${c.description} (类型: ${c.type})`).join('\n');

        const prompt = `
        【任务】
        用户在锂电供应链数字孪生系统中触发了"联合推演"。系统同时发生了以下多个事件，请进行深度分析并生成决策方案。
        
        【事件列表】
        ${scenarioDescriptions}

        【生成要求】
        请提供 **3个综合应对方案** (方案A: 保守/低成本, 方案B: 激进/保交付, 方案C: 折中/平衡)。
        
        对于每个方案，必须包含以下三个部分：
        
        1. **方案描述**: 具体执行步骤。
        2. **方案数据比对 (Data Comparison)**: 
           - 预计额外成本 (Estimate Cost)
           - 订单满足率 (Fulfillment Rate)
           - 风险指数 (Risk Level)
        3. **推理链条 (Inference Chain)**: 
           展示你是如何得出该方案的。格式如下：
           - **触发数据 (Trigger)**: [列出导致该决策的关键数据，如库存缺口、延期天数]
           - **引用规则 (Rule)**: [列出依据的业务规则，如"安全库存红线"、"战略客户优先"]
           - **计算逻辑 (Logic)**: [简述推演逻辑，如"因A产线停机，调用B产线余量覆盖缺口"]
           - **推演结果 (Result)**: [最终效果预测]

        【格式规范】
        - 采用Markdown格式。
        - 语气专业、客观、数据导向。
        - 严禁出现"Palantir"、"Foundry"等字样。
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-latest',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const report = response.text || "无法生成推演报告。";
        
        // Add specific "Simulation Report" message
        setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: 'model', 
            content: `📊 **联合推演计算完成**\n\n针对 ${configs.length} 个叠加事件的综合分析：\n\n${report}`, 
            timestamp: new Date() 
        }]);

    } catch (e) {
        console.error(e);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "推演计算服务连接失败，请检查网络或API Key。", timestamp: new Date() }]);
    } finally {
        setIsAiThinking(false);
    }
  };

  const handleConstraintToggle = (categoryId: string, itemId: string) => {
    setConstraints(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => {
          if (item.id !== itemId) return item;
          return { ...item, enabled: !item.enabled };
        })
      };
    }));
  };

  const onNodeHover = useCallback((node: NodeData | null, x: number, y: number) => {
    setHoveredNode({ node, x, y });
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded text-white">
            <Share2 size={20} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg leading-tight">LithiumChain 产销智能推演</h1>
            <p className="text-xs text-slate-500 font-medium">Scenario: 2024-Q4-Optimized-v2</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex gap-4 text-xs font-semibold text-slate-600">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded border border-slate-200">
                <Database size={14} className="text-blue-500"/>
                <span>主数据: 2024-10-25</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded border border-slate-200">
                <Layers size={14} className="text-purple-500"/>
                <span>模型版本: v3.2.1</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded border border-green-200">
                <Activity size={14}/>
                <span>系统状态: 在线</span>
             </div>
           </div>
           <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
             <Menu size={20} />
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Panel: Constraints & Scenarios */}
        <div className="w-80 flex-shrink-0 h-full z-20">
          <ConstraintPanel 
            constraints={constraints} 
            nodes={graphData.nodes}
            onToggleConstraint={handleConstraintToggle}
            onRunSimulation={handleRunSimulation}
            onAnalyzeConstraint={handleAnalyzeConstraint}
            onAddConstraint={handleAddConstraint}
            isSimulating={isAiThinking}
          />
        </div>

        {/* Center Canvas: Graph */}
        <div className="flex-1 bg-slate-50 relative overflow-hidden h-full">
           <div className="absolute top-4 left-4 z-10 pointer-events-none">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">供应链全景视图</h2>
              <div className="flex gap-4">
                 <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#22c55e] border border-white shadow-sm"></div>
                    <span className="text-xs text-slate-600 font-medium">供应商</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-[#a855f7] border border-white shadow-sm"></div>
                    <span className="text-xs text-slate-600 font-medium">生产基地</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-[#3b82f6] border border-white shadow-sm rotate-45 transform scale-75"></div>
                    <span className="text-xs text-slate-600 font-medium">客户交付</span>
                 </div>
                  <div className="flex items-center gap-1.5 pl-4 border-l border-slate-300 ml-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse border border-white shadow-sm"></div>
                    <span className="text-xs text-red-600 font-bold">异常/延期</span>
                 </div>
              </div>
           </div>

           <SupplyChainGraph 
             data={graphData} 
             onNodeHover={onNodeHover}
             width={dimensions.width}
             height={dimensions.height}
           />
           
           {/* Floating Tooltip */}
           <Tooltip node={hoveredNode.node} position={hoveredNode.node ? { x: hoveredNode.x, y: hoveredNode.y } : null} />
        </div>

        {/* Right Panel: AI Chat */}
        <div className="w-96 flex-shrink-0 h-full border-l border-slate-200 z-20">
           <AIChat 
                messages={messages} 
                onSendMessage={handleUserMessage}
                isThinking={isAiThinking}
           />
        </div>
      </div>
    </div>
  );
}

export default App;