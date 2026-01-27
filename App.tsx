import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layers, Database, Activity, Share2, Menu, Play, RotateCcw, MessageSquare, LayoutDashboard, Settings2, Sliders, ChevronLeft, Zap, GitBranch, Settings, Package, ShoppingCart, Factory, AlertTriangle } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import SupplyChainGraph from './components/SupplyChainGraph';
import ConstraintPanel from './components/ConstraintPanel';
import AIChat from './components/AIChat';
import DashboardPanel from './components/DashboardPanel';
import InventoryPanel from './components/InventoryPanel';
import SalesPanel from './components/SalesPanel';
import ProductionMonitorPanel from './components/ProductionMonitorPanel';
import Tooltip from './components/Tooltip';
import AnomalyAnalysisModal from './components/AnomalyAnalysisModal';
import { MOCK_DATA, INITIAL_CONSTRAINTS } from './constants';
import { GraphData, NodeData, ConstraintCategory, ScenarioConfig, ChatMessage, ConstraintItem } from './types';

function App() {
  const [constraints, setConstraints] = useState<ConstraintCategory[]>(INITIAL_CONSTRAINTS);
  const [graphData, setGraphData] = useState<GraphData>(MOCK_DATA);
  const [hoveredNode, setHoveredNode] = useState<{ node: NodeData | null; x: number; y: number }>({ node: null, x: 0, y: 0 });
  
  // Selection State for Multi-Node Analysis
  const [selectedNodes, setSelectedNodes] = useState<NodeData[]>([]);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  // Panel State (Left Sidebar)
  const [activePanel, setActivePanel] = useState<'none' | 'scenario' | 'config' | 'dashboard' | 'chat' | 'inventory' | 'sales' | 'production'>('none');

  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight - 64 }); 
  
  const tooltipTimeoutRef = useRef<any>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: '我是您的供应链智能助手。您可以勾选图谱中的节点（支持多选），进行联合异常推演。在对话中输入新的规则，我会自动为您沉淀到知识库。',
      timestamp: new Date()
    }
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Responsive resize handler
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth, 
        height: window.innerHeight - 64
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activePanel]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Standard Chat Interaction with Rule Learning Tool
  const handleUserMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsAiThinking(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const systemPrompt = `
      你是一个供应链专家助手。
      当前上下文：用户正在浏览锂电产销推演界面。
      
      【你的能力】
      1. 回答用户关于供应链的问题。
      2. **知识学习**: 如果用户提到了一条新的业务规则、约束条件或逻辑（例如“如果库存低于1000则报警”），你**必须**调用工具 'learn_rule' 将其保存到知识库。
      
      【注意】
      - 仅当用户明确表达规则时才调用工具。
      - 如果只是询问信息，则直接回答。
      - 调用工具后，向用户确认规则已添加。
      `;

      // Define the tool for learning rules
      const learnRuleTool = {
          functionDeclarations: [
              {
                  name: "learn_rule",
                  description: "Automatically extracts and saves a business rule or constraint from the conversation to the knowledge base.",
                  parameters: {
                      type: Type.OBJECT,
                      properties: {
                          label: { type: Type.STRING, description: "Short, descriptive title for the rule (e.g., 'Safety Stock Alert')." },
                          description: { type: Type.STRING, description: "Detailed description of the business logic." },
                          impactLevel: { type: Type.STRING, enum: ["low", "medium", "high"], description: "The severity or priority of this rule." },
                          pseudoLogic: { type: Type.STRING, description: "A structured pseudo-code representation (e.g., 'IF inventory < 1000 THEN alert')." }
                      },
                      required: ["label", "description", "impactLevel"]
                  }
              }
          ]
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-latest',
        contents: [
            { role: 'user', parts: [{ text: systemPrompt + "\n用户: " + text }] }
        ],
        config: {
            tools: [learnRuleTool],
        }
      });

      // Check for Function Calls (Tool Use)
      const functionCalls = response.functionCalls;
      
      if (functionCalls && functionCalls.length > 0) {
          const call = functionCalls[0];
          if (call.name === 'learn_rule') {
              const args = call.args as any;
              
              // Execute: Add to Knowledge Base (Constraints State)
              const newRule: ConstraintItem = {
                  id: `ai-learned-${Date.now()}`,
                  label: args.label,
                  description: args.description,
                  impactLevel: args.impactLevel,
                  enabled: true,
                  source: 'ai', // Mark as AI learned
                  logic: { 
                      relationType: 'TRIGGER', 
                      actionDescription: args.pseudoLogic || 'AI Inferenced Logic'
                  }
              };
              
              handleAddConstraint(newRule);

              // Respond to user confirming the action
              const confirmMsg = `✅ 已自动学习规则：**${args.label}**\n\n该规则已同步至推演配置知识库，并即刻生效。`;
              setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: confirmMsg, timestamp: new Date() }]);
          }
      } else {
          // Standard text response
          const reply = response.text || "我暂时无法理解，请重试。";
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: reply, timestamp: new Date() }]);
      }

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "服务繁忙，请稍后。", timestamp: new Date() }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleAnalyzeConstraint = async (text: string): Promise<Partial<ConstraintItem>> => {
    // Only used for manual constraint builder in the panel
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
            return [...prev, { id: customCatId, name: '知识库 / 自定义规则', items: [item] }];
        }
    });
  };

  // Run Simulation Logic
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
        }
    });

    setGraphData(newGraph);
    setIsAiThinking(false);
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
    if (node) {
        if (tooltipTimeoutRef.current) {
            clearTimeout(tooltipTimeoutRef.current);
            tooltipTimeoutRef.current = null;
        }
        setHoveredNode({ node, x, y });
    } else {
        if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = setTimeout(() => {
            setHoveredNode(prev => ({ ...prev, node: null }));
        }, 5000);
    }
  }, []);

  const handleNodeClick = useCallback((node: NodeData) => {
    setSelectedNodes(prev => {
        const exists = prev.find(n => n.id === node.id);
        if (exists) {
            // Deselect
            return prev.filter(n => n.id !== node.id);
        } else {
            // Multi-select enabled by default
            return [...prev, node];
        }
    });
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNodes([]);
  }, []);

  const handleSelectAllRisks = () => {
      const riskyNodes = graphData.nodes.filter(n => n.status === 'warning' || n.status === 'critical');
      setSelectedNodes(riskyNodes);
  };

  const onTooltipEnter = useCallback(() => {
    if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = null;
    }
  }, []);

  const onTooltipLeave = useCallback(() => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    tooltipTimeoutRef.current = setTimeout(() => {
        setHoveredNode(prev => ({ ...prev, node: null }));
    }, 5000);
  }, []);

  const togglePanel = (panel: 'scenario' | 'config' | 'dashboard' | 'chat' | 'inventory' | 'sales' | 'production') => {
      setActivePanel(prev => prev === panel ? 'none' : panel);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between shadow-sm z-30 relative shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded text-white">
            <Share2 size={20} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg leading-tight">CALB产销智能推演系统</h1>
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

      {/* Main Container */}
      <div className="flex-1 relative overflow-hidden flex flex-row">
        
        {/* Left Dock / Navigation Bar - FOUNDRY STYLE */}
        <div className="w-14 bg-[#111827] border-r border-[#1f2937] z-40 flex flex-col items-center py-4 gap-4 shadow-xl shrink-0 overflow-y-auto no-scrollbar">
            {/* Top Group: Simulation Tools */}
            <div className="flex flex-col gap-2 w-full px-2">
                 <button 
                    onClick={() => togglePanel('scenario')}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative ${activePanel === 'scenario' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                    <Zap size={20} strokeWidth={activePanel === 'scenario' ? 2.5 : 2} />
                    <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity shadow-xl z-50">
                        场景模拟 (Scenario)
                    </span>
                </button>

                 <button 
                    onClick={() => togglePanel('config')}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative ${activePanel === 'config' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                    <Settings size={20} strokeWidth={activePanel === 'config' ? 2.5 : 2} />
                    <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity shadow-xl z-50">
                        推演配置 (Configuration)
                    </span>
                </button>
            </div>

            <div className="w-8 h-px bg-slate-700/50 my-1"></div>

            {/* Middle Group: Monitoring (NEW ICONS ADDED HERE) */}
            <div className="flex flex-col gap-2 w-full px-2">
                 <button 
                    onClick={() => togglePanel('dashboard')}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative ${activePanel === 'dashboard' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                    <LayoutDashboard size={20} strokeWidth={activePanel === 'dashboard' ? 2.5 : 2} />
                    <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity shadow-xl z-50">
                        全景看板 (Dashboard)
                    </span>
                </button>

                {/* 1. Inventory Monitor */}
                 <button 
                    onClick={() => togglePanel('inventory')}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative ${activePanel === 'inventory' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                    <Package size={20} strokeWidth={activePanel === 'inventory' ? 2.5 : 2} />
                    <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity shadow-xl z-50">
                        库存滚动监控 (Inventory)
                    </span>
                </button>

                {/* 2. Sales Forecast */}
                 <button 
                    onClick={() => togglePanel('sales')}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative ${activePanel === 'sales' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                    <ShoppingCart size={20} strokeWidth={activePanel === 'sales' ? 2.5 : 2} />
                    <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity shadow-xl z-50">
                        产销计划 (S&OP)
                    </span>
                </button>

                {/* 3. Production Lines */}
                 <button 
                    onClick={() => togglePanel('production')}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative ${activePanel === 'production' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                    <Factory size={20} strokeWidth={activePanel === 'production' ? 2.5 : 2} />
                    <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity shadow-xl z-50">
                        产线工序监控 (MES)
                    </span>
                </button>
            </div>

            <div className="flex-1"></div>

            {/* Bottom Group: Assistant */}
            <button 
                onClick={() => togglePanel('chat')}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative ${activePanel === 'chat' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <MessageSquare size={20} strokeWidth={activePanel === 'chat' ? 2.5 : 2} />
                 <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity shadow-xl z-50">
                    智能助手 (AI Copilot)
                </span>
            </button>
        </div>

        {/* Slide-out Panel Container (Left Side) */}
        {activePanel !== 'none' && (
             <div 
                className="absolute left-14 top-0 bottom-0 z-30 bg-white border-r border-slate-200 shadow-2xl transition-transform duration-300 ease-in-out transform translate-x-0"
                style={{ width: ['dashboard', 'inventory', 'sales', 'production'].includes(activePanel) ? '480px' : '400px' }}
             >
                 {/* Close Handle (Right side of panel) */}
                 <div 
                    onClick={() => setActivePanel('none')}
                    className="absolute top-1/2 -right-4 w-4 h-12 bg-white border border-slate-200 border-l-0 rounded-r-md flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-400 shadow-sm"
                 >
                     <ChevronLeft size={14} />
                 </div>

                 {/* Panel Content */}
                 <div className="h-full w-full overflow-hidden">
                    {(activePanel === 'config' || activePanel === 'scenario') && (
                        <ConstraintPanel 
                            constraints={constraints} 
                            nodes={graphData.nodes}
                            onToggleConstraint={handleConstraintToggle}
                            onRunSimulation={handleRunSimulation}
                            onAnalyzeConstraint={handleAnalyzeConstraint}
                            onAddConstraint={handleAddConstraint}
                            isSimulating={isAiThinking}
                            initialTab={activePanel === 'scenario' ? 'scenarios' : 'constraints'}
                        />
                    )}
                    {activePanel === 'dashboard' && <DashboardPanel data={graphData} />}
                    {activePanel === 'inventory' && <InventoryPanel />}
                    {activePanel === 'sales' && <SalesPanel />}
                    {activePanel === 'production' && <ProductionMonitorPanel />}
                    {activePanel === 'chat' && (
                         <AIChat 
                            messages={messages} 
                            onSendMessage={handleUserMessage}
                            isThinking={isAiThinking}
                        />
                    )}
                 </div>
             </div>
        )}

        {/* Graph Area (Takes remaining space) */}
        <div className="flex-1 bg-slate-50 relative h-full">
           <div className="absolute top-4 left-4 z-10 pointer-events-none select-none">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">供应链全景视图</h2>
              <div className="flex flex-col gap-2 items-start mt-1">
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
                {/* Quick Action for Batch Selection */}
                <button 
                    onClick={handleSelectAllRisks}
                    className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-full shadow-sm text-[10px] font-bold text-red-600 hover:bg-white transition-colors cursor-pointer pointer-events-auto"
                >
                    <AlertTriangle size={12}/> 
                    一键选中所有风险节点 (批量推演)
                </button>
              </div>
           </div>

           <SupplyChainGraph 
             data={graphData} 
             onNodeHover={onNodeHover}
             onNodeClick={handleNodeClick}
             onBackgroundClick={handleBackgroundClick}
             selectedNodeIds={selectedNodes.map(n => n.id)}
             width={dimensions.width}
             height={dimensions.height}
           />
           
           <Tooltip 
             node={hoveredNode.node} 
             position={hoveredNode.node ? { x: hoveredNode.x, y: hoveredNode.y } : null} 
             onDrillDown={handleNodeClick} 
             onMouseEnter={onTooltipEnter}
             onMouseLeave={onTooltipLeave}
           />

           {/* Floating Action Bar for Multi-Node Analysis */}
           {selectedNodes.length > 0 && (
               <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-in slide-in-from-bottom-4 fade-in duration-300">
                   <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 border border-slate-700/50">
                       <div className="flex items-center gap-3">
                           <div className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-inner">
                               {selectedNodes.length}
                           </div>
                           <div className="flex flex-col">
                               <span className="text-sm font-bold">已选异常节点 (Multi-Select)</span>
                               <span className="text-[10px] text-slate-400">点击图谱可继续添加节点</span>
                           </div>
                       </div>
                       
                       <div className="h-8 w-px bg-slate-700"></div>

                       <div className="flex gap-2">
                           <button 
                               onClick={() => setSelectedNodes([])}
                               className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                           >
                               <RotateCcw size={14} /> 清空
                           </button>
                           <button 
                               onClick={() => setIsAnalysisModalOpen(true)}
                               className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
                           >
                               <Play size={16} fill="currentColor" />
                               执行联合推演
                           </button>
                       </div>
                   </div>
               </div>
           )}
        </div>
      </div>

      {/* Joint Anomaly Analysis Modal Overlay */}
      {isAnalysisModalOpen && selectedNodes.length > 0 && (
        <AnomalyAnalysisModal 
          nodes={selectedNodes} 
          graph={graphData} 
          onClose={() => setIsAnalysisModalOpen(false)} 
          onAddConstraint={handleAddConstraint}
        />
      )}
    </div>
  );
}

export default App;