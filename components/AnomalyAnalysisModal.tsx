import React from 'react';
import { NodeData, GraphData, NodeType } from '../types';
import { X, AlertTriangle, ArrowRight, Activity, Truck, Factory, Package, AlertCircle } from 'lucide-react';

interface Props {
  node: NodeData;
  graph: GraphData;
  onClose: () => void;
}

const AnomalyAnalysisModal: React.FC<Props> = ({ node, graph, onClose }) => {
  // 1. Analyze Upstream (Incoming Links)
  const upstreamLinks = graph.links.filter(l => l.target === node.id);
  const upstreamNodes = upstreamLinks.map(l => {
    const sourceNode = graph.nodes.find(n => n.id === l.source);
    return { node: sourceNode, link: l };
  }).filter(item => item.node);

  // 2. Analyze Downstream (Outgoing Links)
  const downstreamLinks = graph.links.filter(l => l.source === node.id);
  const downstreamNodes = downstreamLinks.map(l => {
    const targetNode = graph.nodes.find(n => n.id === l.target);
    return { node: targetNode, link: l };
  }).filter(item => item.node);

  // 3. Analyze Internal Production Lines (if Base)
  const impactedLines = node.productionLines?.filter(line => line.status !== 'running') || [];

  // 4. Analyze At-Risk Orders (if Customer)
  const riskOrders = node.activeOrders?.filter(o => o.status !== 'on-track') || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-[900px] max-h-[85vh] overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 p-5 flex justify-between items-start">
            <div className="flex gap-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-lg h-fit">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">异常溯源与影响分析报告</h2>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                        <span className="font-semibold bg-white px-2 py-0.5 border border-slate-200 rounded text-slate-500 text-xs">
                            {node.id}
                        </span>
                        <span>{node.name}</span>
                        <span className="text-slate-400">|</span>
                        <span className="text-red-600 font-bold">检测到 {node.activeAlerts || 1} 项关键风险</span>
                    </div>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1">
            <div className="grid grid-cols-3 gap-6 h-full">
                
                {/* Column 1: Upstream / Input Factors */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Truck size={14}/> 上游/输入端影响
                    </h3>
                    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm min-h-[200px]">
                        {upstreamNodes.length > 0 ? (
                            <div className="space-y-3">
                                {upstreamNodes.map(({ node: un, link }, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${un?.status === 'normal' ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-700">{un?.name}</div>
                                                <div className="text-[10px] text-slate-500">物流: {link.type}</div>
                                            </div>
                                        </div>
                                        {un?.status !== 'normal' && (
                                            <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 rounded">延期</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 text-xs py-10">无直接上游关联数据</div>
                        )}
                    </div>
                </div>

                {/* Column 2: The Node (Internal Issues) */}
                <div className="space-y-4">
                     <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={14}/> 核心异常点 ({node.name})
                    </h3>
                    
                    {/* Inventory Issue */}
                    {node.inventoryLevel !== undefined && (node.status === 'critical' || node.activeAlerts! > 0) && (
                         <div className="bg-white border-l-4 border-red-500 rounded-r-lg p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-bold text-slate-700">库存告急</span>
                                <span className="text-xs font-mono text-red-600 font-bold">{node.inventoryLevel.toLocaleString()} Ah</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                当前库存低于安全水位线 (Safe Line: 2000)。
                                <br/>预计导致后续生产停滞风险：<span className="font-bold text-red-600">极高</span>
                            </p>
                        </div>
                    )}

                    {/* Production Lines Issue */}
                    {impactedLines.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                            <div className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <Factory size={14} className="text-slate-400"/> 受影响产线
                            </div>
                            <div className="space-y-2">
                                {impactedLines.map(line => (
                                    <div key={line.id} className="flex justify-between items-center bg-red-50 p-2 rounded border border-red-100">
                                        <span className="text-xs font-medium text-slate-700">{line.name}</span>
                                        <span className="text-[10px] font-bold text-red-600 uppercase border border-red-200 px-1 rounded bg-white">
                                            {line.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Customer Specific - Delayed Orders */}
                    {node.type === NodeType.CUSTOMER && riskOrders.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                            <div className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <Package size={14} className="text-slate-400"/> 延期交付订单
                            </div>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                {riskOrders.map(order => (
                                    <div key={order.id} className="flex justify-between items-center bg-amber-50 p-2 rounded border border-amber-100">
                                        <div>
                                            <div className="text-xs font-bold text-slate-700">{order.id}</div>
                                            <div className="text-[10px] text-slate-500">{order.product}</div>
                                        </div>
                                        <div className="text-right">
                                             <div className="text-xs font-bold text-red-600">{order.progress}%</div>
                                             <div className="text-[9px] text-red-400">DELAYED</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Column 3: Downstream Impact */}
                <div className="space-y-4">
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ArrowRight size={14}/> 下游/交付端连锁反应
                    </h3>
                    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm min-h-[200px]">
                        {downstreamNodes.length > 0 ? (
                            <div className="space-y-3">
                                {downstreamNodes.map(({ node: dn, link }, idx) => (
                                    <div key={idx} className="relative pl-4 pb-4 border-l-2 border-slate-100 last:pb-0">
                                        <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-slate-300"></div>
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100 hover:border-blue-300 transition-colors cursor-default">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs font-bold text-slate-700">{dn?.name}</span>
                                                <span className={`text-[10px] font-bold px-1.5 rounded ${dn?.status === 'normal' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {dn?.status === 'normal' ? '正常' : '受波及'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500">
                                                关联业务: {link.type === 'pack' ? '电池包交付' : '电芯供应'}
                                                <br/>
                                                预估影响: {dn?.status === 'normal' ? '低' : '中/高'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 text-xs py-10">无直接下游关联数据</div>
                        )}
                    </div>
                </div>

            </div>
        </div>

        {/* Footer / Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3">
            <div className="flex-1 flex items-center text-xs text-slate-500">
                <AlertCircle size={14} className="mr-1 text-blue-500"/>
                系统建议：针对受影响的产线，建议启动备用产线 {node.id}-Backup 进行分流。
            </div>
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                关闭
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors">
                生成应急预案
            </button>
        </div>

      </div>
    </div>
  );
};

export default AnomalyAnalysisModal;