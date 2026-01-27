import React, { useMemo } from 'react';
import { GraphData, NodeType } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { Activity, Package, TrendingUp, AlertTriangle, Database, Zap, Truck, Factory } from 'lucide-react';

interface Props {
  data: GraphData;
}

const DashboardPanel: React.FC<Props> = ({ data }) => {
  // --- Data Aggregation Logic ---
  const metrics = useMemo(() => {
    const nodes = data.nodes;
    
    // 1. Inventory Stats
    const totalInventory = nodes.reduce((sum, n) => sum + (n.inventoryLevel || 0), 0);
    const avgInventoryUtilization = nodes
        .filter(n => n.inventoryCapacity)
        .reduce((sum, n) => sum + ((n.inventoryLevel || 0) / (n.inventoryCapacity || 1)), 0) / 
        (nodes.filter(n => n.inventoryCapacity).length || 1);

    // 2. Health Status
    const healthCounts = {
        normal: nodes.filter(n => !n.status || n.status === 'normal').length,
        warning: nodes.filter(n => n.status === 'warning').length,
        critical: nodes.filter(n => n.status === 'critical').length,
    };

    // 3. Production Efficiency (Avg OEE of all lines)
    let totalOEE = 0;
    let lineCount = 0;
    nodes.forEach(n => {
        if (n.productionLines) {
            n.productionLines.forEach(l => {
                totalOEE += l.efficiency;
                lineCount++;
            });
        }
    });
    const avgOEE = lineCount > 0 ? totalOEE / lineCount : 0;

    // 4. Forecast vs Orders (Aggregated for Customers)
    const demandData = nodes
        .filter(n => n.type === NodeType.CUSTOMER)
        .map(n => {
            const forecast = n.demandForecast || 0;
            const orders = n.activeOrders?.reduce((s, o) => s + o.volume, 0) || 0;
            // Calculate deviation percentage
            const deviation = forecast > 0 ? Math.abs((orders - forecast) / forecast) : 0;
            
            return {
                name: n.name.slice(0, 4), // Shorten name
                fullName: n.name,
                forecast: forecast,
                orders: orders,
                deviation: deviation,
                isHighDeviation: deviation > 0.2 // Flag if > 20%
            };
        });

    return { totalInventory, avgInventoryUtilization, healthCounts, avgOEE, demandData };
  }, [data]);

  // Mock Trend Data for Sparklines
  const inventoryTrendData = Array.from({ length: 7 }, (_, i) => ({
    day: `D-${7-i}`,
    value: metrics.totalInventory * (0.9 + Math.random() * 0.2)
  }));

  const healthDataPie = [
    { name: '正常', value: metrics.healthCounts.normal, color: '#10b981' },
    { name: '预警', value: metrics.healthCounts.warning, color: '#f59e0b' },
    { name: '异常', value: metrics.healthCounts.critical, color: '#ef4444' },
  ];

  // Custom Tooltip for Forecast Chart
  const ForecastTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
          const data = payload[0].payload;
          return (
              <div className="bg-white p-2 border border-slate-200 rounded shadow-lg text-xs">
                  <div className="font-bold text-slate-700 mb-1">{data.fullName}</div>
                  <div className="flex justify-between gap-4 mb-1">
                      <span className="text-slate-500">预测:</span>
                      <span className="font-mono">{data.forecast.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-4 mb-1">
                      <span className="text-slate-500">实际:</span>
                      <span className="font-mono">{data.orders.toLocaleString()}</span>
                  </div>
                  <div className="pt-1 border-t border-slate-100 flex justify-between gap-4">
                      <span className="text-slate-500">偏差率:</span>
                      <span className={`font-bold ${data.isHighDeviation ? 'text-red-600' : 'text-emerald-600'}`}>
                          {(data.deviation * 100).toFixed(1)}%
                      </span>
                  </div>
                  {data.isHighDeviation && (
                      <div className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                          <AlertTriangle size={10}/> 偏差过大 (>20%)
                      </div>
                  )}
              </div>
          );
      }
      return null;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 backdrop-blur-sm w-full">
       <div className="p-5 border-b border-slate-200 bg-white sticky top-0 z-10 flex items-center justify-between">
            <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="text-blue-600" size={20}/>
                    全局运营看板
                </h2>
                <p className="text-xs text-slate-500 mt-1">Real-time Supply Chain Analytics</p>
            </div>
            <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                <Zap size={12}/> Live
            </div>
       </div>

       <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* 1. Health & Alerts */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                        <AlertTriangle size={12}/> 节点健康分布
                    </h3>
                    <div className="h-24 flex items-center">
                        <ResponsiveContainer width="50%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={healthDataPie} 
                                    innerRadius={25} 
                                    outerRadius={40} 
                                    paddingAngle={2} 
                                    dataKey="value"
                                >
                                    {healthDataPie.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-1">
                            {healthDataPie.map(item => (
                                <div key={item.name} className="flex justify-between text-xs">
                                    <span className="flex items-center gap-1 text-slate-500">
                                        <div className="w-2 h-2 rounded-full" style={{background: item.color}}></div>
                                        {item.name}
                                    </span>
                                    <span className="font-bold">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                     <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Factory size={12}/> 产线综合效率 (OEE)
                    </h3>
                    <div className="flex items-end gap-1 mt-2">
                        <span className="text-3xl font-bold text-indigo-600">{metrics.avgOEE.toFixed(1)}</span>
                        <span className="text-sm font-bold text-slate-400 mb-1">%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                        <div 
                            className="h-2 rounded-full bg-indigo-500 transition-all duration-1000" 
                            style={{width: `${metrics.avgOEE}%`}}
                        ></div>
                    </div>
                </div>
            </div>

            {/* 2. Inventory Overview */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Database size={12}/> 全网库存水位
                    </h3>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-slate-800">
                            {(metrics.totalInventory / 10000).toFixed(2)}
                            <span className="text-sm text-slate-400 font-normal ml-1">万Ah</span>
                        </div>
                        <div className="text-[10px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                            <TrendingUp size={10}/> 环比 +4.2%
                        </div>
                    </div>
                </div>
                <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={inventoryTrendData}>
                            <defs>
                                <linearGradient id="colorTotalInv" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}}/>
                            <Tooltip contentStyle={{fontSize: '12px'}}/>
                            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotalInv)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 3. Forecast vs Demand (UPDATED with Alert Logic) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-1">
                    <Package size={12}/> 客户预测 vs 实际订单
                </h3>
                <div className="h-48 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.demandData} layout="vertical" margin={{left: 10, right: 10}}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9"/>
                            <XAxis type="number" hide/>
                            <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false}/>
                            <Tooltip cursor={{fill: '#f8fafc'}} content={<ForecastTooltip />} />
                            <Legend wrapperStyle={{fontSize: '10px'}}/>
                            <Bar dataKey="forecast" name="预测需求" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={8} />
                            
                            {/* Conditional Rendering for Order Bars */}
                            <Bar dataKey="orders" name="在手订单" radius={[0, 4, 4, 0]} barSize={8}>
                                {metrics.demandData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.isHighDeviation ? '#ef4444' : '#3b82f6'} 
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-end gap-3 mt-2 text-[9px] text-slate-400">
                     <div className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-300 rounded-sm"></div>预测</div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-sm"></div>正常订单</div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-sm"></div>偏差>20%</div>
                </div>
            </div>

            {/* 4. Material Data List */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                    <Truck size={12}/> 关键物料供应监控
                </h3>
                <div className="space-y-2">
                    {[
                        { name: '电池级碳酸锂', status: '充足', trend: 'stable', stock: '240T' },
                        { name: 'PVDF粘结剂', status: '紧张', trend: 'down', stock: '15T' },
                        { name: '负极石墨', status: '充足', trend: 'up', stock: '850T' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 text-xs">
                            <span className="font-medium text-slate-700">{item.name}</span>
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-slate-600">{item.stock}</span>
                                <span className={`px-1.5 py-0.5 rounded ${
                                    item.status === '充足' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                } font-bold`}>{item.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

       </div>
    </div>
  );
};

export default DashboardPanel;