
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ReferenceLine } from 'recharts';
import { Factory, Users, Box, Zap, AlertTriangle, TrendingUp, Calendar, ChevronRight, Settings, CheckCircle2, AlertOctagon, ChevronDown, CalendarRange } from 'lucide-react';
import { GraphData, NodeType } from '../types';

interface Props {
    data: GraphData;
}

// Fixed process steps for the industry
const PROCESS_STEPS = [
    { id: 'proc_mix', name: '搅拌 (Mix)', type: 'batch' },
    { id: 'proc_coat', name: '涂布 (Coat)', type: 'continuous' },
    { id: 'proc_roll', name: '辊压 (Roll)', type: 'continuous' },
    { id: 'proc_cell', name: '卷绕 (Wind)', type: 'discrete' },
    { id: 'proc_form', name: '化成 (Form)', type: 'batch' },
    { id: 'proc_pack', name: 'Pack (Assy)', type: 'discrete' }
];

const CapacityPanel: React.FC<Props> = ({ data }) => {
    // 1. Get Actual Bases from Graph Data
    const bases = useMemo(() => {
        return data.nodes.filter(n => n.type === NodeType.BASE);
    }, [data]);

    const [selectedBaseId, setSelectedBaseId] = useState<string>(bases[0]?.id || '');
    const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(0);

    const selectedBase = bases.find(b => b.id === selectedBaseId) || bases[0];

    // 2. Generate Forecast Data (Simulated relative to selected base capacity)
    const forecastData = useMemo(() => {
        const baseCap = selectedBase?.inventoryCapacity || 10000;
        return Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            const monthLabel = `2024-${(month + 9) % 12 + 1 || 12}月`;
            
            // Capacity Logic
            const maxCap = baseCap * 1.2; // Theoretical max slightly higher than inventory cap
            const maintenanceLoss = (i === 1 || i === 7) ? maxCap * 0.2 : 0;
            const effectiveCap = maxCap - maintenanceLoss;

            // Demand Forecast (Randomized around capacity)
            const demand = maxCap * (0.8 + Math.random() * 0.4); 
            const gap = demand - effectiveCap;

            return {
                name: monthLabel,
                maxCapacity: maxCap,
                effectiveCapacity: effectiveCap,
                demand: Math.floor(demand),
                gap: Math.floor(gap),
                utilization: Math.min(100, (demand / effectiveCap) * 100),
                isBottleneck: demand > effectiveCap
            };
        });
    }, [selectedBase]);

    // 3. Generate Drill-Down Process Data
    const drillDownData = useMemo(() => {
        if (!selectedBase) return [];
        const baseFactor = (selectedBase.inventoryLevel || 5000) / 10000;
        
        return PROCESS_STEPS.map((proc, idx) => {
            // Randomize status based on base health and index
            const load = 75 + (idx * 3) + (baseFactor * 10) + (Math.random() * 10);
            let status: 'normal' | 'warning' | 'critical' = 'normal';
            let constraintType = '';
            let details = '';

            // Use the base's overall status to influence process status
            if (selectedBase.status === 'critical' && idx === 4) { // Simulate critical formation bottleneck
                 status = 'critical';
                 constraintType = 'equipment'; 
                 details = '化成柜容量不足';
            } else if (load > 92) {
                status = 'warning';
            }

            return {
                ...proc,
                load: Math.min(100, Math.floor(load)),
                status,
                constraintType,
                details,
                metrics: {
                    material: Math.floor(90 + Math.random() * 10),
                    labor: Math.floor(88 + Math.random() * 12),
                    equipment: Math.floor(92 + Math.random() * 8)
                }
            };
        });
    }, [selectedBase, selectedMonthIndex]);

    const selectedMonthData = forecastData[selectedMonthIndex];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 rounded shadow-lg text-sm">
                    <div className="font-bold text-slate-700 mb-2">{label}</div>
                    <div className="space-y-1">
                        <div className="text-emerald-600 font-medium">有效产能: {payload[0].payload.effectiveCapacity.toFixed(0)}</div>
                        <div className="text-blue-600 font-medium">需求预测: {payload[0].payload.demand}</div>
                        <div className={`font-bold ${payload[0].payload.gap > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                            {payload[0].payload.gap > 0 ? `缺口: -${payload[0].payload.gap}` : '产能充足'}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">利用率: {payload[0].payload.utilization.toFixed(1)}%</div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 w-full">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-white sticky top-0 z-10 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <CalendarRange className="text-orange-600" size={24} />
                        产能规划 (Capacity Planning)
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Rolling Capacity Planning & Constraint Analysis</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-orange-100">
                        <AlertTriangle size={14}/>
                        发现 {forecastData.filter(d => d.isBottleneck).length} 个瓶颈月份
                    </div>
                    <div className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2">
                        <Calendar size={14}/>
                        预测版本: V2024-W46
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. Macro Chart */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Factory size={16}/> 供需平衡全景图 (Demand vs. Capacity)
                        </h3>
                        {/* Base Switcher */}
                        <div className="relative">
                            <select 
                                value={selectedBaseId}
                                onChange={(e) => setSelectedBaseId(e.target.value)}
                                className="appearance-none bg-slate-50 border border-slate-200 hover:border-indigo-300 text-slate-700 text-sm font-bold rounded-lg pl-3 pr-8 py-2 outline-none cursor-pointer transition-all focus:ring-2 focus:ring-indigo-100"
                            >
                                {bases.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none"/>
                        </div>
                    </div>

                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart 
                                data={forecastData} 
                                margin={{top: 20, right: 20, bottom: 20, left: 0}}
                                onClick={(e) => {
                                    if (e && e.activeTooltipIndex !== undefined) {
                                        setSelectedMonthIndex(Number(e.activeTooltipIndex));
                                    }
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} axisLine={false} tickLine={false} unit="%"/>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                                
                                <Area yAxisId="left" type="monotone" dataKey="maxCapacity" name="设计产能上限" fill="#f8fafc" stroke="none" />
                                <Line yAxisId="left" type="step" dataKey="effectiveCapacity" name="有效产能" stroke="#10b981" strokeWidth={3} dot={false} />
                                <Bar yAxisId="left" dataKey="demand" name="需求预测" barSize={32} radius={[4, 4, 0, 0]}>
                                    {forecastData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.isBottleneck ? '#ef4444' : '#3b82f6'} 
                                            opacity={selectedMonthIndex === index ? 1 : 0.6}
                                            cursor="pointer"
                                        />
                                    ))}
                                </Bar>
                                <Line yAxisId="right" type="monotone" dataKey="utilization" name="产能利用率" stroke="#f59e0b" strokeWidth={2} dot={{r: 3}} />
                                <ReferenceLine yAxisId="right" y={100} stroke="red" strokeDasharray="3 3" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-center text-xs text-slate-400">
                        * 点击柱状图可切换下方工序级详情分析
                    </div>
                </div>

                {/* 2. Micro Detail Analysis */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-500">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-slate-800">{selectedMonthData?.name}</span>
                            <span className="text-sm text-slate-500 font-medium">瓶颈溯源与资源分析 @ {selectedBase?.name}</span>
                        </div>
                        {selectedMonthData?.isBottleneck ? (
                            <span className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-sm font-bold">
                                <AlertOctagon size={16}/> 产能缺口: -{selectedMonthData.gap} Units
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-bold">
                                <CheckCircle2 size={16}/> 产能充裕
                            </span>
                        )}
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-4">
                            {/* Header Row */}
                            <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-400 uppercase border-b border-slate-100 pb-2 mb-2 px-2">
                                <div className="col-span-3">工艺环节 (Process)</div>
                                <div className="col-span-2 text-center">负荷率 (Load)</div>
                                <div className="col-span-2 text-center">物料 (Material)</div>
                                <div className="col-span-2 text-center">人工 (Labor)</div>
                                <div className="col-span-2 text-center">设备 (OEE)</div>
                                <div className="col-span-1 text-center">状态</div>
                            </div>

                            {drillDownData.map((proc) => (
                                <div key={proc.id} className={`grid grid-cols-12 gap-4 items-center p-3 rounded-lg border transition-all ${proc.status === 'critical' ? 'bg-red-50 border-red-200' : proc.status === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                    
                                    {/* Name */}
                                    <div className="col-span-3">
                                        <div className="font-bold text-slate-700 text-sm">{proc.name}</div>
                                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                            {proc.status === 'critical' && <AlertTriangle size={10} className="text-red-500"/>}
                                            {proc.status === 'critical' ? <span className="text-red-600 font-medium">{proc.details}</span> : proc.type}
                                        </div>
                                    </div>

                                    {/* Load Bar */}
                                    <div className="col-span-2 px-2">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-500">Utilization</span>
                                            <span className={`font-bold ${proc.load > 95 ? 'text-red-600' : 'text-slate-700'}`}>{proc.load}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${proc.load > 95 ? 'bg-red-500' : proc.load > 85 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                                style={{width: `${proc.load}%`}}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Material Metric */}
                                    <div className="col-span-2 flex flex-col items-center border-l border-slate-100/50">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                                            <Box size={12}/> 供料率
                                        </div>
                                        <div className={`font-bold font-mono text-sm ${proc.metrics.material < 90 ? 'text-red-600' : 'text-slate-700'}`}>
                                            {proc.metrics.material}%
                                        </div>
                                    </div>

                                    {/* Labor Metric */}
                                    <div className="col-span-2 flex flex-col items-center border-l border-slate-100/50">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                                            <Users size={12}/> 到岗率
                                        </div>
                                        <div className={`font-bold font-mono text-sm ${proc.metrics.labor < 90 ? 'text-amber-600' : 'text-slate-700'}`}>
                                            {proc.metrics.labor}%
                                        </div>
                                    </div>

                                    {/* Equipment Metric */}
                                    <div className="col-span-2 flex flex-col items-center border-l border-slate-100/50">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                                            <Zap size={12}/> OEE
                                        </div>
                                        <div className={`font-bold font-mono text-sm ${proc.metrics.equipment < 85 ? 'text-red-600' : 'text-slate-700'}`}>
                                            {proc.metrics.equipment}%
                                        </div>
                                    </div>

                                    {/* Action/Status */}
                                    <div className="col-span-1 flex justify-center">
                                        {proc.status === 'critical' ? (
                                            <button className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors shadow-sm">
                                                <ChevronRight size={16}/>
                                            </button>
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                        )}
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

export default CapacityPanel;
