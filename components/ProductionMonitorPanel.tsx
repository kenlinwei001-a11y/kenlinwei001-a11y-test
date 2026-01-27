import React, { useState } from 'react';
import { Factory, ChevronDown, ChevronRight, Activity, Zap, AlertTriangle, Settings } from 'lucide-react';

const ProductionMonitorPanel: React.FC = () => {
  const [expandedBases, setExpandedBases] = useState<string[]>(['base-1']); // Default expand first one

  const bases = [
    { id: 'base-1', name: '常州基地 (Jintan)', capacity: '20GWh', lines: 12, status: 'normal' },
    { id: 'base-2', name: '洛阳基地 (Luoyang)', capacity: '10GWh', lines: 6, status: 'warning' },
    { id: 'base-3', name: '厦门基地 (Xiamen)', capacity: '15GWh', lines: 8, status: 'normal' },
    { id: 'base-4', name: '成都基地 (Chengdu)', capacity: '12GWh', lines: 8, status: 'normal' },
    { id: 'base-5', name: '武汉基地 (Wuhan)', capacity: '10GWh', lines: 6, status: 'critical' },
  ];

  // Lithium Battery Manufacturing Process Steps
  const processSteps = [
    { id: 'p1', name: '搅拌', code: 'MIX' },
    { id: 'p2', name: '涂布', code: 'COAT' },
    { id: 'p3', name: '辊压', code: 'CAL' },
    { id: 'p4', name: '分切', code: 'SLIT' },
    { id: 'p5', name: '卷绕', code: 'WIND' },
    { id: 'p6', name: '装配', code: 'ASSY' },
    { id: 'p7', name: '化成', code: 'FORM' },
    { id: 'p8', name: '分容', code: 'GRAD' },
  ];

  const toggleBase = (id: string) => {
    setExpandedBases(prev => 
        prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const getStepStatus = (baseIdx: number, lineIdx: number, stepIdx: number) => {
      // Deterministic pseudo-random for UI stability
      const val = (baseIdx * 100 + lineIdx * 10 + stepIdx * 7) % 100;
      if (val > 95) return 'error';
      if (val > 85) return 'warning';
      if (val > 80) return 'maintenance';
      return 'running';
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 w-full">
      <div className="p-5 border-b border-slate-200 bg-white sticky top-0 z-10">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Factory className="text-indigo-600" size={20}/>
          基地产线工序监控
        </h2>
        <div className="flex justify-between items-end mt-1">
             <p className="text-xs text-slate-500">MES Real-time Data Feed</p>
             <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">覆盖 8 大基地 / 100+ 产线</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {bases.map((base, baseIdx) => (
            <div key={base.id} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div 
                    className="p-3 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => toggleBase(base.id)}
                >
                    <div className="flex items-center gap-2">
                        {expandedBases.includes(base.id) ? <ChevronDown size={16} className="text-slate-400"/> : <ChevronRight size={16} className="text-slate-400"/>}
                        <div>
                            <span className="font-bold text-sm text-slate-700">{base.name}</span>
                            <span className="ml-2 text-[10px] text-slate-400">产能: {base.capacity}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="flex items-center gap-1 text-[10px] text-slate-500">
                             <Settings size={12}/> {base.lines} 条产线
                         </div>
                         {base.status === 'normal' ? (
                             <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded"><Activity size={10}/> 正常</span>
                         ) : base.status === 'warning' ? (
                             <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded"><AlertTriangle size={10}/> 预警</span>
                         ) : (
                             <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded"><AlertTriangle size={10}/> 异常</span>
                         )}
                    </div>
                </div>

                {expandedBases.includes(base.id) && (
                    <div className="p-3 border-t border-slate-100 space-y-3">
                        {/* Process Header */}
                        <div className="flex pl-16 pr-2 gap-1 text-[9px] font-bold text-slate-400 uppercase text-center">
                            {processSteps.map(step => (
                                <div key={step.id} className="flex-1">{step.name}</div>
                            ))}
                        </div>

                        {/* Lines Rows */}
                        {Array.from({length: base.lines}).map((_, lineIdx) => (
                            <div key={lineIdx} className="flex items-center gap-2 text-xs">
                                <div className="w-14 font-medium text-slate-600 shrink-0 text-right pr-2">Line {lineIdx + 1}</div>
                                <div className="flex-1 flex gap-1 h-6">
                                    {processSteps.map((step, stepIdx) => {
                                        const status = getStepStatus(baseIdx, lineIdx, stepIdx);
                                        const color = status === 'running' ? 'bg-emerald-400' :
                                                      status === 'warning' ? 'bg-amber-400' :
                                                      status === 'error' ? 'bg-red-500' : 'bg-slate-300';
                                        
                                        return (
                                            <div key={step.id} className={`flex-1 rounded-sm ${color} relative group cursor-pointer hover:opacity-80 transition-opacity`}>
                                                {/* Tooltip on Hover */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap z-20">
                                                    {step.name}: {status === 'running' ? 'Running' : status === 'error' ? 'Fault' : 'Idle'}
                                                    <br/>OEE: {status === 'running' ? '98.2%' : '0%'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="w-8 text-center font-mono text-[10px] text-slate-400">92%</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ))}
      </div>
    </div>
  );
};

export default ProductionMonitorPanel;