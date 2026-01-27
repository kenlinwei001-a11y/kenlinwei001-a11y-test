import React from 'react';
import { NodeData, NodeType } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Activity, Package, TrendingUp, AlertTriangle } from 'lucide-react';

interface TooltipProps {
  node: NodeData | null;
  position: { x: number; y: number } | null;
}

const Tooltip: React.FC<TooltipProps> = ({ node, position }) => {
  if (!node || !position) return null;

  // Mock data for the sparkline
  const chartData = [
    { name: 'M1', val: 400 },
    { name: 'M2', val: 300 },
    { name: 'M3', val: 550 },
    { name: 'M4', val: 480 },
    { name: 'M5', val: 600 },
    { name: 'M6', val: 580 },
  ];

  return (
    <div
      className="fixed z-50 w-80 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-lg overflow-hidden pointer-events-none transition-opacity duration-200 fade-in"
      style={{
        left: position.x + 20,
        top: position.y - 100,
        opacity: node ? 1 : 0
      }}
    >
      {/* Header */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-800">{node.name}</h3>
          <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">{node.type === NodeType.BASE ? '生产基地' : node.type === NodeType.CUSTOMER ? '核心客户' : '供应商'}</p>
        </div>
        {node.activeAlerts && node.activeAlerts > 0 ? (
           <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
             <AlertTriangle size={12} /> 异常
           </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
             正常
           </span>
        )}
      </div>

      {/* Content Body */}
      <div className="p-4 space-y-4">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3">
          {node.type === NodeType.CUSTOMER && (
            <>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase">预测准确率</p>
                <div className="text-lg font-semibold text-slate-700">{node.deliveryAccuracy?.toFixed(1)}%</div>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase">按时交付率</p>
                <div className="text-lg font-semibold text-blue-600">{node.onTimeRate?.toFixed(1)}%</div>
              </div>
            </>
          )}
          
          {(node.type === NodeType.BASE || node.type === NodeType.SUPPLIER) && (
            <>
               <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase">当前库存</p>
                <div className="text-lg font-semibold text-slate-700">{node.inventoryLevel?.toLocaleString()} <span className="text-xs text-slate-400">Ah</span></div>
              </div>
              {node.type === NodeType.BASE && (
                 <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase">产能利用率</p>
                  <div className="text-lg font-semibold text-purple-600">{node.capacityUtilization?.toFixed(1)}%</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detailed Stats for Customers */}
        {node.type === NodeType.CUSTOMER && (
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-xs text-slate-600">
                <Package size={14} />
                <span>下批次交付: <span className="font-mono font-medium text-slate-900">2024-W12 (12k Pack)</span></span>
             </div>
             <div className="flex items-center gap-2 text-xs text-slate-600">
                <TrendingUp size={14} />
                <span>月度需求趋势 (MWh)</span>
             </div>
             <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={['dataMin', 'dataMax']} />
                    <Line type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
             </div>
          </div>
        )}

        {/* Line Breakdown for Bases */}
        {node.type === NodeType.BASE && (
          <div className="text-xs">
            <p className="text-slate-400 mb-1 uppercase text-[10px]">关联产线运行状态</p>
            <div className="space-y-1">
              <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-1">
                <span>Line A-01 (LFP)</span>
                <span className="text-emerald-600 font-medium">运行中</span>
              </div>
              <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-1">
                <span>Line B-04 (NCM)</span>
                <span className="text-emerald-600 font-medium">运行中</span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span>Line C-09 (Pack)</span>
                <span className="text-amber-500 font-medium">维护中</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tooltip;
