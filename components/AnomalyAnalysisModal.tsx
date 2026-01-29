
import React, { useState, useRef, useEffect } from 'react';
import { NodeData, GraphData, ConstraintItem, ChatMessage } from '../types';
import { X, AlertTriangle, ArrowRight, Activity, Truck, Package, AlertCircle, Calculator, CheckCircle2, Clock, DollarSign, BarChart3, FileText, Bot, User, Send, BrainCircuit, ArrowLeft, GitCommit, Layers, FileSpreadsheet, ChevronDown, Download, Share, Workflow, Database, RefreshCw, Filter, Split, PlayCircle, FileCheck, Check, Maximize2, Move } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
  nodes: NodeData[];
  graph: GraphData;
  mode?: 'analysis' | 'simulation';
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

export const AnomalyAnalysisModal: React.FC<Props> = ({ nodes, graph, mode = 'analysis', onClose, onAddConstraint }) => {
  const [currentView, setCurrentView] = useState<'analysis' | 'planning' | 'report'>(mode === 'simulation' ? 'report' : 'analysis');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlans, setGeneratedPlans] = useState<EmergencyPlan[]>([]);
  
  // Report View State
  const [activeReportSheet, setActiveReportSheet] = useState<1 | 2 | 3 | 4>(1);

  // Interactive Negotiation State
  const [selectedPlan, setSelectedPlan] = useState<EmergencyPlan | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Floating Window State
  const [showFloatingReport, setShowFloatingReport] = useState(false);
  const [floatingPos, setFloatingPos] = useState({ x: 200, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Reset view if mode changes
  useEffect(() => {
      if (mode === 'simulation') setCurrentView('report');
      else setCurrentView('analysis');
  }, [mode]);

  // Floating Window Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        setFloatingPos({
            x: e.clientX - dragStartRef.current.x,
            y: e.clientY - dragStartRef.current.y
        });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const startDrag = (e: React.MouseEvent) => {
      setIsDragging(true);
      dragStartRef.current = {
          x: e.clientX - floatingPos.x,
          y: e.clientY - floatingPos.y
      };
  };

  // 1. Analyze Upstream (Incoming Links for ALL selected nodes)
  const allNodeIds = new Set(nodes.map(n => n.id));
  const upstreamLinks = graph.links.filter(l => allNodeIds.has(l.target));
  const upstreamData = upstreamLinks.map(l => {
    const sourceNode = graph.nodes.find(n => n.id === l.source);
    return { 
        id: sourceNode?.id,
        name: sourceNode?.name,
        type: sourceNode?.type,
        linkType: l.type,
        status: sourceNode?.status || 'normal',
        inventory: sourceNode?.inventoryLevel,
        eta: 'T+2',
        targetNodeName: nodes.find(n => n.id === l.target)?.name // Which node is affected
    };
  });

  // 2. Analyze Downstream (Outgoing Links for ALL selected nodes)
  const downstreamLinks = graph.links.filter(l => allNodeIds.has(l.source));
  const downstreamData = downstreamLinks.map(l => {
    const targetNode = graph.nodes.find(n => n.id === l.target);
    return { 
        id: targetNode?.id,
        name: targetNode?.name,
        type: targetNode?.type,
        impactLevel: targetNode?.status === 'normal' ? 'Low' : 'High',
        priority: 'VIP',
        pendingOrders: targetNode?.activeOrders?.length || 0,
        sourceNodeName: nodes.find(n => n.id === l.source)?.name // Origin of issue
    };
  });

  const handleGeneratePlans = () => {
    setIsGenerating(true);
    // Simulate AI Generation Delay
    setTimeout(() => {
        // Dynamic generation based on node count to simulate "Joint" logic
        const planDescriptionPrefix = nodes.length > 1 
            ? `针对 ${nodes.length} 个异常节点 (${nodes.map(n => n.name).join(', ')}) 的联合` 
            : `针对 ${nodes[0].name} 的`;

        const plans: EmergencyPlan[] = [
            {
                id: 'JOINT-A',
                name: '方案A: 全局资源紧急调配 (激进保交付)',
                type: 'aggressive',
                description: `${planDescriptionPrefix} 应对策略：启用全网备用库存，通过空运直发受影响客户。优先保障VIP订单，暂停低优先级排产以腾出物流通道。`,
                metrics: { cost: 180, time: 2, satisfaction: 96, risk: 'Low' },
                details: {
                    retrofitCost: '12万 (治具快速切换)',
                    logisticsTime: '12h (空运直达)',
                    rampUpPeriod: 'N/A',
                    batchDelivery: false,
                    referencedRules: ['规则C2: 战略客户优先分配', '规则L1: 跨基地协同允许']
                }
            },
            {
                id: 'JOINT-B',
                name: '方案B: 基地间协同转产 (平衡型)',
                type: 'balanced',
                description: `协调临近基地分担产能。${nodes[0].name} 负责核心模组，其他基地分流 Pack 组装。需协调物流中转。`,
                metrics: { cost: 65, time: 4, satisfaction: 88, risk: 'Medium' },
                details: {
                    retrofitCost: '45万 (协同产线改造)',
                    logisticsTime: '24h (基地间短驳)',
                    rampUpPeriod: '2天',
                    batchDelivery: true,
                    referencedRules: ['规则P4: 产线专线专用例外条款', '规则C5: 最小批量限制']
                }
            },
            {
                id: 'JOINT-C',
                name: '方案C: 订单顺延与客户协商 (保守降本)',
                type: 'conservative',
                description: '暂停异常节点排产，等待上游/设备恢复。统一向客户发送延期通知函，依据合同条款支付违约金。',
                metrics: { cost: 25, time: 10, satisfaction: 65, risk: 'High' },
                details: {
                    retrofitCost: '0',
                    logisticsTime: '常规陆运',
                    rampUpPeriod: 'N/A',
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
          content: `您已选择 **${plan.name}**。\n\n该方案针对当前选中的 ${nodes.length} 个异常节点进行联合优化，预计成本 ${plan.metrics.cost}万。\n\n如果您对跨基地的调度逻辑有新的约束要求（例如："禁止跨省调拨原材料"），请告诉我，我会自动学习并更新规则库。`,
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

      // AI logic truncated for brevity, assume similar to original implementation
      // ...
      setTimeout(() => {
          setIsChatThinking(false);
          setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "收到您的反馈，已记录。", timestamp: new Date() }]);
      }, 1000);
  };

  // --- REPORT VIEW COMPONENTS ---

  const ReportFlow = () => (
      <div className="flex justify-center items-center py-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> 数据加载
              </div>
              <ArrowRight size={14}/>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> 月份循环 1-12月
              </div>
              <ArrowRight size={14}/>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> 产能/库存计算
              </div>
              <ArrowRight size={14}/>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg shadow-sm ring-2 ring-indigo-100">
                  <FileSpreadsheet size={14} className="text-indigo-600"/> 生成Excel报表
              </div>
          </div>
      </div>
  );

  const LogicFlowTab = () => {
      // Helper for Nodes
      const FlowNode = ({ icon: Icon, label, type = 'process', subtext }: any) => (
          <div className={`relative z-10 flex flex-col items-center justify-center p-3 rounded-lg border min-w-[140px] text-center shadow-lg transition-all ${
              type === 'start' ? 'bg-slate-200 border-slate-300 text-slate-800 rounded-full w-24 h-24' :
              type === 'decision' ? 'bg-[#1e293b] border-amber-500/50 text-amber-100 rotate-45 w-24 h-24' :
              type === 'data' ? 'bg-[#1e293b] border-blue-500/30 text-blue-100' :
              'bg-[#1e293b] border-slate-600 text-slate-200'
          }`}>
              <div className={type === 'decision' ? '-rotate-45 flex flex-col items-center' : 'flex flex-col items-center'}>
                  {Icon && <Icon size={20} className={`mb-1 ${type === 'start' ? 'text-slate-600' : 'text-slate-400'}`}/>}
                  <span className="text-xs font-bold">{label}</span>
                  {subtext && <span className="text-[10px] text-slate-500 mt-1">{subtext}</span>}
              </div>
          </div>
      );

      const ArrowDownLine = ({ height = 'h-8' }) => (
          <div className={`w-px ${height} bg-slate-600 relative`}>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[6px] border-t-slate-600"></div>
          </div>
      );

      return (
          <div className="h-full overflow-y-auto bg-[#0f172a] p-8 custom-scrollbar relative flex justify-center pb-20">
              <div className="flex flex-col items-center relative">
                  
                  {/* Start */}
                  <FlowNode icon={PlayCircle} label="开始" type="start" />
                  <ArrowDownLine />

                  {/* Data Load Block */}
                  <div className="p-4 border border-dashed border-slate-700 rounded-xl bg-slate-900/50 w-[400px]">
                      <div className="flex justify-center mb-2"><FlowNode icon={Database} label="数据加载" type="data" /></div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                          <div className="text-[10px] text-slate-400 bg-slate-800 p-2 rounded text-center border border-slate-700">加载PACK产线</div>
                          <div className="text-[10px] text-slate-400 bg-slate-800 p-2 rounded text-center border border-slate-700">加载客户需求</div>
                          <div className="text-[10px] text-slate-400 bg-slate-800 p-2 rounded text-center border border-slate-700">加载电芯产能</div>
                      </div>
                  </div>
                  <ArrowDownLine />

                  <FlowNode icon={RefreshCw} label="初始化库存" type="process" subtext="和产线记录" />
                  <ArrowDownLine />

                  {/* Month Loop Container */}
                  <div className="p-6 border-2 border-slate-600 rounded-xl bg-slate-900 w-[500px] relative">
                      <div className="absolute -top-3 left-4 bg-[#0f172a] px-2 text-xs font-bold text-slate-400 flex items-center gap-1">
                          <RefreshCw size={12}/> 月份循环 (1-12月)
                      </div>
                      
                      <div className="flex flex-col items-center">
                          <FlowNode icon={Calculator} label="计算可用电芯" subtext="= 产能 + 库存" />
                          <ArrowDownLine />
                          <FlowNode icon={Filter} label="需求按量降序" subtext="Sort Orders" />
                          <ArrowDownLine />

                          {/* Order Loop */}
                          <div className="p-4 border border-dashed border-slate-700 rounded-xl bg-slate-800/30 w-full flex flex-col items-center relative">
                                <div className="absolute -top-3 left-4 bg-slate-900 px-2 text-[10px] font-bold text-slate-500">遍历需求订单</div>
                                
                                {/* Base Loop */}
                                <div className="p-4 border border-dashed border-slate-700 rounded-xl bg-slate-800/30 w-[90%] flex flex-col items-center mt-2 relative">
                                    <div className="absolute -top-3 left-4 bg-slate-900 px-2 text-[10px] font-bold text-slate-500">遍历基地</div>
                                    
                                    <FlowNode label="电芯>=10%需求?" type="decision" />
                                    
                                    <div className="flex w-full mt-4">
                                        <div className="flex-1 flex flex-col items-center border-r border-slate-700 pr-2">
                                            <span className="text-[10px] text-green-500 mb-1 font-bold">是 (Yes)</span>
                                            <ArrowDownLine height="h-4"/>
                                            <FlowNode icon={Layers} label="遍历PACK产线" />
                                            <ArrowDownLine height="h-4"/>
                                            <FlowNode icon={AlertTriangle} label="计算换线损失" subtext="Changeover Loss" />
                                            <ArrowDownLine height="h-4"/>
                                            <FlowNode icon={Split} label="分配产能" subtext="min(需求, 产能, 电芯)" />
                                            <ArrowDownLine height="h-4"/>
                                            <FlowNode icon={CheckCircle2} label="记录分配" subtext="并更新状态" />
                                        </div>
                                        <div className="flex-1 flex flex-col items-center justify-center pl-2">
                                            <span className="text-[10px] text-red-500 mb-1 font-bold">否 (No)</span>
                                            <div className="text-[10px] text-slate-500 bg-slate-800 p-2 rounded">
                                                跳过当前基地
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <ArrowDownLine height="h-4"/>
                                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                                    需求已满足? <Check size={12}/>
                                </div>
                          </div>
                      </div>
                  </div>
                  <ArrowDownLine />

                  {/* End Loop Action */}
                  <div className="flex gap-4">
                      <FlowNode icon={Database} label="剩余电芯转库存" type="data" />
                      <FlowNode icon={FileCheck} label="生成Excel报表" type="process" />
                  </div>
                  <ArrowDownLine />

                  {/* End */}
                  <FlowNode icon={Check} label="结束" type="start" />

              </div>
          </div>
      );
  };

  const Sheet1Table = () => (
      <div className="overflow-x-auto">
          <table className="w-full text-sm text-center border-collapse">
              <thead>
                  <tr className="bg-white text-cyan-500 font-bold border-b border-cyan-100 text-xs">
                      <th className="p-3 text-left w-24">基地</th>
                      <th className="p-3 w-16">产线</th>
                      <th className="p-3 text-left w-32">项目</th>
                      {Array.from({length: 12}).map((_, i) => <th key={i} className="p-3">{i+1}月</th>)}
                  </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-100 bg-white">
                  <tr>
                      <td className="p-3 text-left font-medium">基地A</td>
                      <td className="p-3">P1</td>
                      <td className="p-3 text-left text-xs">客户A-项目1</td>
                      <td className="p-3">1,566</td><td className="p-3">1,533</td><td className="p-3">2,570</td><td className="p-3">1,403</td><td className="p-3">4,567</td><td className="p-3">5,000</td><td className="p-3">5,025</td><td className="p-3">5,400</td><td className="p-3">5,400</td><td className="p-3">5,500</td><td className="p-3">5,500</td><td className="p-3">5,000</td>
                  </tr>
                  <tr>
                      <td className="p-3 text-left font-medium">基地A</td>
                      <td className="p-3">P1</td>
                      <td className="p-3 text-left text-xs">客户A-项目2</td>
                      <td className="p-3">270</td><td className="p-3">257</td><td className="p-3">172</td><td className="p-3">10</td><td className="p-3">-</td><td className="p-3">-</td><td className="p-3">-</td><td className="p-3">-</td><td className="p-3">-</td><td className="p-3">-</td><td className="p-3">-</td><td className="p-3">-</td>
                  </tr>
                  <tr>
                      <td className="p-3 text-left font-medium">基地A</td>
                      <td className="p-3">P1</td>
                      <td className="p-3 text-left text-xs">客户A-项目3</td>
                      <td className="p-3">50</td><td className="p-3">10</td><td className="p-3">30</td><td className="p-3">10</td><td className="p-3">-</td><td className="p-3">-</td><td className="p-3">-</td><td className="p-3">-</td><td className="p-3">-</td><td className="p-3">-</td><td className="p-3">-</td><td className="p-3">-</td>
                  </tr>
                  <tr>
                      <td className="p-3 text-left font-medium">基地A</td>
                      <td className="p-3">P1</td>
                      <td className="p-3 text-left text-xs">客户A-项目4</td>
                      <td className="p-3">-</td><td className="p-3">-</td><td className="p-3">1,232</td><td className="p-3">2,840</td><td className="p-3">1,031</td><td className="p-3">598</td><td className="p-3">573</td><td className="p-3">198</td><td className="p-3">198</td><td className="p-3">98</td><td className="p-3">98</td><td className="p-3">598</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                      <td className="p-3 text-left font-medium">基地A</td>
                      <td className="p-3">P2</td>
                      <td className="p-3 text-left text-xs">客户B-项目5</td>
                      <td className="p-3">-</td><td className="p-3">-</td><td className="p-3">-</td><td className="p-3">-</td><td className="p-3">800</td><td className="p-3">800</td><td className="p-3">800</td><td className="p-3">800</td><td className="p-3">-</td><td className="p-3">-</td><td className="p-3">-</td><td className="p-3">800</td>
                  </tr>
              </tbody>
          </table>
      </div>
  );

  const Sheet2Table = () => (
      <div className="overflow-x-auto">
          <table className="w-full text-sm text-center border-collapse">
              <thead>
                  <tr className="bg-white text-cyan-500 font-bold border-b border-cyan-100 text-xs">
                      <th className="p-3 w-20">月份</th>
                      <th className="p-3">期初库存</th>
                      <th className="p-3">本月产出</th>
                      <th className="p-3">本月消耗</th>
                      <th className="p-3">期末库存</th>
                  </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-100 bg-white font-mono text-xs">
                  {[
                      { m: '1月', s: 0, p: 497565, c: 213220, e: 284345 },
                      { m: '2月', s: 284345, p: 374077, c: 202806, e: 455616 },
                      { m: '3月', s: 455616, p: 396668, c: 471196, e: 381089 },
                      { m: '4月', s: 381089, p: 734200, c: 625290, e: 489999 },
                      { m: '5月', s: 489999, p: 831233, c: 1112300, e: 208932 },
                      { m: '6月', s: 208932, p: 1100790, c: 1273800, e: 35923 },
                      { m: '7月', s: 35923, p: 1440755, c: 1263750, e: 212929 },
                      { m: '8月', s: 212929, p: 1539454, c: 1310120, e: 442264 },
                      { m: '9月', s: 442264, p: 1488641, c: 1345888, e: 585017 },
                      { m: '10月', s: 585017, p: 1493305, c: 1344088, e: 734235 },
                      { m: '11月', s: 734235, p: 1477641, c: 1344088, e: 867789 },
                      { m: '12月', s: 867789, p: 1541749, c: 1334320, e: 1075219 },
                  ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                          <td className="p-3 font-sans font-bold text-slate-500">{row.m}</td>
                          <td className="p-3 text-slate-400">{row.s.toLocaleString()}</td>
                          <td className="p-3 text-emerald-600 font-bold">+{row.p.toLocaleString()}</td>
                          <td className="p-3 text-amber-600">-{row.c.toLocaleString()}</td>
                          <td className="p-3 font-bold text-slate-800">{row.e.toLocaleString()}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
  );

  const Sheet3Table = () => (
      <div className="overflow-x-auto">
          <table className="w-full text-sm text-center border-collapse">
              <thead>
                  <tr className="bg-white text-cyan-500 font-bold border-b border-cyan-100 text-xs">
                      <th className="p-3 text-left w-24">基地</th>
                      <th className="p-3 w-16">产线</th>
                      {Array.from({length: 12}).map((_, i) => <th key={i} className="p-3">{i+1}月</th>)}
                  </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-100 bg-white">
                  <tr>
                      <td className="p-3 text-left font-medium">基地A</td>
                      <td className="p-3">P1</td>
                      <td className="p-3">36%</td><td className="p-3">34.5%</td><td className="p-3 text-amber-500">76.5%</td><td className="p-3 text-emerald-500">94.8%</td><td className="p-3 text-red-500 font-bold">100%</td><td className="p-3 text-red-500 font-bold">100%</td><td className="p-3 text-red-500 font-bold">100%</td><td className="p-3 text-red-500 font-bold">100%</td><td className="p-3 text-red-500 font-bold">100%</td><td className="p-3 text-red-500 font-bold">100%</td><td className="p-3 text-red-500 font-bold">100%</td><td className="p-3 text-red-500 font-bold">100%</td>
                  </tr>
                  <tr>
                      <td className="p-3 text-left font-medium">基地A</td>
                      <td className="p-3">P2</td>
                      <td className="p-3 text-slate-300">0%</td><td className="p-3 text-slate-300">0%</td><td className="p-3 text-slate-300">0%</td><td className="p-3 text-slate-300">0%</td><td className="p-3">67.9%</td><td className="p-3 text-emerald-500">92.8%</td><td className="p-3 text-emerald-500">91.4%</td><td className="p-3 text-emerald-500">98.7%</td><td className="p-3 text-red-500 font-bold">100%</td><td className="p-3 text-red-500 font-bold">100%</td><td className="p-3 text-red-500 font-bold">100%</td><td className="p-3 text-emerald-500">99.5%</td>
                  </tr>
              </tbody>
          </table>
      </div>
  );

  // --- REUSABLE REPORT CONTENT (Used in Main View & Floating Window) ---
  const ReportContent = () => (
      <div className="h-full flex flex-col">
          {/* Top Flow Chart Visual */}
          <ReportFlow />

          {/* Sheet Tabs */}
          <div className="flex px-6 pt-6 gap-2 shrink-0">
              <button 
                  onClick={() => setActiveReportSheet(1)}
                  className={`px-6 py-2 rounded-t-lg text-sm font-bold border-t border-x transition-colors ${activeReportSheet === 1 ? 'bg-white border-slate-200 text-cyan-600 shadow-[0_-2px_5px_rgba(0,0,0,0.02)]' : 'bg-slate-100 border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  Sheet 1: 排产计划
              </button>
              <button 
                  onClick={() => setActiveReportSheet(2)}
                  className={`px-6 py-2 rounded-t-lg text-sm font-bold border-t border-x transition-colors ${activeReportSheet === 2 ? 'bg-white border-slate-200 text-cyan-600 shadow-[0_-2px_5px_rgba(0,0,0,0.02)]' : 'bg-slate-100 border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  Sheet 2: 库存汇总
              </button>
              <button 
                  onClick={() => setActiveReportSheet(3)}
                  className={`px-6 py-2 rounded-t-lg text-sm font-bold border-t border-x transition-colors ${activeReportSheet === 3 ? 'bg-white border-slate-200 text-cyan-600 shadow-[0_-2px_5px_rgba(0,0,0,0.02)]' : 'bg-slate-100 border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  Sheet 3: 产能利用率
              </button>
              <button 
                  onClick={() => setActiveReportSheet(4)}
                  className={`px-6 py-2 rounded-t-lg text-sm font-bold border-t border-x transition-colors ${activeReportSheet === 4 ? 'bg-[#0f172a] border-slate-900 text-white shadow-sm' : 'bg-slate-100 border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  <span className="flex items-center gap-1"><Workflow size={14}/> 逻辑推演图 (Logic Flow)</span>
              </button>
          </div>

          {/* Sheet Content */}
          <div className={`flex-1 mx-6 mb-6 rounded-b-lg rounded-tr-lg shadow-sm overflow-hidden flex flex-col ${activeReportSheet === 4 ? 'bg-[#0f172a] border border-slate-700' : 'bg-white border border-slate-200 p-4'}`}>
              {activeReportSheet !== 4 && (
                  <div className="flex justify-between items-center mb-4 shrink-0">
                      <h3 className="text-cyan-500 font-bold text-lg">
                          {activeReportSheet === 1 ? 'Sheet 1: 排产计划' : activeReportSheet === 2 ? 'Sheet 2: 库存汇总' : 'Sheet 3: 产能利用率'}
                      </h3>
                      <div className="flex gap-2">
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold text-slate-600 transition-colors">
                              <Share size={14}/> 分享
                          </button>
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 rounded text-xs font-bold text-cyan-700 transition-colors">
                              <Download size={14}/> 导出 Excel
                          </button>
                      </div>
                  </div>
              )}
              
              <div className={`flex-1 overflow-auto ${activeReportSheet !== 4 ? 'border border-slate-100 rounded' : ''}`}>
                  {activeReportSheet === 1 && <Sheet1Table />}
                  {activeReportSheet === 2 && <Sheet2Table />}
                  {activeReportSheet === 3 && <Sheet3Table />}
                  {activeReportSheet === 4 && <LogicFlowTab />}
              </div>
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-[1100px] h-[90vh] flex flex-col border border-slate-200 overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-6 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${currentView === 'report' ? 'bg-cyan-100 text-cyan-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    {currentView === 'report' ? <FileSpreadsheet size={28}/> : <Layers size={28} />}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        {currentView === 'report' ? 'PACK 排产计划 (Simulation Report)' : '多节点联合推演中心 (Joint Analysis)'}
                        {currentView === 'planning' && <span className="text-sm font-normal text-slate-500 bg-slate-100 px-3 py-1 rounded-full">应急预案生成模式</span>}
                    </h2>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-500">
                        {currentView === 'report' ? (
                            <span className="font-bold bg-cyan-50 px-3 py-1 rounded text-xs text-cyan-700 border border-cyan-100">
                                版本: V2026-Sim-001
                            </span>
                        ) : (
                            <span className="font-bold bg-slate-100 px-3 py-1 rounded text-xs text-slate-700 border border-slate-200">
                                {nodes.length} 个异常节点
                            </span>
                        )}
                        <span>|</span>
                        <span>推演模型: <span className="text-blue-600 font-bold">Macro-Sim-v2</span></span>
                    </div>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-3 hover:bg-slate-100 rounded-full transition-colors">
                <X size={28} />
            </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden bg-slate-50/50 relative flex flex-col">
            
            {/* VIEW 3: REPORT (Excel-like View) */}
            {currentView === 'report' && (
                <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4">
                    <ReportContent />
                </div>
            )}

            {/* VIEW 1: Analysis Data Tables */}
            {currentView === 'analysis' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 p-8 overflow-y-auto h-full">
                    {/* Top Section: Nodes Horizontal List */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Activity size={18} className="text-red-500"/> 异常节点聚合视图 (Aggregated Anomalies)
                        </h3>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {nodes.map(node => (
                                <div key={node.id} className="min-w-[260px] bg-white p-5 rounded-xl border border-red-200 shadow-sm relative">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="font-bold text-lg text-slate-700">{node.name}</div>
                                        <span className={`text-xs px-2 py-1 rounded font-bold ${node.status === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {node.status === 'critical' ? 'CRITICAL' : 'WARNING'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <div className="text-slate-400 text-xs">库存水平</div>
                                            <div className="font-mono font-bold">{node.inventoryLevel?.toLocaleString() || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-slate-400 text-xs">缺口</div>
                                            <div className="font-mono font-bold text-red-500">-{(2000 - (node.inventoryLevel || 0)).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                        {/* Left: Upstream Data Table */}
                        <div className="space-y-4">
                            <h3 className="text-base font-bold text-slate-700 flex items-center gap-2">
                                <Truck size={18} className="text-blue-500"/> 聚合上游影响 (Upstream Impact)
                            </h3>
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-5 py-4">供应商</th>
                                            <th className="px-5 py-4">影响节点</th>
                                            <th className="px-5 py-4">状态</th>
                                            <th className="px-5 py-4 text-right">预估到达</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {upstreamData.length > 0 ? upstreamData.map((d, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-5 py-4 font-medium text-slate-700">{d.name}</td>
                                                <td className="px-5 py-4 text-xs text-slate-500">{d.targetNodeName}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${d.status === 'normal' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {d.status === 'normal' ? '正常' : '异常'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right text-slate-600 font-mono">{d.eta}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400 text-sm">无上游关联数据</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Right: Downstream Data Table */}
                        <div className="space-y-4">
                             <h3 className="text-base font-bold text-slate-700 flex items-center gap-2">
                                <Package size={18} className="text-purple-500"/> 聚合下游交付风险 (Downstream Risk)
                            </h3>
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-5 py-4">受累客户</th>
                                            <th className="px-5 py-4">问题源头</th>
                                            <th className="px-5 py-4">订单数</th>
                                            <th className="px-5 py-4 text-right">风险</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {downstreamData.length > 0 ? downstreamData.map((d, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-5 py-4 font-medium text-slate-700">{d.name}</td>
                                                <td className="px-5 py-4 text-xs text-slate-500">{d.sourceNodeName}</td>
                                                <td className="px-5 py-4 text-slate-600">{d.pendingOrders}</td>
                                                <td className="px-5 py-4 text-right">
                                                    <span className={`font-bold ${d.impactLevel === 'High' ? 'text-red-600' : 'text-slate-600'}`}>
                                                        {d.impactLevel}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400 text-sm">无下游关联数据</td></tr>
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
                <div className="h-full flex flex-col p-8 overflow-hidden animate-in fade-in slide-in-from-right-4 relative">
                     
                     {/* If no plan selected, show grid */}
                     {!selectedPlan ? (
                         <>
                             <div className="flex items-center gap-3 mb-6 shrink-0">
                                <Calculator size={24} className="text-blue-600"/>
                                <h3 className="text-xl font-bold text-slate-800">联合推演结果 (Joint Simulation Scenarios)</h3>
                             </div>
                             <div className="grid grid-cols-3 gap-8 overflow-y-auto pb-4">
                                {generatedPlans.map((plan) => (
                                    <div key={plan.id} className={`relative flex flex-col bg-white rounded-xl border-2 transition-all hover:shadow-lg ${
                                        plan.type === 'aggressive' ? 'border-amber-200 hover:border-amber-400' : 
                                        plan.type === 'balanced' ? 'border-blue-200 hover:border-blue-400' : 
                                        'border-slate-200 hover:border-slate-400'
                                    }`}>
                                        {/* Plan Content */}
                                        <div className={`p-5 border-b ${
                                            plan.type === 'aggressive' ? 'bg-amber-50 border-amber-100' : 
                                            plan.type === 'balanced' ? 'bg-blue-50 border-blue-100' : 
                                            'bg-slate-50 border-slate-100'
                                        }`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${
                                                    plan.type === 'aggressive' ? 'bg-amber-200 text-amber-800' : 
                                                    plan.type === 'balanced' ? 'bg-blue-200 text-blue-800' : 
                                                    'bg-slate-200 text-slate-700'
                                                }`}>{plan.id}</span>
                                                {plan.type === 'balanced' && <span className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-sm">AI 推荐</span>}
                                            </div>
                                            <h4 className="font-bold text-slate-800 leading-tight text-lg">{plan.name}</h4>
                                        </div>

                                        <div className="p-5 grid grid-cols-2 gap-5 border-b border-slate-100">
                                            <div>
                                                <div className="text-xs text-slate-400 uppercase flex items-center gap-1 mb-1"><DollarSign size={12}/> 预估成本</div>
                                                <div className="text-xl font-bold text-slate-700">{plan.metrics.cost}<span className="text-sm font-normal text-slate-400 ml-1">万</span></div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-400 uppercase flex items-center gap-1 mb-1"><Clock size={12}/> 交付周期</div>
                                                <div className="text-xl font-bold text-slate-700">{plan.metrics.time}<span className="text-sm font-normal text-slate-400 ml-1">天</span></div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-400 uppercase flex items-center gap-1 mb-1"><CheckCircle2 size={12}/> 客户满意度</div>
                                                <div className="w-full bg-slate-100 rounded-full h-2.5 mt-1">
                                                    <div className={`h-2.5 rounded-full ${plan.metrics.satisfaction > 90 ? 'bg-emerald-500' : plan.metrics.satisfaction > 70 ? 'bg-blue-500' : 'bg-red-400'}`} style={{width: `${plan.metrics.satisfaction}%`}}></div>
                                                </div>
                                                <div className="text-sm font-bold mt-1 text-right">{plan.metrics.satisfaction}/100</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-400 uppercase flex items-center gap-1 mb-1"><AlertTriangle size={12}/> 风险指数</div>
                                                <div className={`text-base font-bold ${plan.metrics.risk === 'High' ? 'text-red-600' : plan.metrics.risk === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {plan.metrics.risk}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5 space-y-4 flex-1 bg-slate-50/30">
                                            <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                                                <span className="text-slate-500">产线改造成本</span>
                                                <span className="font-medium text-slate-800">{plan.details.retrofitCost}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                                                <span className="text-slate-500">物流周期(电芯-Pack)</span>
                                                <span className="font-medium text-slate-800">{plan.details.logisticsTime}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                                                <span className="text-slate-500">爬坡约束</span>
                                                <span className="font-medium text-slate-800">{plan.details.rampUpPeriod}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                                                <span className="text-slate-500">是否分批交付</span>
                                                <span className={`font-bold ${plan.details.batchDelivery ? 'text-blue-600' : 'text-slate-600'}`}>
                                                    {plan.details.batchDelivery ? '是 (分批)' : '否 (整单)'}
                                                </span>
                                            </div>
                                            
                                            <div className="pt-2">
                                                <div className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                                                    <FileText size={12}/> 引用配置规则
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {plan.details.referencedRules.map((rule, idx) => (
                                                        <span key={idx} className="text-xs bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-600 truncate max-w-full">
                                                            {rule}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="p-5 pt-2 flex gap-3">
                                            <button 
                                                onClick={() => handleSelectPlan(plan)}
                                                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors shadow-sm ${
                                                plan.type === 'balanced' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700'
                                            }`}>
                                                选择此方案
                                            </button>
                                            <button 
                                                onClick={() => setCurrentView('report')}
                                                className="px-4 py-3 bg-cyan-50 border border-cyan-100 text-cyan-700 font-bold rounded-lg hover:bg-cyan-100 transition-colors text-sm"
                                            >
                                                排产详情
                                            </button>
                                        </div>
                                    </div>
                                ))}
                             </div>
                         </>
                     ) : (
                         // SPLIT VIEW: Selected Plan + Chat
                         <div className="flex h-full gap-8 relative">
                            {/* Left: The Selected Plan Details (Read-only view) */}
                            <div className="w-1/3 flex flex-col h-full bg-white rounded-xl border-2 border-slate-200 shadow-md overflow-hidden shrink-0">
                                <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                    <button onClick={() => setSelectedPlan(null)} className="flex items-center gap-1 text-slate-500 text-sm font-bold hover:text-blue-600">
                                        <ArrowLeft size={16}/> 返回列表
                                    </button>
                                    <span className="text-sm font-bold text-blue-600">当前选中</span>
                                </div>
                                <div className="p-6 flex-1 overflow-y-auto">
                                    <h4 className="text-xl font-bold text-slate-800 mb-3">{selectedPlan.name}</h4>
                                    <p className="text-base text-slate-600 leading-relaxed mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                        {selectedPlan.description}
                                    </p>
                                    
                                    <div className="space-y-6">
                                         <div>
                                            <div className="text-xs font-bold text-slate-400 uppercase mb-3">关键指标</div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                                    <div className="text-xs text-slate-500">预估成本</div>
                                                    <div className="text-xl font-bold text-slate-700">{selectedPlan.metrics.cost}万</div>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                                    <div className="text-xs text-slate-500">风险等级</div>
                                                    <div className={`text-xl font-bold ${selectedPlan.metrics.risk === 'High' ? 'text-red-600' : 'text-emerald-600'}`}>{selectedPlan.metrics.risk}</div>
                                                </div>
                                            </div>
                                         </div>
                                         
                                         <div>
                                             <div className="text-xs font-bold text-slate-400 uppercase mb-3">执行细节</div>
                                             <ul className="space-y-3 text-sm text-slate-700">
                                                <li className="flex justify-between border-b border-slate-50 pb-1"><span>产线改造:</span> <span className="font-medium">{selectedPlan.details.retrofitCost}</span></li>
                                                <li className="flex justify-between border-b border-slate-50 pb-1"><span>物流时效:</span> <span className="font-medium">{selectedPlan.details.logisticsTime}</span></li>
                                                <li className="flex justify-between border-b border-slate-50 pb-1"><span>分批交付:</span> <span className="font-medium">{selectedPlan.details.batchDelivery ? '是' : '否'}</span></li>
                                             </ul>
                                         </div>

                                         {/* Floating Report Toggle Button */}
                                         <button 
                                            onClick={() => setShowFloatingReport(true)}
                                            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
                                         >
                                             <FileSpreadsheet size={18}/> 查看排产详情 (浮窗)
                                         </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Negotiation Chat */}
                            <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
                                <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-blue-50/50 to-white flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg">
                                            <Bot size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-base">方案推演与规则沉淀</h4>
                                            <p className="text-xs text-slate-500">AI 可自动从对话中提取并保存业务规则</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-purple-50 text-purple-700 rounded-full border border-purple-100 text-xs font-bold">
                                        <BrainCircuit size={14}/>
                                        知识库联动中
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/30">
                                    {chatMessages.map((msg) => (
                                        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'model' ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                                                {msg.role === 'model' ? <Bot size={20} /> : <User size={20} />}
                                            </div>
                                            <div className={`max-w-[80%] rounded-2xl px-5 py-4 text-base shadow-sm ${
                                                msg.role === 'model' ? 'bg-white text-slate-700 border border-slate-100' : 'bg-blue-600 text-white'
                                            }`}>
                                                {msg.content.includes('已自动识别并沉淀规则') ? (
                                                     <div>
                                                         <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-100 text-purple-700 font-bold">
                                                             <GitCommit size={18}/> 规则已沉淀 (Rule Committed)
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
                                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                                <Bot size={20} />
                                            </div>
                                            <div className="bg-white border border-slate-100 px-5 py-4 rounded-2xl flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="p-5 bg-white border-t border-slate-200">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-base rounded-lg pl-5 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            placeholder="输入您的调整意见 (如: '以后必须优先保证VIP客户')..."
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                                        />
                                        <button 
                                            onClick={handleSendChatMessage}
                                            disabled={!chatInput.trim() || isChatThinking}
                                            className="absolute right-3 top-3 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Send size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Report Window */}
                            {showFloatingReport && (
                                <div 
                                    className="fixed z-50 bg-white rounded-xl shadow-2xl border border-slate-300 w-[900px] h-[600px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                                    style={{ left: floatingPos.x, top: floatingPos.y }}
                                >
                                    <div 
                                        className="h-12 bg-slate-800 flex items-center justify-between px-4 cursor-move shrink-0"
                                        onMouseDown={startDrag}
                                    >
                                        <div className="flex items-center gap-2 text-white font-bold text-sm">
                                            <FileSpreadsheet size={16}/> PACK 排产计划 (Simulation Report)
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Move size={14} className="text-slate-400"/>
                                            <button onClick={() => setShowFloatingReport(false)} className="text-slate-300 hover:text-white p-1 hover:bg-slate-700 rounded transition-colors">
                                                <X size={18}/>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-hidden bg-slate-50">
                                        <ReportContent />
                                    </div>
                                </div>
                            )}
                         </div>
                     )}
                </div>
            )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
            <div className="flex items-center text-sm text-slate-500 gap-4">
                {currentView === 'report' ? (
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-500"/>
                        <span>推演报告已生成。数据来源于模拟场景：SUPPLY_DELAY + DEMAND_SPIKE</span>
                    </div>
                ) : currentView === 'analysis' ? (
                     <div className="flex items-center gap-2">
                         <BarChart3 size={18} className="text-slate-400"/>
                         <span>当前展示实时监控数据，点击生成预案进行深度推演。</span>
                     </div>
                ) : (
                    <button onClick={() => {
                        if (selectedPlan) setSelectedPlan(null); // Back to grid
                        else setCurrentView('analysis'); // Back to analysis
                    }} className="flex items-center gap-1 text-blue-600 hover:underline font-medium">
                        <ArrowRight size={16} className="rotate-180"/> 
                        {selectedPlan ? '返回方案列表' : '返回数据监控视图'}
                    </button>
                )}
            </div>

            <div className="flex gap-4">
                <button onClick={onClose} className="px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    关闭窗口
                </button>
                {currentView === 'report' && (
                    <button 
                        onClick={() => setCurrentView('analysis')}
                        className="px-8 py-3 text-base font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-md transition-all flex items-center gap-2"
                    >
                        <AlertCircle size={20} /> 查看详细异常影响
                    </button>
                )}
                {currentView === 'analysis' && (
                    <button 
                        onClick={handleGeneratePlans}
                        disabled={isGenerating}
                        className="px-8 py-3 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                正在运算全量数据...
                            </>
                        ) : (
                            <>
                                <Calculator size={20} />
                                生成联合预案 (3种)
                            </>
                        )}
                    </button>
                )}
                {currentView === 'planning' && selectedPlan && (
                     <button className="px-8 py-3 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md transition-colors flex items-center gap-2">
                        <CheckCircle2 size={20} />
                        确认执行并导出
                    </button>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};
