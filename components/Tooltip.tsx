import React from 'react';
import { NodeData, NodeType } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Activity, Package, TrendingUp, AlertTriangle, Factory, Truck, CheckCircle, AlertCircle, Clock, ZoomIn } from 'lucide-react';

interface TooltipProps {
  node: NodeData | null;
  position: { x: number; y: number } | null;
  onDrillDown?: (node: NodeData) => void;
}

const Tooltip: React.FC<TooltipProps> = ({ node, position, onDrillDown }) => {
  if (!node || !position) return null;

  const handleDrillDownClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent propagation
    if (onDrillDown && node) {
        onDrillDown(node);
    }
  };

  // Render Base Specific Content (Inventory + Lines)
  const renderBaseContent = () => (
    <div className="space-y-4">
      {/* 1. Inventory Curve Section */}
      <div className="bg-slate-50/50 p-2 rounded border border-slate-100">
        <div className="flex justify-between items-end mb-2">
            <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">实时库存监控 (14天趋势)</p>
                <div className="flex items-baseline gap-1">
                    <span className={`text-xl font-bold ${node.status === 'critical' ? 'text-red-600' : 'text-slate-700'}`}>
                        {node.inventoryLevel?.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400">Ah</span>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-slate-400">库容占用</p>
                <div className="text-xs font-semibold text-slate-600">
                    {Math.round(((node.inventoryLevel || 0) / (node.inventoryCapacity || 30000)) * 100)}%
                </div>
            </div>
        </div>
        
        <div className="h-20 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={node.inventoryHistory || []}>
                    <defs>
                        <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={node.status === 'critical' ? '#ef4444' : '#3b82f6'} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={node.status === 'critical' ? '#ef4444' : '#3b82f6'} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="day" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <RechartsTooltip 
                        contentStyle={{ fontSize: '10px', padding: '4px' }}
                        itemStyle={{ padding: 0 }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={node.status === 'critical' ? '#ef4444' : '#3b82f6'} 
                        fillOpacity={1} 
                        fill="url(#colorInv)" 
                        strokeWidth={2}
                    />
                    {/* Safety Line Simulation */}
                    <Line type="monotone" dataKey="safeLine" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth={1} dot={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
        {node.status === 'critical' && (
            <div 
                onClick={handleDrillDownClick}
                className="mt-1 flex items-start gap-1 text-[10px] text-red-600 bg-red-50 hover:bg-red-100 p-1 rounded cursor-pointer transition-colors border border-transparent hover:border-red-200 group"
            >
                <AlertCircle size={10} className="mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                    <span>库存触及红线，点击查看溯源分析。</span>
                </div>
                <ZoomIn size={10} className="mt-0.5 opacity-0 group-hover:opacity-100 text-red-400" />
            </div>
        )}
      </div>

      {/* 2. Production Line Matrix */}
      <div>
        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1.5 flex items-center gap-1">
            <Factory size={10} /> 产线运行状态 (OEE & 良率)
        </p>
        <div className="grid gap-2">
            {node.productionLines?.map(line => (
                <div key={line.id} className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                            line.status === 'running' ? 'bg-emerald-500 animate-pulse' : 
                            line.status === 'maintenance' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <div>
                            <div className="text-xs font-bold text-slate-700">{line.name}</div>
                            <div className="text-[10px] text-slate-400">{line.currentProduct}</div>
                        </div>
                    </div>
                    <div className="flex gap-3 text-right">
                         <div>
                            <div className="text-[9px] text-slate-400">OEE</div>
                            <div className="text-xs font-mono font-medium text-blue-600">{line.efficiency.toFixed(1)}%</div>
                         </div>
                         <div>
                            <div className="text-[9px] text-slate-400">良率</div>
                            <div className="text-xs font-mono font-medium text-emerald-600">{line.yieldRate.toFixed(1)}%</div>
                         </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );

  // Render Customer Specific Content (Forecast & Orders)
  const renderCustomerContent = () => (
    <div className="space-y-4">
      {/* 1. Demand vs Forecast Chart */}
      <div className="bg-slate-50/50 p-2 rounded border border-slate-100">
         <div className="flex justify-between items-center mb-2">
             <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                 <TrendingUp size={10} /> 需求预测 vs 实际交付
             </p>
             <div className="text-xs font-bold text-slate-700">准确率: {node.deliveryAccuracy?.toFixed(1)}%</div>
         </div>
         <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={
                    node.details?.monthlyForecast?.map((val, i) => ({
                        name: `M${i+1}`,
                        forecast: val,
                        actual: node.details?.actualSales?.[i] || val * (0.9 + Math.random()*0.2)
                    }))
                }>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{fontSize: 9}} tickLine={false} axisLine={false}/>
                    <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="forecast" fill="#cbd5e1" radius={[2,2,0,0]} name="预测" />
                    <Bar dataKey="actual" fill="#3b82f6" radius={[2,2,0,0]} name="实际" />
                </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* 2. Active Orders Table */}
      <div>
         <p className="text-[10px] text-slate-400 uppercase font-bold mb-1.5 flex items-center gap-1">
            <Package size={10} /> 重点在产订单跟踪
        </p>
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-[9px] text-slate-500 font-medium">
                    <tr>
                        <th className="px-2 py-1">订单号/产品</th>
                        <th className="px-2 py-1 text-center">排产进度</th>
                        <th className="px-2 py-1 text-right">交付日</th>
                    </tr>
                </thead>
                <tbody className="text-[10px] divide-y divide-slate-100">
                    {node.activeOrders?.slice(0, 3).map(order => (
                        <tr 
                            key={order.id} 
                            onClick={order.status === 'delayed' ? handleDrillDownClick : undefined}
                            className={order.status === 'delayed' ? 'bg-red-50/50 hover:bg-red-100 cursor-pointer transition-colors' : ''}
                        >
                            <td className="px-2 py-1.5">
                                <div className="font-semibold text-slate-700">{order.id}</div>
                                <div className="text-[9px] text-slate-400 scale-90 origin-left">{order.product}</div>
                            </td>
                            <td className="px-2 py-1.5 align-middle">
                                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-0.5">
                                    <div 
                                        className={`h-1.5 rounded-full ${order.status === 'delayed' ? 'bg-red-400' : 'bg-emerald-400'}`} 
                                        style={{width: `${order.progress}%`}}
                                    ></div>
                                </div>
                                <div className="text-[9px] text-center text-slate-500">{order.progress}%</div>
                            </td>
                            <td className="px-2 py-1.5 text-right whitespace-nowrap">
                                <div className={order.status === 'delayed' ? 'text-red-600 font-bold' : 'text-slate-600'}>
                                    {order.dueDate.slice(5)}
                                </div>
                                {order.status === 'delayed' && <div className="text-[8px] text-red-500 flex items-center justify-end gap-1">已延期 <ZoomIn size={8}/></div>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* 3. Supplying Bases */}
      <div>
         <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center gap-1">
             <Truck size={10} /> 供应协同基地
         </p>
         <div className="flex flex-wrap gap-1">
             {node.supplyingBases?.slice(0, 4).map(base => (
                 <span key={base} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px]">
                     {base}
                 </span>
             ))}
             {(node.supplyingBases?.length || 0) > 4 && <span className="text-[9px] text-slate-400 self-center">...</span>}
         </div>
      </div>
    </div>
  );

  return (
    <div
      className="fixed z-50 w-80 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-lg overflow-hidden transition-opacity duration-200 fade-in pointer-events-auto" 
      style={{
        left: position.x + 20,
        top: position.y - 120, // Shifted up slightly to accommodate larger content
        opacity: node ? 1 : 0,
        pointerEvents: node ? 'auto' : 'none' // Crucial change: Allow pointer events when visible
      }}
    >
      {/* Header */}
      <div 
        className={`px-4 py-3 border-b flex justify-between items-start ${node.status === 'critical' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}
      >
        <div>
          <h3 className={`text-sm font-bold ${node.status === 'critical' ? 'text-red-800' : 'text-slate-800'}`}>{node.name}</h3>
          <p className="text-xs text-slate-500 font-medium tracking-wide uppercase flex items-center gap-1">
              {node.type === NodeType.BASE ? <Factory size={10}/> : node.type === NodeType.CUSTOMER ? <Activity size={10}/> : <Truck size={10}/>}
              {node.type === NodeType.BASE ? '生产基地 (Production Base)' : node.type === NodeType.CUSTOMER ? '核心客户 (Key Account)' : '供应商 (Supplier)'}
          </p>
        </div>
        {node.activeAlerts && node.activeAlerts > 0 ? (
           <div 
             onClick={handleDrillDownClick}
             className="flex flex-col items-end cursor-pointer group"
           >
                <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full shadow-sm group-hover:bg-red-600 transition-colors">
                    <AlertTriangle size={10} /> {node.activeAlerts}项风险
                </span>
                <span className="text-[9px] text-red-600 mt-0.5 font-medium flex items-center gap-1">
                    点击查看分析 <ZoomIn size={8}/>
                </span>
           </div>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
             <CheckCircle size={10} /> 运行正常
           </span>
        )}
      </div>

      {/* Content Body */}
      <div className="p-3">
        {node.type === NodeType.BASE ? renderBaseContent() : 
         node.type === NodeType.CUSTOMER ? renderCustomerContent() : (
            // Fallback for Supplier (Simplified)
            <div className="space-y-3">
                <div className="bg-slate-50 p-2 rounded border border-slate-100 grid grid-cols-2 gap-2">
                    <div>
                        <div className="text-[10px] text-slate-400 uppercase">供应物料库存</div>
                        <div className="text-lg font-bold text-slate-700">{node.inventoryLevel?.toLocaleString()} T</div>
                    </div>
                     <div>
                        <div className="text-[10px] text-slate-400 uppercase">交付准时率</div>
                        <div className="text-lg font-bold text-emerald-600">{node.deliveryAccuracy?.toFixed(1)}%</div>
                    </div>
                </div>
                <div className="text-[10px] text-slate-500">
                    <p className="mb-1"><span className="font-bold">主要供应:</span> 碳酸锂, 隔膜</p>
                    <p><span className="font-bold">物流状态:</span> 正常 (预计2天后抵达宁德)</p>
                </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default Tooltip;