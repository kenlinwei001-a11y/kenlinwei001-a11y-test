import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ShoppingCart, Filter, Download } from 'lucide-react';

const SalesPanel: React.FC = () => {
  // Mock Data: 12 Months Forecast vs Orders
  const forecastData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const forecast = Math.floor(Math.random() * 50) + 100; // GWh
    return {
      name: `2024-${month.toString().padStart(2, '0')}`,
      forecast: forecast,
      orders: Math.floor(forecast * (0.8 + Math.random() * 0.3)), // GWh
    };
  });

  // Detailed Order Data (Lithium Industry Specifics)
  const orderDetails = [
    { id: 'ORD-2410-001', customer: '小鹏汽车', type: '动力', tech: 'NCM811', format: '方壳', model: 'XP-590', qty: '12,000', unit: 'Packs', status: 'In Prod' },
    { id: 'ORD-2410-002', customer: '广汽埃安', type: '动力', tech: 'LFP', format: '弹匣', model: 'Y76', qty: '45,000', unit: 'Cells', status: 'Delayed' },
    { id: 'ORD-2410-003', customer: '国家电网', type: '储能', tech: 'LFP', format: '方壳', model: '280Ah', qty: '80,000', unit: 'Cells', status: 'Planned' },
    { id: 'ORD-2410-004', customer: '长安深蓝', type: '动力', tech: 'NCM523', format: '软包', model: 'SL-03', qty: '8,500', unit: 'Packs', status: 'In Prod' },
    { id: 'ORD-2410-005', customer: '零跑汽车', type: '动力', tech: 'LFP', format: '圆柱', model: '4680', qty: '120,000', unit: 'Cells', status: 'In Prod' },
    { id: 'ORD-2410-006', customer: '出口-BMW', type: '动力', tech: 'NCM811', format: '方壳', model: 'Gen5', qty: '15,000', unit: 'Packs', status: 'Shipping' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50/50 w-full">
      <div className="p-5 border-b border-slate-200 bg-white sticky top-0 z-10">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <ShoppingCart className="text-emerald-600" size={20}/>
          产销计划协同 (S&OP)
        </h2>
        <p className="text-xs text-slate-500 mt-1">Sales Forecast & Production Orders</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Chart: Forecast vs Actual */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">12个月销售预测 vs 实际排产 (GWh)</h3>
            <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecastData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                        <XAxis dataKey="name" tick={{fontSize: 10}} tickLine={false} axisLine={false}/>
                        <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false}/>
                        <Tooltip contentStyle={{fontSize: '12px'}} cursor={{fill: '#f8fafc'}}/>
                        <Legend wrapperStyle={{fontSize: '10px'}}/>
                        <Bar dataKey="forecast" name="销售预测" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="orders" name="确 认订单" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Detailed Order Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="text-xs font-bold text-slate-500 uppercase">重点在产订单明细</h3>
                 <div className="flex gap-2">
                    <button className="p-1.5 hover:bg-white rounded border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                        <Filter size={14}/>
                    </button>
                    <button className="p-1.5 hover:bg-white rounded border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                        <Download size={14}/>
                    </button>
                 </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold">
                        <tr>
                            <th className="px-3 py-2">订单号/客户</th>
                            <th className="px-3 py-2">技术路线</th>
                            <th className="px-3 py-2">产品型号</th>
                            <th className="px-3 py-2 text-right">排产数量</th>
                            <th className="px-3 py-2 text-center">状态</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {orderDetails.map((order, i) => (
                            <tr key={i} className="hover:bg-slate-50 group cursor-pointer">
                                <td className="px-3 py-2.5">
                                    <div className="font-bold text-slate-700">{order.customer}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{order.id}</div>
                                </td>
                                <td className="px-3 py-2.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${order.type === '动力' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {order.type}
                                        </span>
                                        <span className="text-slate-600">{order.tech}</span>
                                    </div>
                                </td>
                                <td className="px-3 py-2.5 text-slate-600">
                                    <div>{order.model}</div>
                                    <div className="text-[10px] text-slate-400">{order.format}</div>
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                                    {order.qty}
                                    <span className="ml-1 text-[10px] text-slate-400">{order.unit}</span>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                    <span className={`inline-block w-2 h-2 rounded-full ${
                                        order.status === 'In Prod' ? 'bg-emerald-500 animate-pulse' :
                                        order.status === 'Delayed' ? 'bg-red-500' :
                                        order.status === 'Shipping' ? 'bg-blue-500' : 'bg-slate-300'
                                    }`}></span>
                                    <div className="text-[10px] mt-0.5 text-slate-500">{order.status}</div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SalesPanel;