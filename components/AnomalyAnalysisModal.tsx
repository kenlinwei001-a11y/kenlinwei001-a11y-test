import React, { useState, useRef, useEffect } from 'react';
import { NodeData, GraphData, ConstraintItem, ChatMessage } from '../types';
import { X, AlertTriangle, ArrowRight, Activity, Truck, Package, AlertCircle, Calculator, CheckCircle2, Clock, DollarSign, BarChart3, FileText, Bot, User, Send, BrainCircuit, ArrowLeft, GitCommit } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
  node: NodeData;
  graph: GraphData;
  onClose: () => void;
  onAddConstraint: (item: ConstraintItem) => void;
}

// Mock Types for the Plan
interface EmergencyPlan {
  id: string;
  name: string;
  type: 'conservative' | 'aggressive' | 'balanced';
  description: string;
  metrics: {
    cost: number; // in ten thousand CNY
    time: number; // days
    satisfaction: number; // 0-100
    risk: 'Low' | 'Medium' | 'High';
  };
  details: {
    retrofitCost: string;
    logisticsTime: string; // Cell to Pack
    rampUpPeriod: string;
    batchDelivery: boolean;
    referencedRules: string[];
  };
}

const AnomalyAnalysisModal: React.FC<Props> = ({ node, graph, onClose, onAddConstraint }) => {
  const [currentView, setCurrentView] = useState<'analysis' | 'planning'>('analysis');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlans, setGeneratedPlans] = useState<EmergencyPlan[]>([]);
  
  // Interactive Negotiation State
  const [selectedPlan, setSelectedPlan] = useState<EmergencyPlan | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Analyze Upstream (Incoming Links)
  const upstreamLinks = graph.links.filter(l => l.target === node.id);
  const upstreamData = upstreamLinks.map(l => {
    const sourceNode = graph.nodes.find(n => n.id === l.source);
    return { 
        id: sourceNode?.id,
        name: sourceNode?.name,
        type: sourceNode?.type,
        linkType: l.type,
        status: sourceNode?.status || 'normal',
        inventory: sourceNode?.inventoryLevel,
        eta: 'T+2' // Mock calculated ETA
    };
  });

  // 2. Analyze Downstream (Outgoing Links)
  const downstreamLinks = graph.links.filter(l => l.source === node.id);
  const downstreamData = downstreamLinks.map(l => {
    const targetNode = graph.nodes.find(n => n.id === l.target);
    return { 
        id: targetNode?.id,
        name: targetNode?.name,
        type: targetNode?.type,
        impactLevel: targetNode?.status === 'normal' ? 'Low' : 'High',
        priority: 'VIP', // Mock priority
        pendingOrders: targetNode?.activeOrders?.length || 0
    };
  });

  const handleGeneratePlans = () => {
    setIsGenerating(true);
    // Simulate AI Generation Delay
    setTimeout(() => {
        const plans: EmergencyPlan[] = [
            {
                id: 'PLAN-A',
                name: '方案A: 跨基地紧急调货 (激进保交付)',
                type: 'aggressive',
                description: '启用 "宜宾基地" 备用库存，通过空运直发客户产线。虽成本极高，但可确保战略客户零延期。',
                metrics: { cost: 120, time: 2, satisfaction: 98, risk: 'Low' },
                details: {
                    retrofitCost: '0 (无改造)',
                    logisticsTime: '12h (宜宾->客户/空运)',
                    rampUpPeriod: 'N/A',
                    batchDelivery: false,
                    referencedRules: ['规则C2: 战略客户优先分配', '规则L1: 跨基地协同允许']
                }
            },
            {
                id: 'PLAN-B',
                name: '方案B: 本地产线技改转产 (平衡型)',
                type: 'balanced',
                description: '对本地 "LFP-Line-2" 进行快速技改以兼容当前型号。需停机3天，后续通过分批交付缓解压力。',
                metrics: { cost: 45, time: 5, satisfaction: 85, risk: 'Medium' },
                details: {
                    retrofitCost: '35万 (模组线治具切换)',
                    logisticsTime: '4h (本地园区短驳)',
                    rampUpPeriod: '3天 (50% -> 80% -> 100%)',
                    batchDelivery: true,
                    referencedRules: ['规则P4: 产线专线专用例外条款', '规则C5: 最小批量限制']
                }
            },
            {
                id: 'PLAN-C',
                name: '方案C: 供应链顺延排产 (保守降本)',
                type: 'conservative',
                description: '等待上游原料到位，维持原生产计划。与客户协商延期交付，赔付违约金，避免额外投入。',
                metrics: { cost: 15, time: 12, satisfaction: 60, risk: 'High' },
                details: {
                    retrofitCost: '0',
                    logisticsTime: '3天 (标准陆运)',
                    rampUpPeriod: 'N/A (维持现状)',
                    batchDelivery: false,
                    referencedRules: ['规则C1: 订单锁定不做调整', '规则F2: 成本控制优先']
                }
            }
        ];
        setGeneratedPlans(plans);
        setIsGenerating(false);
        setCurrentView('planning');
    }, 1500);
  };

  const handleSelectPlan = (plan: EmergencyPlan) => {
      setSelectedPlan(plan);
      setChatMessages([{
          id: 'init',
          role: 'model',
          content: `您已选择 **${plan.name}**。\n\n该方案预计成本 ${plan.metrics.cost}万，风险等级 ${plan.metrics.risk}。\n\n如果您认为该方案有优化的空间，或者您希望添加新的业务约束（例如："以后必须优先保证VIP客户"、"成本超过100万需总经理审批"），请直接告诉我，我会自动将规则沉淀到系统的**推演知识库**中。`,
          timestamp: new Date()
      }]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendChatMessage = async () => {
      if (!chatInput.trim() || isChatThinking) return;
      
      const userText = chatInput;
      setChatInput('');
      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: userText, timestamp: new Date() };
      setChatMessages(prev => [...prev, userMsg]);
      setIsChatThinking(true);

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
          
          const systemPrompt = `
          You are a specialized Supply Chain Decision Assistant embedded in an anomaly resolution workflow.
          Context: User has selected an emergency plan: "${selectedPlan?.name}".
          
          Goal:
          1. Discuss the feasibility of the plan.
          2. **CRITICAL**: If the user mentions a business rule, constraint, or logic preference (e.g., "Always air freight for VIPs", "Never delay NCM orders"), you MUST use the 'learn_rule' tool to extract and save it.
          3. If the user just chats, respond normally.
          `;
    
          const learnRuleTool = {
              functionDeclarations: [
                  {
                      name: "learn_rule",
                      description: "Extracts a business rule from the conversation to save to the knowledge base.",
                      parameters: {
                          type: Type.OBJECT,
                          properties: {
                              label: { type: Type.STRING, description: "Short title (e.g., 'VIP Air Freight')." },
                              description: { type: Type.STRING, description: "Full rule description." },
                              impactLevel: { type: Type.STRING, enum: ["low", "medium", "high"] },
                              pseudoLogic: { type: Type.STRING, description: "Pseudo-code logic." }
                          },
                          required: ["label", "description", "impactLevel"]
                      }
                  }
              ]
          };
    
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-latest',
            contents: [
                { role: 'user', parts: [{ text: systemPrompt + "\nUser: " + userText }] }
            ],
            config: {
                tools: [learnRuleTool],
            }
          });
    
          const functionCalls = response.functionCalls;
          
          if (functionCalls && functionCalls.length > 0) {
              const call = functionCalls[0];
              if (call.name === 'learn_rule') {
                  const args = call.args as any;
                  
                  const newRule: ConstraintItem = {
                      id: `rule-${Date.now()}`,
                      label: args.label,
                      description: args.description,
                      impactLevel: args.impactLevel,
                      enabled: true,
                      source: 'ai',
                      logic: { 
                          relationType: 'TRIGGER', 
                          actionDescription: args.pseudoLogic || 'Adaptive Logic'
                      }
                  };
                  
                  onAddConstraint(newRule);
    
                  setChatMessages(prev => [...prev, { 
                      id: Date.now().toString(), 
                      role: 'model', 
                      content: `✨ **已自动识别并沉淀规则**\n\n> **${args.label}**\n> ${args.description}\n\n该规则已加入推演知识库，后续计算将自动应用此约束。`, 
                      timestamp: new Date() 
                  }]);
              }
          } else {
              setChatMessages(prev => [...prev, { 
                  id: Date.now().toString(), 
                  role: 'model', 
                  content: response.text || "已收到您的反馈。", 
                  timestamp: new Date() 
              }]);
          }

      } catch (e) {
          console.error(e);
          setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "网络连接异常，无法处理。", timestamp: new Date() }]);
      } finally {
          setIsChatThinking(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-[1100px] h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${node.status === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        异常溯源与智能决策中心
                        {currentView === 'planning' && <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">应急预案生成模式</span>}
                    </h2>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs font-bold border border-slate-200">{node.id}</span>
                        <span className="font-medium text-slate-700">{node.name}</span>
                        <span>|</span>
                        <span>关联规则库版本: <span className="text-blue-600 font-bold">v2024.10.26</span></span>
                    </div>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden bg-slate-50/50 relative">
            
            {/* VIEW 1: Analysis Data Tables */}
            {currentView === 'analysis' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 p-6 overflow-y-auto h-full">
                    
                    {/* Top Section: The Anomaly Node */}
                    <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm flex gap-6 items-start relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-5">
                            <AlertCircle size={120} />
                         </div>
                         <div className="flex-1 space-y-4">
                            <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                <Activity size={16} className="text-red-500"/> 当前异常核心 (Root Cause)
                            </h3>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                    <div className="text-xs text-slate-500">当前库存</div>
                                    <div className="text-xl font-bold text-red-600">{node.inventoryLevel?.toLocaleString() || '--'} <span className="text-xs text-slate-400 font-normal">Ah</span></div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                    <div className="text-xs text-slate-500">安全水位线</div>
                                    <div className="text-xl font-bold text-slate-700">2,000 <span className="text-xs text-slate-400 font-normal">Ah</span></div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                    <div className="text-xs text-slate-500">缺口预估</div>
                                    <div className="text-xl font-bold text-red-600">-{(2000 - (node.inventoryLevel || 0)).toLocaleString()}</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                    <div className="text-xs text-slate-500">预计停线时间</div>
                                    <div className="text-xl font-bold text-slate-700">14 <span className="text-xs text-slate-400 font-normal">Hrs</span></div>
                                </div>
                            </div>
                         </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        {/* Left: Upstream Data Table */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Truck size={16} className="text-blue-500"/> 上游供应状态 (Upstream)
                            </h3>
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3">节点名称</th>
                                            <th className="px-4 py-3">类型</th>
                                            <th className="px-4 py-3">状态</th>
                                            <th className="px-4 py-3 text-right">预估到达</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {upstreamData.length > 0 ? upstreamData.map((d, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-700">{d.name}</td>
                                                <td className="px-4 py-3 text-xs text-slate-500">{d.linkType}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${d.status === 'normal' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {d.status === 'normal' ? '正常' : '异常'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-600 font-mono">{d.eta}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-xs">无上游关联数据</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Right: Downstream Data Table */}
                        <div className="space-y-3">
                             <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Package size={16} className="text-purple-500"/> 下游交付影响 (Downstream)
                            </h3>
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3">客户/基地</th>
                                            <th className="px-4 py-3">客户等级</th>
                                            <th className="px-4 py-3">受累订单</th>
                                            <th className="px-4 py-3 text-right">影响程度</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {downstreamData.length > 0 ? downstreamData.map((d, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-700">{d.name}</td>
                                                <td className="px-4 py-3">
                                                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded font-bold">{d.priority}</span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{d.pendingOrders} 单</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`font-bold ${d.impactLevel === 'High' ? 'text-red-600' : 'text-slate-600'}`}>
                                                        {d.impactLevel}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-xs">无下游关联数据</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW 2: Plan Generation & Negotiation */}
            {currentView === 'planning' && (
                <div className="h-full flex flex-col p-6 overflow-hidden animate-in fade-in slide-in-from-right-4">
                     
                     {/* If no plan selected, show grid */}
                     {!selectedPlan ? (
                         <>
                             <div className="flex items-center gap-2 mb-4 shrink-0">
                                <Calculator size={18} className="text-blue-600"/>
                                <h3 className="text-lg font-bold text-slate-800">智能决策推演结果 (3 Scenarios)</h3>
                             </div>
                             <div className="grid grid-cols-3 gap-6 overflow-y-auto">
                                {generatedPlans.map((plan) => (
                                    <div key={plan.id} className={`relative flex flex-col bg-white rounded-xl border-2 transition-all hover:shadow-lg ${
                                        plan.type === 'aggressive' ? 'border-amber-200 hover:border-amber-400' : 
                                        plan.type === 'balanced' ? 'border-blue-200 hover:border-blue-400' : 
                                        'border-slate-200 hover:border-slate-400'
                                    }`}>
                                        {/* Plan Content (Same as before) */}
                                        <div className={`p-4 border-b ${
                                            plan.type === 'aggressive' ? 'bg-amber-50 border-amber-100' : 
                                            plan.type === 'balanced' ? 'bg-blue-50 border-blue-100' : 
                                            'bg-slate-50 border-slate-100'
                                        }`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                                    plan.type === 'aggressive' ? 'bg-amber-200 text-amber-800' : 
                                                    plan.type === 'balanced' ? 'bg-blue-200 text-blue-800' : 
                                                    'bg-slate-200 text-slate-700'
                                                }`}>{plan.id}</span>
                                                {plan.type === 'balanced' && <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">AI 推荐</span>}
                                            </div>
                                            <h4 className="font-bold text-slate-800 leading-tight">{plan.name}</h4>
                                        </div>

                                        <div className="p-4 grid grid-cols-2 gap-4 border-b border-slate-100">
                                            <div>
                                                <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1"><DollarSign size={10}/> 预估成本</div>
                                                <div className="text-lg font-bold text-slate-700">{plan.metrics.cost}<span className="text-xs font-normal text-slate-400">万</span></div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1"><Clock size={10}/> 交付周期</div>
                                                <div className="text-lg font-bold text-slate-700">{plan.metrics.time}<span className="text-xs font-normal text-slate-400">天</span></div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1"><CheckCircle2 size={10}/> 客户满意度</div>
                                                <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
                                                    <div className={`h-2 rounded-full ${plan.metrics.satisfaction > 90 ? 'bg-emerald-500' : plan.metrics.satisfaction > 70 ? 'bg-blue-500' : 'bg-red-400'}`} style={{width: `${plan.metrics.satisfaction}%`}}></div>
                                                </div>
                                                <div className="text-xs font-bold mt-0.5 text-right">{plan.metrics.satisfaction}/100</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1"><AlertTriangle size={10}/> 风险指数</div>
                                                <div className={`text-sm font-bold ${plan.metrics.risk === 'High' ? 'text-red-600' : plan.metrics.risk === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {plan.metrics.risk}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 space-y-3 flex-1 bg-slate-50/30">
                                            <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                                                <span className="text-slate-500">产线改造成本</span>
                                                <span className="font-medium text-slate-800">{plan.details.retrofitCost}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                                                <span className="text-slate-500">物流周期(电芯-Pack)</span>
                                                <span className="font-medium text-slate-800">{plan.details.logisticsTime}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                                                <span className="text-slate-500">爬坡约束</span>
                                                <span className="font-medium text-slate-800">{plan.details.rampUpPeriod}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                                                <span className="text-slate-500">是否分批交付</span>
                                                <span className={`font-bold ${plan.details.batchDelivery ? 'text-blue-600' : 'text-slate-600'}`}>
                                                    {plan.details.batchDelivery ? '是 (分批)' : '否 (整单)'}
                                                </span>
                                            </div>
                                            
                                            <div className="pt-2">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                                    <FileText size={10}/> 引用配置规则
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {plan.details.referencedRules.map((rule, idx) => (
                                                        <span key={idx} className="text-[9px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 truncate max-w-full">
                                                            {rule}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="p-4 pt-2">
                                            <button 
                                                onClick={() => handleSelectPlan(plan)}
                                                className={`w-full py-2 text-sm font-bold rounded-lg transition-colors shadow-sm ${
                                                plan.type === 'balanced' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700'
                                            }`}>
                                                选择此方案并推演
                                            </button>
                                        </div>
                                    </div>
                                ))}
                             </div>
                         </>
                     ) : (
                         // SPLIT VIEW: Selected Plan + Chat
                         <div className="flex h-full gap-6">
                            {/* Left: The Selected Plan Details (Read-only view) */}
                            <div className="w-1/3 flex flex-col h-full bg-white rounded-xl border-2 border-slate-200 shadow-md overflow-hidden shrink-0">
                                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                    <button onClick={() => setSelectedPlan(null)} className="flex items-center gap-1 text-slate-500 text-xs font-bold hover:text-blue-600">
                                        <ArrowLeft size={12}/> 返回列表
                                    </button>
                                    <span className="text-xs font-bold text-blue-600">当前选中</span>
                                </div>
                                <div className="p-5 flex-1 overflow-y-auto">
                                    <h4 className="text-lg font-bold text-slate-800 mb-2">{selectedPlan.name}</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        {selectedPlan.description}
                                    </p>
                                    
                                    <div className="space-y-4">
                                         <div>
                                            <div className="text-xs font-bold text-slate-400 uppercase mb-2">关键指标</div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                                    <div className="text-[10px] text-slate-500">预估成本</div>
                                                    <div className="text-lg font-bold text-slate-700">{selectedPlan.metrics.cost}万</div>
                                                </div>
                                                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                                    <div className="text-[10px] text-slate-500">风险等级</div>
                                                    <div className={`text-lg font-bold ${selectedPlan.metrics.risk === 'High' ? 'text-red-600' : 'text-emerald-600'}`}>{selectedPlan.metrics.risk}</div>
                                                </div>
                                            </div>
                                         </div>
                                         
                                         <div>
                                             <div className="text-xs font-bold text-slate-400 uppercase mb-2">执行细节</div>
                                             <ul className="space-y-2 text-xs text-slate-700">
                                                <li className="flex justify-between border-b border-slate-50 pb-1"><span>产线改造:</span> <span className="font-medium">{selectedPlan.details.retrofitCost}</span></li>
                                                <li className="flex justify-between border-b border-slate-50 pb-1"><span>物流时效:</span> <span className="font-medium">{selectedPlan.details.logisticsTime}</span></li>
                                                <li className="flex justify-between border-b border-slate-50 pb-1"><span>分批交付:</span> <span className="font-medium">{selectedPlan.details.batchDelivery ? '是' : '否'}</span></li>
                                             </ul>
                                         </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Negotiation Chat */}
                            <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
                                <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50/50 to-white flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                            <Bot size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">方案推演与规则沉淀</h4>
                                            <p className="text-[10px] text-slate-500">AI 可自动从对话中提取并保存业务规则</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100 text-[10px] font-bold">
                                        <BrainCircuit size={12}/>
                                        知识库联动中
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                                    {chatMessages.map((msg) => (
                                        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'model' ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                                                {msg.role === 'model' ? <Bot size={16} /> : <User size={16} />}
                                            </div>
                                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                                msg.role === 'model' ? 'bg-white text-slate-700 border border-slate-100' : 'bg-blue-600 text-white'
                                            }`}>
                                                {/* Special styling for extracted rules confirmation */}
                                                {msg.content.includes('已自动识别并沉淀规则') ? (
                                                     <div>
                                                         <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-100 text-purple-700 font-bold">
                                                             <GitCommit size={16}/> 规则已沉淀 (Rule Committed)
                                                         </div>
                                                         <div className="whitespace-pre-wrap">{msg.content.replace('✨ **已自动识别并沉淀规则**', '').trim()}</div>
                                                     </div>
                                                ) : (
                                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {isChatThinking && (
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                                <Bot size={16} />
                                            </div>
                                            <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="p-4 bg-white border-t border-slate-200">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            placeholder="输入您的调整意见 (如: '以后必须优先保证VIP客户')..."
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                                        />
                                        <button 
                                            onClick={handleSendChatMessage}
                                            disabled={!chatInput.trim() || isChatThinking}
                                            className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                         </div>
                     )}
                </div>
            )}

        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
            <div className="flex items-center text-xs text-slate-500 gap-4">
                {currentView === 'analysis' ? (
                     <div className="flex items-center gap-2">
                         <BarChart3 size={16} className="text-slate-400"/>
                         <span>当前展示实时监控数据，点击生成预案进行深度推演。</span>
                     </div>
                ) : (
                    <button onClick={() => {
                        if (selectedPlan) setSelectedPlan(null); // Back to grid
                        else setCurrentView('analysis'); // Back to analysis
                    }} className="flex items-center gap-1 text-blue-600 hover:underline font-medium">
                        <ArrowRight size={14} className="rotate-180"/> 
                        {selectedPlan ? '返回方案列表' : '返回数据监控视图'}
                    </button>
                )}
            </div>

            <div className="flex gap-3">
                <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    关闭窗口
                </button>
                {currentView === 'analysis' && (
                    <button 
                        onClick={handleGeneratePlans}
                        disabled={isGenerating}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                正在运算全量数据...
                            </>
                        ) : (
                            <>
                                <Calculator size={18} />
                                生成应急预案 (3种)
                            </>
                        )}
                    </button>
                )}
                {currentView === 'planning' && selectedPlan && (
                     <button className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md transition-colors flex items-center gap-2">
                        <CheckCircle2 size={18} />
                        确认执行并导出
                    </button>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default AnomalyAnalysisModal;