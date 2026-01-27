
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layers, Database, Activity, Share2, Menu, Play, RotateCcw, MessageSquare, LayoutDashboard, Settings2, Sliders, ChevronLeft, Zap, GitBranch, Settings, Package, ShoppingCart, Factory, AlertTriangle, Server, ArrowLeft, TrendingUp, TrendingDown, Clock, CheckCircle2, ArrowRight, Maximize, Minimize, AlertCircle, XCircle, ChevronRight, BarChart4 } from 'lucide-react';
import { Type } from "@google/genai";
import SupplyChainGraph from './components/SupplyChainGraph';
import ConstraintPanel from './components/ConstraintPanel';
import AIChat from './components/AIChat';
import DashboardPanel from './components/DashboardPanel';
import InventoryPanel from './components/InventoryPanel';
import SalesPanel from './components/SalesPanel';
import ProductionMonitorPanel from './components/ProductionMonitorPanel';
import SettingsPanel from './components/SettingsPanel';
import CapacityPanel from './components/CapacityPanel';
import Tooltip from './components/Tooltip';
import { AnomalyAnalysisModal } from './components/AnomalyAnalysisModal';
import { MOCK_DATA, INITIAL_CONSTRAINTS } from './constants';
import { GraphData, NodeData, ConstraintCategory, ScenarioConfig, ChatMessage, ConstraintItem, LLMConfig, ThemeConfig, LayoutMode } from './types';
import { ComposedChart, Bar, Line, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

// Default Config
const DEFAULT_LLM_CONFIG: LLMConfig = {
    provider: 'glm',
    apiKey: process.env.API_KEY || '',
    modelName: 'glm-4-plus'
};

const DEFAULT_THEME: ThemeConfig = {
    layoutMode: 'bento',
    heroColor: 'bg-emerald-600',
    operationsColor: 'bg-slate-900',
    productionColor: 'bg-[#FEF3C7]', // Bright Orange Yellow (Amber 100)
    inventoryColor: 'bg-[#eff6ff]', // Light Blue
    salesColor: 'bg-white',
    capacityColor: 'bg-orange-50' // Default capacity card color
};

// Mini Mock Data for Capacity Card
const CAP_FORECAST_MINI = Array.from({length: 12}, (_, i) => ({
    name: `M${i+1}`,
    capacity: 100,
    demand: 80 + (i * 5) + Math.random() * 10
}));

function App() {
  const [constraints, setConstraints] = useState<ConstraintCategory[]>(INITIAL_CONSTRAINTS);
  const [graphData, setGraphData] = useState<GraphData>(MOCK_DATA);
  const [hoveredNode, setHoveredNode] = useState<{ node: NodeData | null; x: number; y: number }>({ node: null, x: 0, y: 0 });
  
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(() => {
      const saved = localStorage.getItem('supply_chain_llm_config');
      return saved ? JSON.parse(saved) : DEFAULT_LLM_CONFIG;
  });

  const [theme, setTheme] = useState<ThemeConfig>(() => {
      const saved = localStorage.getItem('supply_chain_theme_config');
      return saved ? JSON.parse(saved) : DEFAULT_THEME;
  });

  const [selectedNodes, setSelectedNodes] = useState<NodeData[]>([]);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  // View State
  const [activeView, setActiveView] = useState<'home' | 'graph_full' | 'dashboard' | 'inventory' | 'sales' | 'production' | 'capacity' | 'settings' | 'config' | 'scenario'>('home');
  const [isChatOpen, setIsChatOpen] = useState(false); 
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight - 64 }); 
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Hero Card Dimensions State
  const heroCardRef = useRef<HTMLDivElement>(null);
  const [heroDimensions, setHeroDimensions] = useState({ width: 0, height: 0 });

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

  // --- Helpers for Contrast ---
  const isDark = (colorClass: string) => {
      // Heuristic: If class contains '900', '800', '700', '600' (except some bright ones) it's likely dark
      // Simple check for high numbers usually means dark background in Tailwind standard palette
      if (!colorClass) return false;
      return colorClass.includes('900') || colorClass.includes('800') || colorClass.includes('700') || colorClass.includes('600');
  };

  const getTextColor = (bgClass: string) => {
      return isDark(bgClass) ? 'text-white' : 'text-slate-800';
  };
  
  const getSubTextColor = (bgClass: string) => {
      return isDark(bgClass) ? 'text-white/70' : 'text-slate-500';
  };

  const getCardInnerBg = (bgClass: string) => {
      return isDark(bgClass) ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-slate-100';
  };

  // --- Handlers ---

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            setIsFullScreen(true);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().then(() => {
                setIsFullScreen(false);
            });
        }
    }
  };

  useEffect(() => {
      const handleFsChange = () => {
          setIsFullScreen(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', handleFsChange);
      return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Resize Handler for Main Container
  useEffect(() => {
    const handleResize = () => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight
            });
        } else {
             setDimensions({
                width: window.innerWidth - 64, // Subtract sidebar
                height: window.innerHeight - 80 // Subtract header
            });
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial
    return () => window.removeEventListener('resize', handleResize);
  }, [activeView, theme.layoutMode]); // Re-calc on layout change

  // Resize Observer for Hero Card
  useEffect(() => {
    if (activeView === 'home' && heroCardRef.current) {
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setHeroDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });
        resizeObserver.observe(heroCardRef.current);
        return () => resizeObserver.disconnect();
    }
  }, [activeView, theme.layoutMode]); // Re-observe on layout change

  const handleConfigSave = (newConfig: LLMConfig) => {
      setLlmConfig(newConfig);
      localStorage.setItem('supply_chain_llm_config', JSON.stringify(newConfig));
  };

  const handleThemeChange = (newTheme: ThemeConfig) => {
      setTheme(newTheme);
      localStorage.setItem('supply_chain_theme_config', JSON.stringify(newTheme));
  };

  const handleDataImport = (type: string, importedData: any) => {
      if (type === 'graph') {
          if (importedData.nodes && importedData.links) {
              setGraphData(importedData);
              alert('拓扑结构已更新');
          }
      }
  };

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    };
  }, []);

  // --- AI Logic (Simulated for New Providers) ---
  const callAI = async (prompt: string, tools?: any[]) => {
      if (llmConfig.provider === 'glm' || llmConfig.provider === 'kimi' || llmConfig.provider === 'rendu') {
          await new Promise(resolve => setTimeout(resolve, 1500)); 

          if (tools && tools.length > 0 && prompt.includes('learn_rule')) {
              if (prompt.includes('如果') || prompt.includes('当') || prompt.includes('禁止') || prompt.includes('优先')) {
                 return {
                     text: undefined,
                     functionCalls: [{
                         name: 'learn_rule',
                         args: {
                             label: '自动提取业务规则 (Auto-Learned)',
                             description: `基于对话内容自动识别的约束：${prompt.slice(prompt.indexOf('用户:') + 4).slice(0, 50)}...`,
                             impactLevel: 'medium',
                             pseudoLogic: 'AUTO_GENERATED_LOGIC_FROM_LLM'
                         }
                     }]
                 };
              }
          }

          const providerName = llmConfig.provider === 'glm' ? '智谱 GLM-4' : llmConfig.provider === 'rendu' ? '传神 Rendu' : 'Kimi';
          return { 
              text: `[${providerName} 模型响应]: \n\n我已理解您的需求。基于当前的供应链图谱数据与约束条件，该操作可能会导致下游交付延期风险增加 12%。建议您同步检查库存水位。\n\n(注：当前为前端演示模式，未实际调用 ${providerName} API)`, 
              functionCalls: undefined 
          };
      }
      throw new Error("Unknown provider configuration");
  };

  const handleUserMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsAiThinking(true);

    try {
      const systemPrompt = `你是一个供应链专家助手...`;
      const learnRuleTool = {
          functionDeclarations: [{
              name: "learn_rule",
              description: "Extract business rule",
              parameters: {
                  type: Type.OBJECT,
                  properties: {
                      label: { type: Type.STRING },
                      description: { type: Type.STRING },
                      impactLevel: { type: Type.STRING, enum: ["low", "medium", "high"] },
                      pseudoLogic: { type: Type.STRING }
                  },
                  required: ["label", "description", "impactLevel"]
              }
          }]
      };
      
      const aiResult = await callAI(systemPrompt + `\n用户: ${text}`, [learnRuleTool]);
      const functionCalls = aiResult.functionCalls;
      
      if (functionCalls && functionCalls.length > 0) {
          const call = functionCalls[0];
          if (call.name === 'learn_rule') {
              const args = call.args as any;
              const newRule: ConstraintItem = {
                  id: `ai-learned-${Date.now()}`,
                  label: args.label,
                  description: args.description,
                  impactLevel: args.impactLevel,
                  enabled: true,
                  source: 'ai',
                  logic: { relationType: 'TRIGGER', actionDescription: args.pseudoLogic || 'AI Inferenced Logic' }
              };
              handleAddConstraint(newRule);
              const confirmMsg = `✅ 已自动学习规则：**${args.label}**`;
              setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: confirmMsg, timestamp: new Date() }]);
          }
      } else {
          const reply = aiResult.text || "我暂时无法理解。";
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: reply, timestamp: new Date() }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "服务繁忙。", timestamp: new Date() }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleAnalyzeConstraint = async (text: string): Promise<Partial<ConstraintItem>> => {
      // Mock Implementation for now
      return { label: "AI Rule", description: text };
  };

  const handleAddConstraint = (item: ConstraintItem) => {
    setConstraints(prev => {
        const customCatId = 'custom_rules';
        const exists = prev.find(c => c.id === customCatId);
        if (exists) return prev.map(c => c.id === customCatId ? { ...c, items: [...c.items, item] } : c);
        return [...prev, { id: customCatId, name: '知识库 / 自定义规则', items: [item] }];
    });
  };

  const handleRunSimulation = async (configs: ScenarioConfig[]) => {
    setIsAiThinking(true);
    const newGraph: GraphData = JSON.parse(JSON.stringify(graphData));
    configs.forEach(config => {
        const targetNode = newGraph.nodes.find(n => n.id === config.targetNodeId);
        if (targetNode) {
          targetNode.status = 'critical';
          targetNode.activeAlerts = (targetNode.activeAlerts || 0) + 1;
          if (config.type === 'SUPPLY_DELAY') {
             const supplierToBaseLinks = newGraph.links.filter(l => l.source === targetNode.id);
             supplierToBaseLinks.forEach(link => {
                 link.status = 'critical'; 
                 const baseNode = newGraph.nodes.find(n => n.id === link.target);
                 if (baseNode) {
                     baseNode.status = 'critical';
                     baseNode.activeAlerts = (baseNode.activeAlerts || 0) + 1;
                     if (baseNode.inventoryLevel) baseNode.inventoryLevel = Math.max(0, baseNode.inventoryLevel * 0.7);
                 }
             });
          }
        }
    });
    setGraphData(newGraph);
    setIsAiThinking(false);
    // Auto switch to graph view to see results
    if (activeView === 'home') setActiveView('graph_full');
  };

  const handleConstraintToggle = (categoryId: string, itemId: string) => {
    setConstraints(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return { ...cat, items: cat.items.map(item => item.id !== itemId ? item : { ...item, enabled: !item.enabled }) };
    }));
  };

  // --- Interaction Handlers ---
  const onNodeHover = useCallback((node: NodeData | null, x: number, y: number) => {
    if (node) {
        if (tooltipTimeoutRef.current) { clearTimeout(tooltipTimeoutRef.current); tooltipTimeoutRef.current = null; }
        setHoveredNode({ node, x, y });
    } else {
        if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = setTimeout(() => { setHoveredNode(prev => ({ ...prev, node: null })); }, 3000);
    }
  }, []);

  const handleNodeClick = useCallback((node: NodeData) => {
    setSelectedNodes(prev => prev.find(n => n.id === node.id) ? prev.filter(n => n.id !== node.id) : [...prev, node]);
  }, []);

  const handleBackgroundClick = useCallback(() => { setSelectedNodes([]); }, []);
  const handleSelectAllRisks = () => {
      const riskyNodes = graphData.nodes.filter(n => n.status === 'warning' || n.status === 'critical');
      if (riskyNodes.length > 0) {
        setSelectedNodes(riskyNodes);
        setIsAnalysisModalOpen(true);
      }
  };

  const onTooltipEnter = useCallback(() => { if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current); }, []);
  const onTooltipLeave = useCallback(() => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    tooltipTimeoutRef.current = setTimeout(() => { setHoveredNode(prev => ({ ...prev, node: null })); }, 3000);
  }, []);

  // --- Layout Configuration Helpers ---
  const getGridClasses = (mode: LayoutMode, cardType: 'hero' | 'ops' | 'prod' | 'inv' | 'sales' | 'cap') => {
      if (mode === 'cinematic') {
          // Top heavy layout: Hero takes full top, others small below
          switch (cardType) {
              case 'hero': return 'col-span-12 row-span-7';
              case 'ops': return 'col-span-2 row-span-5';
              case 'prod': return 'col-span-2 row-span-5';
              case 'inv': return 'col-span-3 row-span-5';
              case 'sales': return 'col-span-3 row-span-5';
              case 'cap': return 'col-span-2 row-span-5';
          }
      } else if (mode === 'balanced') {
          // Left/Right Split: Hero & Ops Left, Others Right
          switch (cardType) {
              case 'hero': return 'col-span-6 row-span-8'; // Left Top
              case 'ops': return 'col-span-6 row-span-4'; // Left Bottom
              // Right Column Split
              case 'prod': return 'col-span-6 row-span-3'; 
              case 'inv': return 'col-span-6 row-span-3'; 
              case 'sales': return 'col-span-6 row-span-3';
              case 'cap': return 'col-span-6 row-span-3';
          }
      } else {
          // Default Bento (Adjusted for 3 bottom cards)
          switch (cardType) {
              case 'hero': return 'col-span-8 row-span-8';
              case 'ops': return 'col-span-4 row-span-4';
              case 'prod': return 'col-span-4 row-span-4';
              // Bottom Row (4+4+4 = 12)
              case 'inv': return 'col-span-4 row-span-4';
              case 'sales': return 'col-span-4 row-span-4';
              case 'cap': return 'col-span-4 row-span-4';
          }
      }
      return '';
  };

  // --- RENDER CONTENT ---
  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-6 justify-between z-30 shrink-0 sticky top-0 transition-all">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveView('home')}>
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl text-white shadow-lg shadow-emerald-200">
            <Share2 size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-xl leading-tight tracking-tight">产销智能推演系统</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Digital Twin v3.2</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {activeView !== 'home' && (
               <button onClick={() => setActiveView('home')} className="flex items-center gap-2 text-base font-bold text-slate-500 hover:text-emerald-600 bg-slate-100 px-4 py-2 rounded-full hover:bg-emerald-50 transition-all">
                   <ArrowLeft size={18}/> 返回首页
               </button>
           )}
           <div className="w-px h-6 bg-slate-200 mx-2"></div>
           
           <button 
             onClick={toggleFullScreen}
             className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all"
             title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
           >
             {isFullScreen ? <Minimize size={20}/> : <Maximize size={20}/>}
           </button>

           <button 
             onClick={() => setIsChatOpen(!isChatOpen)}
             className={`p-2.5 rounded-full transition-all duration-300 relative ${isChatOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-500 hover:text-indigo-600'}`}
           >
             <MessageSquare size={22} />
             {!isChatOpen && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
           </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* Left Sidebar (Navigation) */}
        <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 z-20 shrink-0">
            {[
                { id: 'home', icon: LayoutDashboard, label: '首页' },
                { id: 'graph_full', icon: Share2, label: '拓扑' },
                { id: 'dashboard', icon: Activity, label: '运营' },
                { id: 'inventory', icon: Package, label: '库存' },
                { id: 'sales', icon: ShoppingCart, label: '产销' },
                { id: 'production', icon: Factory, label: '产线' },
                { id: 'capacity', icon: BarChart4, label: '产能' }, // New Item
            ].map((item) => (
                <button 
                    key={item.id}
                    onClick={() => setActiveView(item.id as any)}
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 group relative ${
                        activeView === item.id 
                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-300 scale-105' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                    <item.icon size={24} strokeWidth={activeView === item.id ? 2.5 : 2} />
                    <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 absolute -bottom-4 bg-slate-800 text-white px-2 py-0.5 rounded transition-opacity pointer-events-none z-50 whitespace-nowrap">
                        {item.label}
                    </span>
                </button>
            ))}
            
            <div className="flex-1"></div>
            
            <div className="flex flex-col gap-4">
                 <button 
                    onClick={() => setActiveView('scenario')}
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${activeView === 'scenario' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}
                >
                    <Zap size={24} />
                </button>
                 <button 
                    onClick={() => setActiveView('settings')}
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${activeView === 'settings' ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:bg-slate-100'}`}
                >
                    <Settings size={24} />
                </button>
            </div>
        </div>

        {/* Content Container */}
        <div ref={containerRef} className="flex-1 relative bg-slate-50 overflow-hidden">
            
            {/* VIEW: HOME (Bento Grid 12x12 strict) */}
            {activeView === 'home' && (
                <div className="h-full w-full p-6 overflow-hidden">
                    <div className="grid grid-cols-12 grid-rows-12 gap-5 h-full">
                        
                        {/* 1. Hero Card: Graph */}
                        <div 
                            ref={heroCardRef}
                            onClick={() => setActiveView('graph_full')}
                            className={`${getGridClasses(theme.layoutMode, 'hero')} ${theme.heroColor} rounded-[24px] relative overflow-hidden group cursor-pointer shadow-xl transition-all duration-300 hover:scale-[1.005]`}
                        >
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

                            {/* Text Overlay */}
                            <div className="absolute top-8 left-8 z-30 text-white pointer-events-none">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold border border-white/20 text-white">全景拓扑</span>
                                    <span className="bg-white/10 backdrop-blur-md px-2 py-1 rounded-full text-xs font-mono text-white flex items-center gap-1 border border-white/20">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> 实时监控中
                                    </span>
                                </div>
                                <h2 className="text-4xl font-bold tracking-tight text-white drop-shadow-sm">供应链全景视图</h2>
                            </div>
                            
                            {/* Inner Graph Container */}
                            <div className="absolute inset-0 z-10">
                                {heroDimensions.width > 0 && (
                                    <SupplyChainGraph 
                                        data={graphData}
                                        onNodeHover={()=>{}}
                                        width={heroDimensions.width} 
                                        height={heroDimensions.height}
                                    />
                                )}
                            </div>
                            
                            {/* Action Button */}
                            <div className="absolute bottom-8 left-8 z-30">
                                <button className="bg-white text-emerald-800 px-6 py-2.5 rounded-full text-base font-bold shadow-lg hover:bg-emerald-50 transition-colors flex items-center gap-2 group-hover:pl-7 duration-300">
                                    <Play size={18} fill="currentColor"/> 开始推演
                                </button>
                            </div>
                        </div>

                        {/* 2. Operations: Top Right */}
                        <div 
                            onClick={() => setActiveView('dashboard')}
                            className={`${getGridClasses(theme.layoutMode, 'ops')} ${theme.operationsColor} rounded-[24px] p-6 relative overflow-hidden group cursor-pointer shadow-lg transition-all duration-300 hover:translate-y-[-2px] border ${isDark(theme.operationsColor) ? 'border-transparent' : 'border-slate-800'}`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-3 rounded-xl border shadow-inner ${isDark(theme.operationsColor) ? 'bg-white/10 border-white/10 text-white' : 'bg-slate-800 text-white border-slate-700'}`}>
                                    <LayoutDashboard size={24}/>
                                </div>
                                <ArrowRight className={`${isDark(theme.operationsColor) ? 'text-white/50 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'} transition-colors -rotate-45 group-hover:rotate-0 transform duration-300`} size={24}/>
                            </div>
                            <h3 className={`text-2xl font-bold mb-2 ${getTextColor(theme.operationsColor)}`}>全局运营看板</h3>
                            <div className="grid grid-cols-2 gap-6 mt-6">
                                <div>
                                    <div className={`text-sm mb-1 ${getSubTextColor(theme.operationsColor)}`}>综合 OEE</div>
                                    <div className="text-3xl font-bold text-emerald-400 flex items-end gap-1">
                                        92.4<span className="text-sm text-emerald-600/70 mb-1">%</span>
                                    </div>
                                    <div className={`w-full h-1.5 rounded-full mt-2 overflow-hidden ${isDark(theme.operationsColor) ? 'bg-black/30' : 'bg-slate-800'}`}>
                                        <div className="bg-emerald-500 h-full w-[92%]"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className={`text-sm mb-1 ${getSubTextColor(theme.operationsColor)}`}>交付准时率</div>
                                    <div className="text-3xl font-bold text-blue-400 flex items-end gap-1">
                                        98.1<span className="text-sm text-blue-600/70 mb-1">%</span>
                                    </div>
                                    <div className={`w-full h-1.5 rounded-full mt-2 overflow-hidden ${isDark(theme.operationsColor) ? 'bg-black/30' : 'bg-slate-800'}`}>
                                        <div className="bg-blue-500 h-full w-[98%]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Production: Middle Right */}
                        <div 
                             onClick={() => setActiveView('production')}
                             className={`${getGridClasses(theme.layoutMode, 'prod')} ${theme.productionColor} rounded-[24px] p-6 border shadow-md group cursor-pointer relative transition-all duration-300 hover:shadow-lg ${isDark(theme.productionColor) ? 'border-transparent' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className={`text-xl font-bold ${getTextColor(theme.productionColor)}`}>产线异常监控</h3>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                        </span>
                                        <p className="text-sm text-red-600 font-medium">2 Critical Alerts</p>
                                    </div>
                                </div>
                                <div className={`p-2.5 rounded-full shadow-sm border ${isDark(theme.productionColor) ? 'bg-white/10 text-white border-white/20' : 'bg-white text-orange-500 border-orange-100'}`}>
                                    <AlertTriangle size={22}/>
                                </div>
                            </div>
                            
                            {/* Alert List - Specific Data */}
                            <div className="space-y-3 mt-4">
                                <div className={`flex items-center justify-between p-3 rounded-xl shadow-sm backdrop-blur-sm transition-colors ${getCardInnerBg(theme.productionColor)}`}>
                                    <div className="flex items-center gap-3">
                                        <XCircle size={18} className="text-red-500" />
                                        <div>
                                            <div className={`text-sm font-bold ${getTextColor(theme.productionColor)}`}>武汉 Pack Line 3</div>
                                            <div className="text-xs text-red-500 font-medium">设备故障停机 (E-204)</div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded">Stop</span>
                                </div>

                                <div className={`flex items-center justify-between p-3 rounded-xl shadow-sm backdrop-blur-sm transition-colors ${getCardInnerBg(theme.productionColor)}`}>
                                    <div className="flex items-center gap-3">
                                        <AlertCircle size={18} className="text-orange-500" />
                                        <div>
                                            <div className={`text-sm font-bold ${getTextColor(theme.productionColor)}`}>洛阳 Coating A</div>
                                            <div className="text-xs text-orange-500 font-medium">良率波动 (94.2%)</div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded">Warn</span>
                                </div>
                            </div>
                        </div>

                        {/* 4. Inventory: Bottom Left */}
                        <div 
                            onClick={() => setActiveView('inventory')}
                            className={`${getGridClasses(theme.layoutMode, 'inv')} ${theme.inventoryColor} rounded-[24px] p-6 border shadow-md group cursor-pointer relative transition-all duration-300 ${isDark(theme.inventoryColor) ? 'border-transparent' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                             <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm ${isDark(theme.inventoryColor) ? 'bg-white/10 border-white/10 text-white' : 'bg-white text-indigo-600 border-indigo-50'}`}>
                                        <Package size={24}/>
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-bold ${getTextColor(theme.inventoryColor)}`}>库存滚动监控</h3>
                                        <p className={`text-sm ${getSubTextColor(theme.inventoryColor)}`}>Inventory Monitoring</p>
                                    </div>
                                </div>
                                <ArrowRight className={`${isDark(theme.inventoryColor) ? 'text-white/50 group-hover:text-white' : 'text-slate-300 group-hover:text-indigo-600'} transition-colors`} size={24}/>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6 mt-2">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className={`text-sm font-medium ${getSubTextColor(theme.inventoryColor)}`}>成品周转</span>
                                        <span className={`text-3xl font-bold ${getTextColor(theme.inventoryColor)}`}>28.5<span className={`text-sm ml-1 font-normal ${getSubTextColor(theme.inventoryColor)}`}>天</span></span>
                                    </div>
                                    <div className={`w-full rounded-full h-2 ${isDark(theme.inventoryColor) ? 'bg-black/20' : 'bg-slate-200'}`}>
                                        <div className="bg-indigo-500 h-2 rounded-full w-[60%]"></div>
                                    </div>
                                    <div className={`flex justify-between text-xs ${getSubTextColor(theme.inventoryColor)}`}>
                                        <span>Target: 30天</span>
                                        <span className="text-emerald-600 font-bold flex items-center gap-1"><TrendingDown size={12}/> -1.2</span>
                                    </div>
                                </div>

                                {/* Specific Abnormal Inventory Items */}
                                <div className="space-y-2">
                                    <div className={`text-xs font-bold uppercase mb-2 ${isDark(theme.inventoryColor) ? 'text-white/50' : 'text-slate-400'}`}>重点关注物料</div>
                                    <div className={`flex items-center justify-between text-sm p-2 rounded-lg border shadow-sm ${getCardInnerBg(theme.inventoryColor)}`}>
                                        <span className="font-medium">碳酸锂 (Li2CO3)</span>
                                        <span className="font-bold text-red-600">120T <span className="text-[10px] font-normal text-red-400">(缺货)</span></span>
                                    </div>
                                    <div className={`flex items-center justify-between text-sm p-2 rounded-lg border shadow-sm ${getCardInnerBg(theme.inventoryColor)}`}>
                                        <span className="font-medium">5系三元前驱体</span>
                                        <span className={`font-bold ${isDark(theme.inventoryColor) ? 'text-white' : 'text-slate-700'}`}>850T <span className={`text-[10px] font-normal ${isDark(theme.inventoryColor) ? 'text-white/50' : 'text-slate-400'}`}>(正常)</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 5. Sales: Bottom Middle (Shifted) */}
                        <div 
                             onClick={() => setActiveView('sales')}
                             className={`${getGridClasses(theme.layoutMode, 'sales')} ${theme.salesColor} rounded-[24px] p-6 border shadow-md group cursor-pointer relative transition-all duration-300 ${isDark(theme.salesColor) ? 'border-transparent' : 'border-slate-100 hover:border-slate-300'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark(theme.salesColor) ? 'bg-white/10 border-white/10 text-white' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                        <ShoppingCart size={24}/>
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-bold ${getTextColor(theme.salesColor)}`}>产销机会协同</h3>
                                        <p className={`text-sm ${getSubTextColor(theme.salesColor)}`}>S&OP Planning</p>
                                    </div>
                                </div>
                                <ArrowRight className={`${isDark(theme.salesColor) ? 'text-white/50 group-hover:text-white' : 'text-slate-300 group-hover:text-emerald-600'} transition-colors`} size={24}/>
                            </div>

                            <div className="flex gap-6 h-full">
                                {/* Left: Progress */}
                                <div className="flex-1 space-y-4">
                                     <div className={`rounded-xl p-3 border ${getCardInnerBg(theme.salesColor)}`}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className={`${isDark(theme.salesColor) ? 'text-white/70' : 'text-slate-500'}`}>Q4 交付目标</span>
                                            <span className="font-bold text-emerald-600">82%</span>
                                        </div>
                                        <div className={`w-full rounded-full h-2 ${isDark(theme.salesColor) ? 'bg-black/20' : 'bg-slate-200'}`}>
                                            <div className="h-full bg-emerald-500 rounded-full w-[82%]"></div>
                                        </div>
                                     </div>
                                     <div className="flex justify-between items-center px-2">
                                         <div className="text-center">
                                             <div className={`text-xs ${isDark(theme.salesColor) ? 'text-white/50' : 'text-slate-400'}`}>本月订单</div>
                                             <div className={`font-bold text-lg ${getTextColor(theme.salesColor)}`}>12.4GWh</div>
                                         </div>
                                         <div className={`h-8 w-px ${isDark(theme.salesColor) ? 'bg-white/20' : 'bg-slate-200'}`}></div>
                                         <div className="text-center">
                                             <div className={`text-xs ${isDark(theme.salesColor) ? 'text-white/50' : 'text-slate-400'}`}>预测偏差</div>
                                             <div className="font-bold text-lg text-emerald-600">3.2%</div>
                                         </div>
                                     </div>
                                </div>

                                {/* Right: Specific Delayed Orders */}
                                <div className={`flex-1 border-l pl-6 flex flex-col justify-center ${isDark(theme.salesColor) ? 'border-white/10' : 'border-slate-100'}`}>
                                    <div className={`text-xs font-bold uppercase mb-3 flex items-center gap-1 ${isDark(theme.salesColor) ? 'text-white/50' : 'text-slate-400'}`}>
                                        <Clock size={12}/> 交付风险订单
                                    </div>
                                    <div className="space-y-2">
                                        <div className={`flex items-center gap-3 text-sm p-2 rounded transition-colors -ml-2 ${isDark(theme.salesColor) ? 'group-hover:bg-white/10' : 'group-hover:bg-slate-50'}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                            <div className="flex-1">
                                                <div className={`font-bold ${getTextColor(theme.salesColor)}`}>小鹏 (XP-590)</div>
                                                <div className={`text-xs ${getSubTextColor(theme.salesColor)}`}>12,000 Packs</div>
                                            </div>
                                            <div className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">延期3天</div>
                                        </div>
                                        <div className={`flex items-center gap-3 text-sm p-2 rounded transition-colors -ml-2 ${isDark(theme.salesColor) ? 'group-hover:bg-white/10' : 'group-hover:bg-slate-50'}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                            <div className="flex-1">
                                                <div className={`font-bold ${getTextColor(theme.salesColor)}`}>广汽 (Y76)</div>
                                                <div className={`text-xs ${getSubTextColor(theme.salesColor)}`}>45,000 Cells</div>
                                            </div>
                                            <div className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">风险</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 6. Capacity: Bottom Right (NEW) */}
                        <div 
                             onClick={() => setActiveView('capacity')}
                             className={`${getGridClasses(theme.layoutMode, 'cap')} ${theme.capacityColor} rounded-[24px] p-6 border shadow-md group cursor-pointer relative transition-all duration-300 ${isDark(theme.capacityColor) ? 'border-transparent' : 'border-slate-100 hover:border-slate-300'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDark(theme.capacityColor) ? 'bg-white/10 border-white/10 text-white' : 'bg-orange-100 text-orange-600 border-orange-200'}`}>
                                        <BarChart4 size={24}/>
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-bold ${getTextColor(theme.capacityColor)}`}>12个月产能滚动预测</h3>
                                        <p className={`text-sm ${getSubTextColor(theme.capacityColor)}`}>Rolling Capacity Plan</p>
                                    </div>
                                </div>
                                <ArrowRight className={`${isDark(theme.capacityColor) ? 'text-white/50 group-hover:text-white' : 'text-slate-300 group-hover:text-orange-600'} transition-colors`} size={24}/>
                            </div>

                            <div className="h-40 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={CAP_FORECAST_MINI}>
                                        <XAxis dataKey="name" hide/>
                                        <RechartsTooltip 
                                            cursor={{fill: isDark(theme.capacityColor) ? 'rgba(255,255,255,0.1)' : '#f8fafc'}} 
                                            contentStyle={{fontSize: '12px'}}
                                        />
                                        <Bar dataKey="demand" radius={[2,2,0,0]} barSize={12}>
                                            {CAP_FORECAST_MINI.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.demand > entry.capacity ? '#ef4444' : '#cbd5e1'} />
                                            ))}
                                        </Bar>
                                        <Line type="monotone" dataKey="capacity" stroke="#f97316" strokeWidth={2} dot={false} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                                <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded ${isDark(theme.capacityColor) ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'}`}>
                                    M8 瓶颈预警
                                </div>
                            </div>
                            
                            <div className={`text-center text-xs font-bold mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${isDark(theme.capacityColor) ? 'text-white/80' : 'text-blue-600'}`}>
                                点击查看详细工艺分析 &rarr;
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* VIEW: FULL SCREEN MODULES */}
            {activeView !== 'home' && (
                <div className="h-full w-full">
                    {activeView === 'graph_full' && (
                         <>
                            {/* Overlay UI for Graph View */}
                            <div className="absolute top-4 left-4 z-10 pointer-events-none select-none">
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">供应链全景视图</h2>
                                <div className="flex flex-col gap-2 items-start mt-1">
                                    {/* Legend and Quick Actions */}
                                    <button 
                                        onClick={handleSelectAllRisks}
                                        className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-slate-200 px-4 py-2 rounded-full shadow-sm text-xs font-bold text-red-600 hover:bg-white transition-colors cursor-pointer pointer-events-auto"
                                    >
                                        <AlertTriangle size={14}/> 
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
                            
                            {/* Multi-Node Selection Bar */}
                            {selectedNodes.length > 0 && (
                                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-in slide-in-from-bottom-4 fade-in duration-300">
                                    <div className="bg-slate-900/90 backdrop-blur-md text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-8 border border-slate-700/50">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center font-bold text-base shadow-inner">
                                                {selectedNodes.length}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-base font-bold">已选异常节点</span>
                                                <span className="text-xs text-slate-400">点击图谱可继续添加</span>
                                            </div>
                                        </div>
                                        <div className="h-10 w-px bg-slate-700"></div>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setSelectedNodes([])}
                                                className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                <RotateCcw size={16} /> 清空
                                            </button>
                                            <button 
                                                onClick={() => setIsAnalysisModalOpen(true)}
                                                className="px-6 py-2.5 text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
                                            >
                                                <Play size={18} fill="currentColor" />
                                                执行联合推演
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                         </>
                    )}
                    {activeView === 'dashboard' && <DashboardPanel data={graphData} />}
                    {activeView === 'inventory' && <InventoryPanel />}
                    {activeView === 'sales' && <SalesPanel />}
                    {activeView === 'production' && <ProductionMonitorPanel />}
                    {activeView === 'capacity' && <CapacityPanel />}
                    {activeView === 'settings' && (
                        <SettingsPanel 
                            currentConfig={llmConfig}
                            themeConfig={theme}
                            onConfigSave={handleConfigSave}
                            onThemeChange={handleThemeChange}
                            onDataImport={handleDataImport}
                        />
                    )}
                    {(activeView === 'config' || activeView === 'scenario') && (
                        <div className="h-full bg-white">
                             <ConstraintPanel 
                                constraints={constraints} 
                                nodes={graphData.nodes}
                                onToggleConstraint={handleConstraintToggle}
                                onRunSimulation={handleRunSimulation}
                                onAnalyzeConstraint={handleAnalyzeConstraint}
                                onAddConstraint={handleAddConstraint}
                                isSimulating={isAiThinking}
                                initialTab={activeView === 'scenario' ? 'scenarios' : 'constraints'}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Overlays */}
            {isAnalysisModalOpen && selectedNodes.length > 0 && (
                <AnomalyAnalysisModal 
                    nodes={selectedNodes} 
                    graph={graphData} 
                    onClose={() => setIsAnalysisModalOpen(false)} 
                    onAddConstraint={handleAddConstraint}
                />
            )}

            {/* Chat Overlay (Global) */}
            {isChatOpen && (
                <div className="absolute right-6 bottom-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in">
                     <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
                         <span className="font-bold text-slate-700 flex items-center gap-2 text-base"><MessageSquare size={18}/> 智能助手</span>
                         <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-slate-600"><ChevronLeft className="rotate-[-90deg]" size={18}/></button>
                     </div>
                     <div className="h-[calc(100%-60px)]">
                        <AIChat 
                            messages={messages} 
                            onSendMessage={handleUserMessage}
                            isThinking={isAiThinking}
                        />
                     </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default App;
