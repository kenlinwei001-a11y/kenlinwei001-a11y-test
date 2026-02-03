
import React, { useMemo } from 'react';
import { GraphData, NodeType, ThemeConfig } from '../types';
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Line, ComposedChart } from 'recharts';
import { Database, Zap, Truck, Factory, BarChart4, ArrowUpRight, LayoutDashboard, Network, Package, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';

interface Props {
  data: GraphData;
  themeConfig?: ThemeConfig;
  onNavigate?: (view: string) => void;
}

const DashboardPanel: React.FC<Props> = ({ data, themeConfig, onNavigate }) => {
  // --- Data Aggregation Logic ---
  const metrics = useMemo(() => {
    const nodes = data.nodes;
    
    // 1. Inventory Stats
    const totalInventory = nodes.reduce((sum, n) => sum + (n.inventoryLevel || 0), 0);
    
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

    return { totalInventory, healthCounts, avgOEE, demandData };
  }, [data]);

  // Mock Trend Data for Sparklines (30 Days)
  const inventoryTrendData = useMemo(() => {
      return Array.from({ length: 30 }, (_, i) => ({
        day: `D-${30-i}`,
        value: metrics.totalInventory * (0.85 + Math.random() * 0.3) // Adds variance
      }));
  }, [metrics.totalInventory]);

  // Mock Capacity Data for summary card (Mini 12-month)
  const capacitySummaryData = Array.from({length: 12}, (_, i) => ({
      name: `M${i+1}`,
      capacity: 100 + Math.random() * 10,
      demand: 80 + (i * 5) + Math.random() * 10 // Growing demand
  }));

  const healthDataPie = [
    { name: '正常', value: metrics.healthCounts.normal, color: '#10b981' },
    { name: '预警', value: metrics.healthCounts.warning, color: '#f59e0b' },
    { name: '异常', value: metrics.healthCounts.critical, color: '#ef4444' },
  ];

  // Helper for Navigation Click
  const handleNav = (view: string) => {
      if (onNavigate) onNavigate(view);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 backdrop-blur-sm w-full">
       <div className="p-6 border-b border-slate-200 bg-white sticky top-0 z-10 flex items-center justify-between">
            <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <LayoutDashboard className="text-indigo-600" size={24}/>
                    全局运营指挥中心 (Global Operations Hub)
                </h2>
                <p className="text-sm text-slate-500 mt-1">Foundry Application Portal - Select a module to manage.</p>
            </div>
            <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                <Zap size={14}/> Live Status: Connected
            </div>
       </div>

       <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Grid Layout for App Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. Topology & Health (Hero Card) */}
                <div 
                    onClick={() => handleNav('graph')}
                    className={`${themeConfig?.heroColor || 'bg-white'} col-span-2 p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer group relative overflow-hidden`}
                >
                    <div className="absolute top-4 right-4 bg-white/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight size={20} className="text-indigo-600"/>
                    </div>
                    
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                                <Network size={20} className="text-indigo-500"/> 全景拓扑监控 (Network Topology)
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">实时监控全网节点状态与物流路径</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-slate-800">{metrics.healthCounts.normal + metrics.healthCounts.warning + metrics.healthCounts.critical}</span>
                            <div className="text-xs text-slate-400 uppercase">Active Nodes</div>
                        </div>
                    </div>

                    <div className="flex gap-8">
                        {/* Mini Pie */}
                        <div className="h-32 w-32 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={healthDataPie} innerRadius={25} outerRadius={40} paddingAngle={2} dataKey="value">
                                        {healthDataPie.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <span className="block text-xs text-slate-400">异常</span>
                                    <span className="block text-lg font-bold text-red-500">{metrics.healthCounts.critical}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Stats List */}
                        <div className="flex-1 space-y-3 pt-2">
                            <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                                <span className="text-sm font-medium text-slate-600">工厂节点</span>
                                <span className="font-bold text-slate-800">10 Bases</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                                <span className="text-sm font-medium text-slate-600">供应商</span>
                                <span className="font-bold text-slate-800">10 Suppliers</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                                <span className="text-sm font-medium text-slate-600">核心客户</span>
                                <span className="font-bold text-slate-800">7 Accounts</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Capacity App Card */}
                <div 
                    onClick={() => handleNav('capacity')}
                    className={`${themeConfig?.capacityColor || 'bg-white'} p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-300 transition-all cursor-pointer group relative`}
                >
                    <div className="absolute top-4 right-4 bg-white/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight size={20} className="text-orange-600"/>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 group-hover:text-orange-600 transition-colors">
                            <BarChart4 size={20} className="text-orange-500"/> 产能预测 (Capacity)
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">12个月滚动资源规划 (RCP)</p>
                    </div>
                    <div className="h-28 w-full pointer-events-none">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={capacitySummaryData}>
                                <Bar dataKey="demand" fill="#cbd5e1" barSize={8} radius={[2,2,0,0]} />
                                <Line type="monotone" dataKey="capacity" stroke="#f97316" strokeWidth={2} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-xs font-bold text-orange-600 flex items-center gap-1">
                        <AlertTriangle size={12}/> 发现未来 3 个瓶颈月
                    </div>
                </div>

                {/* 3. Inventory App Card */}
                <div 
                    onClick={() => handleNav('inventory')}
                    className={`${themeConfig?.inventoryColor || 'bg-white'} p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer group relative`}
                >
                    <div className="absolute top-4 right-4 bg-white/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight size={20} className="text-blue-600"/>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                            <Database size={20} className="text-blue-500"/> 库存健康 (Inventory)
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">多级库存水位监控</p>
                    </div>
                    <div className="flex items-end justify-between mb-4">
                        <div>
                            <div className="text-3xl font-bold text-slate-800">
                                {(metrics.totalInventory / 10000).toFixed(1)} <span className="text-sm font-normal text-slate-400">万Ah</span>
                            </div>
                            <div className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
                                <TrendingUp size={12}/> 环比 +4.2%
                            </div>
                        </div>
                    </div>
                    <div className="h-16 w-full pointer-events-none">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={inventoryTrendData}>
                                <defs>
                                    <linearGradient id="miniInv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#miniInv)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Sales & Ops App Card */}
                <div 
                    onClick={() => handleNav('sales')}
                    className={`${themeConfig?.salesColor || 'bg-white'} p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all cursor-pointer group relative`}
                >
                    <div className="absolute top-4 right-4 bg-white/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight size={20} className="text-emerald-600"/>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                            <Package size={20} className="text-emerald-500"/> 产销协同 (S&OP)
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">订单交付与需求偏差分析</p>
                    </div>
                    <div className="space-y-3">
                        {metrics.demandData.slice(0, 3).map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <span className="font-medium text-slate-600">{item.name}</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 bg-slate-100 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full ${item.isHighDeviation ? 'bg-red-400' : 'bg-emerald-400'}`} 
                                            style={{width: `${Math.min(100, (item.orders/item.forecast)*100)}%`}}
                                        ></div>
                                    </div>
                                    <span className={`text-xs font-bold ${item.isHighDeviation ? 'text-red-500' : 'text-slate-400'}`}>
                                        {(item.deviation * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. Production App Card */}
                <div 
                    onClick={() => handleNav('production')}
                    className={`${themeConfig?.productionColor || 'bg-white'} p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all cursor-pointer group relative`}
                >
                    <div className="absolute top-4 right-4 bg-white/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight size={20} className="text-purple-600"/>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 group-hover:text-purple-600 transition-colors">
                            <Factory size={20} className="text-purple-500"/> 产线监视 (MES)
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">实时设备效率 OEE</p>
                    </div>
                    <div className="flex items-end gap-2 mt-6">
                        <span className="text-5xl font-bold text-indigo-600">{metrics.avgOEE.toFixed(1)}</span>
                        <span className="text-xl font-bold text-slate-400 mb-2">%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-4 mt-4 overflow-hidden">
                        <div 
                            className="h-4 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-1000" 
                            style={{width: `${metrics.avgOEE}%`}}
                        ></div>
                    </div>
                </div>

                {/* 6. Supply App Card (Material) */}
                <div 
                    onClick={() => handleNav('graph')}
                    className={`${themeConfig?.operationsColor || 'bg-white'} p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer group relative`}
                >
                    <div className="absolute top-4 right-4 bg-white/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight size={20} className="text-blue-600"/>
                    </div>
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                            <Truck size={20} className="text-blue-500"/> 物料供应 (Supply)
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">上游原材料到货监控</p>
                    </div>
                    <div className="space-y-4">
                        {[
                            { name: '碳酸锂', status: '充足', stock: '240T' },
                            { name: 'PVDF', status: '紧张', stock: '15T' },
                            { name: '石墨', status: '充足', stock: '850T' },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0">
                                <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-slate-500">{item.stock}</span>
                                    <span className={`w-2 h-2 rounded-full ${item.status === '充足' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
       </div>
    </div>
  );
};

export default DashboardPanel;
