
import React, { useState } from 'react';
import { Factory, ChevronDown, ChevronRight, Activity, Zap, AlertTriangle, Settings, User, Phone, MessageSquare, ArrowRight, ClipboardCheck } from 'lucide-react';

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

  // Mock Detailed Error Data
  const getErrorDetails = (status: string) => {
      if (status === 'error') {
          return {
              code: 'E-502: 伺服电机过载',
              reason: '卷绕机张力控制系统异常，导致极片断裂。传感器读数波动超过阈值 15%。',
              owner: '张伟 (设备科)',
              contact: '138-xxxx-9876',
              suggestion: '立即停机检查伺服驱动器参数，建议更换 2# 张力传感器。',
              progress: '维修人员已进场 (15 min)'
          };
      }
      if (status === 'warning') {
          return {
              code: 'W-201: 湿度超标预警',
              reason: '涂布车间除湿机效率下降，当前露点 -35℃ (标准 <-40℃)。',
              owner: '李娜 (环境组)',
              contact: '139-xxxx-1234',
              suggestion: '检查除湿转轮状态，开启备用除湿机组。',
              progress: '正在调整 (5 min)'
          };
      }
      return null;
  };

  const WarningTooltip = ({ details }: { details: any }) => (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
          <div className={`px-4 py-3 border-b flex justify-between items-start ${details.code.startsWith('E') ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
              <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className={details.code.startsWith('E') ? 'text-red-600' : 'text-amber-600'} />
                  <span className={`font-bold text-sm ${details.code.startsWith('E') ? 'text-red-800' : 'text-amber-800'}`}>{details.code.split(':')[0]}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${details.code.startsWith('E') ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>
                  {details.code.startsWith('E') ? '异常' : '预警'}
              </span>
          </div>
          <div className="p-4 space-y-3">
              <div>
                  <div className="text-xs text-slate-400 font-bold uppercase mb-1">原因分析</div>
                  <div className="text-xs text-slate-700 leading-relaxed">{details.reason}</div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                      <User size={14} />
                  </div>
                  <div>
                      <div className="text-xs font-bold text-slate-700">{details.owner}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Phone size={10}/> {details.contact}
                      </div>
                  </div>
                  <div className="ml-auto">
                      <button className="text-[10px] bg-white border border-slate-300 px-2 py-1 rounded hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                          呼叫
                      </button>
                  </div>
              </div>
              <div>
                  <div className="text-xs text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><ClipboardCheck size={12}/> AI 建议</div>
                  <div className="text-xs text-slate-600 bg-emerald-50 border border-emerald-100 p-2 rounded text-emerald-800">
                      {details.suggestion}
                  </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">处理状态: <span className="font-bold text-slate-600">{details.progress}</span></span>
                  <ArrowRight size={12} className="text-slate-300"/>
              </div>
          </div>
          {/* Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-slate-200 rotate-45"></div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50/50 w-full">
      <div className="p-6 border-b border-slate-200 bg-white sticky top-0 z-10">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Factory className="text-indigo-600" size={24}/>
          基地产线工序监控
        </h2>
        <div className="flex justify-between items-end mt-2">
             <p className="text-sm text-slate-500">MES Real-time Data Feed</p>
             <span className="text-xs bg-slate-100 px-3 py-1 rounded text-slate-600 font-medium">覆盖 8 大基地 / 100+ 产线</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        
        {bases.map((base, baseIdx) => (
            <div key={base.id} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div 
                    className="p-4 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => toggleBase(base.id)}
                >
                    <div className="flex items-center gap-3">
                        {expandedBases.includes(base.id) ? <ChevronDown size={18} className="text-slate-400"/> : <ChevronRight size={18} className="text-slate-400"/>}
                        <div>
                            <span className="font-bold text-base text-slate-700">{base.name}</span>
                            <span className="ml-3 text-xs text-slate-400">产能: {base.capacity}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="flex items-center gap-1 text-xs text-slate-500">
                             <Settings size={14}/> {base.lines} 条产线
                         </div>
                         {base.status === 'normal' ? (
                             <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded"><Activity size={12}/> 正常</span>
                         ) : base.status === 'warning' ? (
                             <span className="flex items-center gap-1 text-xs text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded"><AlertTriangle size={12}/> 预警</span>
                         ) : (
                             <span className="flex items-center gap-1 text-xs text-red-600 font-bold bg-red-50 px-3 py-1 rounded"><AlertTriangle size={12}/> 异常</span>
                         )}
                    </div>
                </div>

                {expandedBases.includes(base.id) && (
                    <div className="p-4 border-t border-slate-100 space-y-3">
                        {/* Process Header */}
                        <div className="flex pl-20 pr-3 gap-2 text-[11px] font-bold text-slate-400 uppercase text-center">
                            {processSteps.map(step => (
                                <div key={step.id} className="flex-1">{step.name}</div>
                            ))}
                        </div>

                        {/* Lines Rows */}
                        {Array.from({length: base.lines}).map((_, lineIdx) => (
                            <div key={lineIdx} className="flex items-center gap-3 text-sm">
                                <div className="w-16 font-medium text-slate-600 shrink-0 text-right pr-2">Line {lineIdx + 1}</div>
                                <div className="flex-1 flex gap-2 h-8">
                                    {processSteps.map((step, stepIdx) => {
                                        const status = getStepStatus(baseIdx, lineIdx, stepIdx);
                                        const color = status === 'running' ? 'bg-emerald-400' :
                                                      status === 'warning' ? 'bg-amber-400' :
                                                      status === 'error' ? 'bg-red-500' : 'bg-slate-300';
                                        
                                        const errorDetails = (status === 'error' || status === 'warning') ? getErrorDetails(status) : null;

                                        return (
                                            <div key={step.id} className={`flex-1 rounded-sm ${color} relative group cursor-pointer hover:opacity-80 transition-opacity`}>
                                                {/* Tooltip on Hover */}
                                                {errorDetails ? (
                                                    <div className="hidden group-hover:block">
                                                        <WarningTooltip details={{...errorDetails, code: errorDetails.code}} />
                                                    </div>
                                                ) : (
                                                    // Standard Tooltip for normal items
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs px-3 py-2 rounded whitespace-nowrap z-20 shadow-lg pointer-events-none">
                                                        <div className="font-bold">{step.name}</div>
                                                        <div>Status: {status === 'running' ? 'Running' : 'Idle'}</div>
                                                        <div>OEE: {status === 'running' ? '98.2%' : '0%'}</div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="w-10 text-center font-mono text-xs text-slate-400">92%</div>
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
