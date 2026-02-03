

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  LayoutDashboard, Network, TrendingUp, Package, ShoppingCart, 
  Factory, Zap, Settings, Menu, Sparkles, X, MessageSquare,
  CalendarRange, BarChart3
} from 'lucide-react';

import SupplyChainGraph from './components/SupplyChainGraph';
import Tooltip from './components/Tooltip';
import ConstraintPanel from './components/ConstraintPanel';
import AIChat from './components/AIChat';
import DashboardPanel from './components/DashboardPanel';
import CapacityPanel from './components/CapacityPanel';
import InventoryPanel from './components/InventoryPanel';
import SalesPanel from './components/SalesPanel';
import ProductionMonitorPanel from './components/ProductionMonitorPanel';
import SettingsPanel from './components/SettingsPanel';
import { AnomalyAnalysisModal } from './components/AnomalyAnalysisModal';
import { MOCK_DATA, INITIAL_CONSTRAINTS } from './constants';
import { GraphData, NodeData, ChatMessage, LLMConfig, ThemeConfig, ScenarioConfig, GlobalMode } from './types';
import { db } from './services/db';
import { executeText2SQL, executeGraphTopology } from './services/mcp';

export default function App() {
  // --- State ---
  const [activeView, setActiveView] = useState('dashboard');
  const [graphData] = useState<GraphData>(MOCK_DATA);
  const [hoveredNode, setHoveredNode] = useState<{ node: NodeData | null, x: number, y: number }>({ node: null, x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  
  // Hover Timer Ref for Tooltip Stability
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false); // Closed by default
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', content: '您好！我是供应链智能决策助手。您可以问我关于库存、订单或风险的任何问题。', timestamp: new Date() }
  ]);
  const [isThinking, setIsThinking] = useState(false);

  // Constraints & Simulation
  const [constraints, setConstraints] = useState(INITIAL_CONSTRAINTS);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showAnomalyModal, setShowAnomalyModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [simulationConfig, setSimulationConfig] = useState<ScenarioConfig[]>([]);

  // Configs
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
      provider: 'gemini',
      apiKey: process.env.API_KEY || '',
      modelName: 'gemini-3-flash-preview'
  });
  
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
      layoutMode: 'bento',
      globalMode: 'light',
      heroColor: 'bg-white',
      operationsColor: 'bg-white',
      productionColor: 'bg-white',
      inventoryColor: 'bg-white',
      salesColor: 'bg-white',
      capacityColor: 'bg-white'
  });

  // --- Layout Calculation ---
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate dynamic content width
  const sidebarWidth = isSidebarCollapsed ? 80 : 256;
  const rightPanelWidth = (isChatOpen && activeView !== 'settings' && activeView !== 'scenario') ? 384 : 0;
  const contentWidth = windowSize.width - sidebarWidth - rightPanelWidth;

  // --- Effects ---
  useEffect(() => {
    // Initialize DB
    db.seed();
    
    // Inject global API key if present and not set in config
    if (process.env.API_KEY && !llmConfig.apiKey) {
        setLlmConfig(prev => ({ ...prev, apiKey: process.env.API_KEY! }));
    }

    // Load Theme from LocalStorage
    try {
        const savedTheme = localStorage.getItem('app_theme_config');
        if (savedTheme) {
            setThemeConfig(JSON.parse(savedTheme));
        }
    } catch (e) {
        console.error("Failed to load theme", e);
    }
  }, []);

  // Save Theme Persistence
  useEffect(() => {
      localStorage.setItem('app_theme_config', JSON.stringify(themeConfig));
  }, [themeConfig]);

  // --- Theme Logic ---
  const currentThemeStyles = useMemo(() => {
      switch(themeConfig.globalMode) {
          case 'dark':
              return {
                  appBg: 'bg-slate-950',
                  sidebarBg: 'bg-slate-900 border-slate-800',
                  sidebarText: 'text-slate-400',
                  sidebarItemHover: 'hover:bg-slate-800 hover:text-slate-200',
                  contentBg: 'bg-slate-950',
                  headerBorder: 'border-slate-800'
              };
          case 'warm':
              return {
                  appBg: 'bg-[#fafaf9]', // stone-50
                  sidebarBg: 'bg-[#fffbeb] border-orange-100', // amber-50
                  sidebarText: 'text-slate-600',
                  sidebarItemHover: 'hover:bg-orange-100 hover:text-orange-900',
                  contentBg: 'bg-[#fafaf9]',
                  headerBorder: 'border-orange-100'
              };
          case 'cool':
              return {
                  appBg: 'bg-[#f0f9ff]', // sky-50
                  sidebarBg: 'bg-white border-sky-100',
                  sidebarText: 'text-slate-600',
                  sidebarItemHover: 'hover:bg-sky-50 hover:text-sky-900',
                  contentBg: 'bg-[#f0f9ff]',
                  headerBorder: 'border-sky-100'
              };
          case 'fresh':
              return {
                  appBg: 'bg-[#f0fdf4]', // green-50
                  sidebarBg: 'bg-white border-green-100',
                  sidebarText: 'text-slate-600',
                  sidebarItemHover: 'hover:bg-green-50 hover:text-green-900',
                  contentBg: 'bg-[#f0fdf4]',
                  headerBorder: 'border-green-100'
              };
          default: // light
              return {
                  appBg: 'bg-slate-50',
                  sidebarBg: 'bg-white border-slate-200',
                  sidebarText: 'text-slate-500',
                  sidebarItemHover: 'hover:bg-slate-100 hover:text-slate-900',
                  contentBg: 'bg-slate-50',
                  headerBorder: 'border-slate-100'
              };
      }
  }, [themeConfig.globalMode]);

  // --- Handlers ---

  const handleGraphNodeHover = (node: NodeData | null, x: number, y: number) => {
      if (node) {
          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          setHoveredNode({ node, x, y });
      } else {
          // Delay clearing to allow moving mouse to tooltip
          hoverTimeoutRef.current = setTimeout(() => {
              setHoveredNode({ node: null, x: 0, y: 0 });
          }, 200); 
      }
  };

  const handleTooltipEnter = () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleTooltipLeave = () => {
      hoverTimeoutRef.current = setTimeout(() => {
          setHoveredNode({ node: null, x: 0, y: 0 });
      }, 200);
  };

  const handleNodeClick = (node: NodeData) => {
      setSelectedNode(node);
      // Automatically switch to context relevant view or open modal for anomalies
      // Expanded condition: Critical, Warning, or any node with active alerts
      if (node.status === 'critical' || node.status === 'warning' || (node.activeAlerts && node.activeAlerts > 0)) {
          setShowAnomalyModal(true);
      }
  };

  // Dedicated handler for "Drill Down" action from Tooltip (Force Open)
  const handleDrillDown = (node: NodeData) => {
      setSelectedNode(node);
      setShowAnomalyModal(true);
  };

  const handleSendMessage = async (text: string, activeMCPs: string[]) => {
      // Add User Message
      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
      setChatMessages(prev => [...prev, userMsg]);
      setIsThinking(true);

      try {
          let toolResult = "";

          // 1. Execute MCP Tools if enabled
          if (activeMCPs.includes('text2sql')) {
              const { result, explanation } = await executeText2SQL(text, graphData.nodes.map(n => n.name));
              if (result) {
                  toolResult += `\n[Database Query]: ${explanation}\n[Result]: ${JSON.stringify(result, null, 2)}\n`;
              }
          }
          if (activeMCPs.includes('graph_topology') && (text.includes('上游') || text.includes('下游') || text.includes('影响'))) {
               // Simple heuristic to find a node mentioned in text
               const mentionedNode = graphData.nodes.find(n => text.includes(n.name));
               if (mentionedNode) {
                   const { result, explanation } = await executeGraphTopology(mentionedNode.name);
                   toolResult += `\n[Topology Analysis]: ${explanation}\n[Result]: ${JSON.stringify(result, null, 2)}\n`;
               }
          }

          // 2. Prepare Prompt
          // Only provide summary data to avoid token limits
          const nodeSummary = graphData.nodes.map(n => `${n.name} (${n.type}, Status: ${n.status})`).join(', ');
          
          const systemPrompt = `You are a Supply Chain Expert AI. 
          Current System State:
          - Nodes: ${nodeSummary}
          - Tool Results: ${toolResult}
          
          Answer the user's question based on the tool results and system state.
          If tool results are present, explicitly reference them.
          Keep answers concise and professional.`;

          let responseText = "";

          // 3. Call LLM
          if (llmConfig.provider === 'gemini') {
              // Ensure we use the API key from process.env if available, or the one in config (fallback)
              const apiKeyToUse = process.env.API_KEY || llmConfig.apiKey;
              
              if (!apiKeyToUse) {
                  responseText = "Error: API Key is missing. Please configure it in settings or environment.";
              } else {
                  const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
                  const response = await ai.models.generateContent({
                      model: llmConfig.modelName || 'gemini-3-flash-preview',
                      contents: systemPrompt + "\nUser: " + text,
                  });
                  responseText = response.text || "No response text";
              }
          } else {
              // Fallback / Mock for other providers
              await new Promise(r => setTimeout(r, 1000));
              responseText = `[${llmConfig.provider}] Received: ${text}. \nTool Data: ${toolResult ? 'Used' : 'None'}.`;
          }

          const botMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'model', content: responseText, timestamp: new Date() };
          setChatMessages(prev => [...prev, botMsg]);

      } catch (error) {
          console.error("LLM Error:", error);
          const errorMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'model', content: "Sorry, I encountered an error processing your request.", timestamp: new Date() };
          setChatMessages(prev => [...prev, errorMsg]);
      } finally {
          setIsThinking(false);
      }
  };

  const handleRunSimulation = (scenarios: ScenarioConfig[]) => {
      setIsSimulating(true);
      setSimulationConfig(scenarios);
      
      // Mock Simulation Delay
      setTimeout(() => {
          setIsSimulating(false);
          setShowAnomalyModal(true); // Show results
      }, 2000);
  };

  // --- Render Helpers ---

  const renderContent = () => {
      switch (activeView) {
          case 'dashboard': return (
              <DashboardPanel 
                data={graphData} 
                themeConfig={themeConfig} 
                onNavigate={setActiveView} 
              />
          );
          case 'graph': return (
              <SupplyChainGraph 
                data={graphData} 
                width={contentWidth} // Dynamic Width
                height={windowSize.height}
                onNodeHover={handleGraphNodeHover}
                onNodeClick={handleNodeClick}
                selectedNodeIds={selectedNode ? [selectedNode.id] : []}
                onBackgroundClick={() => setSelectedNode(null)}
              />
          );
          case 'capacity': return <CapacityPanel data={graphData} />; // Passed Data
          case 'inventory': return <InventoryPanel data={graphData} />;
          case 'sales': return <SalesPanel data={graphData} />; // Passed Data
          case 'production': return <ProductionMonitorPanel data={graphData} />;
          case 'scenario': return (
              <ConstraintPanel 
                constraints={constraints}
                nodes={graphData.nodes}
                onToggleConstraint={() => {}} 
                onRunSimulation={handleRunSimulation}
                onAnalyzeConstraint={async () => ({})}
                onAddConstraint={(c) => setConstraints(prev => {
                     // Simplified logic for demo
                     const newConstraints = [...prev];
                     // Assumes adding to first category for simplicity in this reconstruction
                     if(newConstraints.length > 0) {
                         newConstraints[0].items.push(c);
                     }
                     return newConstraints;
                })}
                onDataImport={() => {}}
                isSimulating={isSimulating}
                initialTab='scenarios'
              />
          );
          case 'settings': return (
              <SettingsPanel 
                currentConfig={llmConfig} 
                themeConfig={themeConfig}
                onConfigSave={setLlmConfig}
                onThemeChange={setThemeConfig}
                onDataImport={() => {}}
              />
          );
          default: return (
              <DashboardPanel 
                data={graphData} 
                themeConfig={themeConfig} 
                onNavigate={setActiveView} 
              />
          );
      }
  };

  const SidebarItem = ({ id, label, icon: Icon }: any) => (
      <button 
        onClick={() => setActiveView(id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-1 group relative ${
            activeView === id 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
            : `${currentThemeStyles.sidebarText} ${currentThemeStyles.sidebarItemHover}`
        }`}
      >
          <Icon size={20} />
          {!isSidebarCollapsed && <span className="font-bold text-sm">{label}</span>}
          {isSidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {label}
              </div>
          )}
      </button>
  );

  return (
    <div className={`flex h-screen overflow-hidden ${currentThemeStyles.appBg}`}>
      {/* Sidebar - Increased z-index to 50 to ensure clickability */}
      <div className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} ${currentThemeStyles.sidebarBg} border-r flex flex-col transition-all duration-300 shrink-0 z-50 shadow-lg relative`}>
          {/* Logo / Header - Explicit Button for Home */}
          <button 
            className={`w-full p-6 flex items-center gap-3 border-b ${currentThemeStyles.headerBorder} cursor-pointer hover:bg-black/5 transition-colors text-left focus:outline-none`}
            onClick={() => setActiveView('dashboard')}
            title="回到首页 / 全局看板 (Back to Dashboard)"
          >
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Network size={20} />
              </div>
              {!isSidebarCollapsed && (
                  <div>
                      <h1 className={`font-bold text-lg leading-tight ${themeConfig.globalMode === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>LinkFlow</h1>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${themeConfig.globalMode === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Supply Chain AI</p>
                  </div>
              )}
          </button>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="mb-6">
                  {!isSidebarCollapsed && <div className={`text-xs font-bold uppercase mb-3 px-2 ${themeConfig.globalMode === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>Core Modules</div>}
                  <SidebarItem id="dashboard" label="运营看板" icon={LayoutDashboard} />
                  <SidebarItem id="graph" label="全景拓扑" icon={Network} />
                  <SidebarItem id="sales" label="销售预测" icon={TrendingUp} />
                  <SidebarItem id="capacity" label="产能规划" icon={CalendarRange} />
                  <SidebarItem id="inventory" label="库存监控" icon={Package} />
                  <SidebarItem id="production" label="产线监视" icon={Factory} />
              </div>
              
              <div>
                  {!isSidebarCollapsed && <div className={`text-xs font-bold uppercase mb-3 px-2 ${themeConfig.globalMode === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>Simulation</div>}
                  <SidebarItem id="scenario" label="沙盘推演" icon={Zap} />
              </div>
          </div>

          <div className={`p-4 border-t ${currentThemeStyles.headerBorder}`}>
              <SidebarItem id="settings" label="系统设置" icon={Settings} />
              <button 
                onClick={(e) => { e.stopPropagation(); setIsSidebarCollapsed(!isSidebarCollapsed); }}
                className={`w-full flex items-center justify-center p-2 mt-2 rounded-lg transition-colors ${currentThemeStyles.sidebarText} ${currentThemeStyles.sidebarItemHover}`}
              >
                  <Menu size={20} />
              </button>
          </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col relative overflow-hidden ${currentThemeStyles.contentBg}`}>
          {renderContent()}
          
          {/* Graph Tooltip - Passed handleDrillDown for explicit action */}
          {activeView === 'graph' && hoveredNode.node && (
              <Tooltip 
                node={hoveredNode.node} 
                position={{ x: hoveredNode.x, y: hoveredNode.y }} 
                onDrillDown={handleDrillDown}
                onMouseEnter={handleTooltipEnter}
                onMouseLeave={handleTooltipLeave}
              />
          )}
      </div>

      {/* Right Sidebar (Chat or Constraints) - Changed from absolute to flex item */}
      {isChatOpen && activeView !== 'settings' && activeView !== 'scenario' && (
          <div className="w-96 bg-white border-l border-slate-200 shadow-xl z-30 shrink-0 flex flex-col animate-in slide-in-from-right duration-300">
              <div className="flex justify-end p-2 bg-slate-50 border-b border-slate-100">
                  <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-slate-200 rounded text-slate-400">
                      <X size={16}/>
                  </button>
              </div>
              <AIChat 
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                isThinking={isThinking}
              />
          </div>
      )}

      {/* Chat Toggle FAB */}
      {activeView !== 'settings' && activeView !== 'scenario' && !isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-8 right-8 z-40 p-4 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-110 active:scale-95"
            title="Open AI Assistant"
          >
             <Sparkles size={24} />
          </button>
      )}

      {/* Modals */}
      {showAnomalyModal && (
          <AnomalyAnalysisModal 
            nodes={selectedNode ? [selectedNode] : graphData.nodes.filter(n => n.status === 'critical')}
            graph={graphData}
            mode={isSimulating ? 'simulation' : 'analysis'}
            onClose={() => setShowAnomalyModal(false)}
            onAddConstraint={(c) => {
                 setConstraints(prev => {
                     // Add logic to incorporate new constraints
                     return [...prev]; 
                 });
            }}
          />
      )}
    </div>
  );
}
