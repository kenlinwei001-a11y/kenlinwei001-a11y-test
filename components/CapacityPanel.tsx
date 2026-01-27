
import React, { useState } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ReferenceLine } from 'recharts';
import { Factory, Users, Box, Zap, AlertTriangle, TrendingUp, Calendar, ChevronRight, Settings, CheckCircle2, AlertOctagon } from 'lucide-react';

// --- Mock Data Generators ---

const PROCESS_STEPS = [
    { id: 'proc_mix', name: '正极搅拌 (Mixing)', type: 'batch' },
    { id: 'proc_coat', name: '高速涂布 (Coating)', type: 'continuous' },
    { id: 'proc_roll', name: '辊压分切 (Calendaring)', type: 'continuous' },
    { id: 'proc_cell', name: '电芯卷绕 (Winding)', type: 'discrete' },
    { id: 'proc_form', name: '化成定容 (Formation)', type: 'batch' },
    { id: 'proc_pack', name: 'Pack组装 (Assembly)', type: 'discrete' }
];

const generateForecastData = () => {
    return Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthLabel = `2024-${(month + 9) % 12 + 1 || 12}月`; // Rolling from Oct
        
        // Base Capacity (Theoretical)
        const maxCap = 12000; 
        
        // Planned Maintenance impact (e.g., Month 2 and 8)
        const maintenanceLoss = (i === 1 || i === 7) ? 2500 : 0;
        
        // Effective Capacity
        const effectiveCap = maxCap - maintenanceLoss;

        // Demand Forecast (Growing)
        const demand = 8000 + (i * 350) + (Math.random() * 1000);

        // Gap
        const gap = demand - effectiveCap;

        return {
            name: monthLabel,
            maxCapacity: maxCap,
            effectiveCapacity: effectiveCap,
            demand: Math.floor(demand),
            gap: Math.floor(gap),
            utilization: (demand / effectiveCap) * 100,
            isBottleneck: demand > effectiveCap
        };
    });
};

const generateDrillDownData = (monthIndex: number) => {
    // Simulate specific constraints for a selected month
    return PROCESS_STEPS.map((proc, idx) => {
        // Randomize status based on process index and month to simulate shifting bottlenecks
        const load = 70 + (monthIndex * 2) + (Math.random() * 20); // Growing load
        let status: 'normal' | 'warning' | 'critical' = 'normal';
        let constraintType = '';
        let details = '';

        if (load > 95) {
            status = 'critical';
            // Determine random cause
            const r = Math.random();
            if (r > 0.6) { constraintType = 'material'; details = 'NCM主材缺货'; }
            else if (r > 0.3) { constraintType = 'labor'; details = '夜班人力不足'; }
            else { constraintType = 'equipment'; details = '设备OEE下降'; }
        } else if (load > 85) {
            status = 'warning';
        }

        return {
            ...proc,
            load: Math.min(100, Math.floor(load)),
            status,
            constraintType,
            details,
            metrics: {
                material: Math.floor(80 + Math.random() * 20), // Material Availability %
                labor: Math.floor(85 + Math.random() * 15),    // Labor Fill Rate %
                equipment: Math.floor(88 + Math.random() * 12) // OEE %
            }
        };
    });
};

const CapacityPanel: React.FC = () => {
    const [forecastData] = useState(generateForecastData());
    const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(0);
    
    // Derived data for the bottom view
    const drillDownData = generateDrillDownData(selectedMonthIndex);
    const selectedMonthData = forecastData[selectedMonthIndex];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 rounded shadow-lg text-sm">
                    <div className="font-bold text-slate-700 mb-2">{label}</div>
                    <div className="space-y-1">
                        <div className="text-emerald-600 font-medium">有效产能: {payload[0].payload.effectiveCapacity} Units</div>
                        <div className="text-blue-600 font-medium">需求预测: {payload[0].payload.demand} Units</div>
                        <div className={`font-bold ${payload[0].payload.gap > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                            {payload[0].payload.gap > 0 ? `缺口: -${payload[0].payload.gap}` : '产能充足'}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">稼动率: {payload[0].payload.utilization.toFixed(1)}%</div>
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
                        <TrendingUp className="text-orange-600" size={24} />
                        12个月滚动产能预测 (RCP)
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Rolling Capacity Planning & Constraint Analysis</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-orange-100">
                        <AlertTriangle size={14}/>
                        发现 {forecastData.filter(d => d.isBottleneck).length} 个产能瓶颈月
                    </div>
                    <div className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2">
                        <Calendar size={14}/>
                        预测版本: V2024-W42
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. Macro Chart */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                        <Factory size={16}/> 供需平衡全景图 (Demand vs. Capacity)
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart 
                                data={forecastData} 
                                margin={{top: 20, right: 20, bottom: 20, left: 0}}
                                onClick={(e) => {
                                    if (e && e.activeTooltipIndex !== undefined) {
                                        setSelectedMonthIndex(e.activeTooltipIndex);
                                    }
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} axisLine={false} tickLine={false} unit="%"/>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                                
                                {/* Background Area for Max Capacity */}
                                <Area yAxisId="left" type="monotone" dataKey="maxCapacity" name="设计产能上限" fill="#f8fafc" stroke="none" />
                                
                                {/* Effective Capacity Line */}
                                <Line yAxisId="left" type="step" dataKey="effectiveCapacity" name="有效产能 (含维保)" stroke="#10b981" strokeWidth={3} dot={false} />
                                
                                {/* Demand Bar */}
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

                                {/* Utilization Line */}
                                <Line yAxisId="right" type="monotone" dataKey="utilization" name="产能利用率" stroke="#f59e0b" strokeWidth={2} dot={{r: 3}} />
                                
                                <ReferenceLine yAxisId="right" y={100} stroke="red" strokeDasharray="3 3" label={{ position: 'right', value: '100%', fill: 'red', fontSize: 10 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-center text-xs text-slate-400">
                        * 点击柱状图可切换下方详情分析视图
                    </div>
                </div>

                {/* 2. Micro Detail Analysis */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-500">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-slate-800">{selectedMonthData.name}</span>
                            <span className="text-sm text-slate-500 font-medium">瓶颈溯源与资源分析</span>
                        </div>
                        {selectedMonthData.isBottleneck ? (
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
                                            <Settings size={12}/> OEE
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
