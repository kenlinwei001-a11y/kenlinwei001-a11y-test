
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ShoppingCart, Filter, Download, Search, TrendingUp } from 'lucide-react';
import { GraphData, NodeType, OrderData } from '../types';

interface Props {
    data: GraphData;
}

const SalesPanel: React.FC<Props> = ({ data }) => {
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');

  // 1. Aggregate Forecast vs Orders (Aggregated across all Customers)
  const forecastChartData = useMemo(() => {
      const customers = data.nodes.filter(n => n.type === NodeType.CUSTOMER);
      
      // Initialize rolling 12 months buckets
      const buckets = Array.from({ length: 12 }, (_, i) => {
          const m = i + 1; // 1 to 12
          return {
              name: `2024-${m.toString().padStart(2, '0')}`,
              forecast: 0,
              orders: 0
          };
      });

      customers.forEach(cust => {
          if (cust.details?.monthlyForecast) {
              cust.details.monthlyForecast.forEach((val, idx) => {
                  if (idx < 12) buckets[idx].forecast += val;
              });
          }
          // Simple heuristic to distribute orders into buckets based on due date
          if (cust.activeOrders) {
              cust.activeOrders.forEach(order => {
                  const date = new Date(order.dueDate);
                  const monthIdx = date.getMonth(); // 0-11
                  if (monthIdx >= 0 && monthIdx < 12) {
                      buckets[monthIdx].orders += order.volume;
                  }
              });
          }
      });

      return buckets;
  }, [data]);

  // 2. Flatten Order List
  const allOrders = useMemo(() => {
      const orders: (OrderData & { customerName: string })[] = [];
      const customers = customerFilter === 'ALL' 
        ? data.nodes.filter(n => n.type === NodeType.CUSTOMER)
        : data.nodes.filter(n => n.type === NodeType.CUSTOMER && n.id === customerFilter);

      customers.forEach(cust => {
          if (cust.activeOrders) {
              cust.activeOrders.forEach(o => {
                  orders.push({ ...o, customerName: cust.name });
              });
          }
      });
      return orders;
  }, [data, customerFilter]);

  // Unique customers for filter
  const customerOptions = useMemo(() => {
      return data.nodes
        .filter(n => n.type === NodeType.CUSTOMER)
        .map(n => ({ id: n.id, name: n.name }));
  }, [data]);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 w-full">
      <div className="p-6 border-b border-slate-200 bg-white sticky top-0 z-10 flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-emerald-600" size={24}/>
            销售预测 (Sales Forecast)
            </h2>
            <p className="text-sm text-slate-500 mt-1">Rolling Forecast & Order Book Management</p>
        </div>
        <div className="flex gap-2">
            <div className="relative">
                <select 
                    className="appearance-none bg-slate-100 border border-transparent hover:border-slate-300 text-slate-600 text-sm font-bold rounded-lg pl-3 pr-8 py-2 outline-none cursor-pointer transition-all"
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                >
                    <option value="ALL">全部客户</option>
                    {customerOptions.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <Filter size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none"/>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Chart: Forecast vs Actual */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">12个月滚动预测 vs 实际订单 (Aggregate Units)</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecastChartData} margin={{top: 10, right: 10, left: -10, bottom: 0}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                        <XAxis dataKey="name" tick={{fontSize: 12}} tickLine={false} axisLine={false}/>
                        <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false}/>
                        <Tooltip contentStyle={{fontSize: '14px'}} cursor={{fill: '#f8fafc'}}/>
                        <Legend wrapperStyle={{fontSize: '12px'}}/>
                        <Bar dataKey="forecast" name="销售预测" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="orders" name="确认订单" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Detailed Order Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                     <Search size={16}/> 重点在产订单明细 ({allOrders.length})
                 </h3>
                 <button className="p-2 hover:bg-white rounded border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                    <Download size={16}/>
                 </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3">客户 / 订单号</th>
                            <th className="px-4 py-3">产品型号</th>
                            <th className="px-4 py-3 text-right">数量</th>
                            <th className="px-4 py-3 text-center">排产进度</th>
                            <th className="px-4 py-3 text-right">交付日</th>
                            <th className="px-4 py-3 text-center">状态</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {allOrders.map((order, i) => (
                            <tr key={i} className="hover:bg-slate-50 group cursor-pointer transition-colors">
                                <td className="px-4 py-3">
                                    <div className="font-bold text-slate-700">{order.customerName}</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{order.id}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-600 font-medium">
                                    {order.product}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-slate-700 font-bold">
                                    {order.volume.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 align-middle w-32">
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1">
                                        <div 
                                            className={`h-1.5 rounded-full ${order.status === 'delayed' ? 'bg-red-400' : 'bg-emerald-400'}`} 
                                            style={{width: `${order.progress}%`}}
                                        ></div>
                                    </div>
                                    <div className="text-[10px] text-center text-slate-400">{order.progress}%</div>
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-slate-600 text-xs">
                                    {order.dueDate}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        order.status === 'on-track' ? 'bg-emerald-50 text-emerald-600' :
                                        order.status === 'delayed' ? 'bg-red-50 text-red-600' :
                                        'bg-amber-50 text-amber-600'
                                    }`}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {allOrders.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-8 text-slate-400">无符合条件的订单数据</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SalesPanel;
