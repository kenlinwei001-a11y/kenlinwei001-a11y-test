
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip as RechartsTooltip } from 'recharts';
import { Calendar as CalendarIcon, Database } from 'lucide-react';

// --- RICH CONTENT WIDGETS ---

export const MiniInventoryChart = ({ data }: { data: any }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mt-3 w-full shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Database size={14}/> 库存趋势监控
            </h4>
            <span className={`text-xs px-2 py-0.5 rounded font-bold ${data.status === 'critical' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {data.status === 'critical' ? '异常 (Critical)' : '正常 (Normal)'}
            </span>
        </div>
        <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.history}>
                    <defs>
                        <linearGradient id="colorInvChat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={data.status === 'critical' ? '#ef4444' : '#3b82f6'} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={data.status === 'critical' ? '#ef4444' : '#3b82f6'} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="day" hide />
                    <RechartsTooltip contentStyle={{fontSize: '12px'}} />
                    <Area type="monotone" dataKey="value" stroke={data.status === 'critical' ? '#ef4444' : '#3b82f6'} fill="url(#colorInvChat)" strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
        <div className="flex justify-between items-center mt-2 text-sm border-t border-slate-100 pt-2">
            <span className="text-slate-500">当前水位: <span className="font-bold text-slate-800">{data.current?.toLocaleString()}</span></span>
            <span className="text-slate-500">安全线: <span className="font-mono">{data.safe?.toLocaleString()}</span></span>
        </div>
    </div>
);

export const MiniProductionTable = ({ data }: { data: any[] }) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-3 shadow-sm w-full">
        <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center gap-2">
            <CalendarIcon size={14} className="text-indigo-500"/>
            <span className="text-xs font-bold text-slate-600 uppercase">排产计划预览</span>
        </div>
        <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                    <th className="px-3 py-2">产线</th>
                    <th className="px-3 py-2">产品</th>
                    <th className="px-3 py-2 text-right">数量</th>
                    <th className="px-3 py-2 text-center">状态</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-700">{row.line}</td>
                        <td className="px-3 py-2 text-slate-600">{row.product}</td>
                        <td className="px-3 py-2 text-right font-mono">{row.qty}</td>
                        <td className="px-3 py-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                row.status === 'Normal' ? 'bg-emerald-100 text-emerald-700' :
                                row.status === 'Full' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                                {row.status}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        <div className="p-2 bg-slate-50 border-t border-slate-200 text-center">
            <button className="text-xs font-bold text-indigo-600 hover:underline">查看完整排产表 &rarr;</button>
        </div>
    </div>
);

export const MiniPlanCards = ({ plans }: { plans: any[] }) => (
    <div className="flex gap-3 mt-3 overflow-x-auto pb-2 w-full">
        {plans.map((plan) => (
            <div key={plan.id} className="min-w-[200px] bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group flex-1">
                <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-slate-800">方案 {plan.id}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        plan.risk === 'Low' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>{plan.risk} Risk</span>
                </div>
                <h5 className="text-xs font-bold text-indigo-700 mb-2 truncate">{plan.name}</h5>
                <p className="text-[10px] text-slate-500 line-clamp-2 mb-3 h-8">{plan.desc}</p>
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2 rounded border border-slate-100">
                    <div>
                        <span className="text-slate-400 block">成本</span>
                        <span className="font-bold text-slate-700">{plan.cost}万</span>
                    </div>
                    <div>
                        <span className="text-slate-400 block">周期</span>
                        <span className="font-bold text-slate-700">{plan.time}天</span>
                    </div>
                </div>
                <button className="w-full mt-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white text-xs font-bold py-1.5 rounded transition-colors">
                    应用此方案
                </button>
            </div>
        ))}
    </div>
);
