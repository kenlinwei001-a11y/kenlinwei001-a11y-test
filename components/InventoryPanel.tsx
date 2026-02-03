
import React, { useState } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, Cell } from 'recharts';
import { Package, AlertCircle, TrendingDown, Clock, MapPin, Layers, AlertTriangle } from 'lucide-react';
import { GraphData } from '../types';

interface Props {
  data: GraphData;
}

// Custom Types for detailed inventory
interface InventoryDataPoint {
  name: string; // Month
  rawMaterial: number;
  wip: number;
  finishedGoods: number;
  turnoverDays: number;
  
  // Anomaly Data
  hasAnomaly?: boolean;
  anomalyDetail?: {
    location: string;
    process: string; // e.g. 'NCM-Coating'
    reason: string;
    gap: number; // shortage amount
  };
}

const InventoryPanel: React.FC<Props> = ({ data }) => {
  const [filterTech, setFilterTech] = useState<'ALL' | 'LFP' | 'NCM'>('ALL');

  // Mock Data Generator based on filter
  const getMockData = (tech: string): InventoryDataPoint[] => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthStr = `2026-${month.toString().padStart(2, '0')}`;
      
      // Base values tailored by tech filter
      let baseRaw = tech === 'LFP' ? 2000 : 1500;
      let baseWip = tech === 'LFP' ? 4000 : 3500;
      let baseFG = tech === 'LFP' ? 2500 : 2000;
      
      if (tech === 'ALL') {
          baseRaw = 3500; baseWip = 7500; baseFG = 4500;
      }

      // Randomize
      const raw = baseRaw + Math.floor(Math.random() * 1000);
      const wip = baseWip + Math.floor(Math.random() * 1500);
      const fg = baseFG + Math.floor(Math.random() * 1000);

      // Inject Anomalies
      let anomaly = undefined;
      let hasAnomaly = false;

      // Simulate anomaly in Month 4 (April) and Month 9 (Sept)
      if (month === 4) {
          hasAnomaly = true;
          anomaly = {
              location: '常州基地 (Changzhou)',
              process: tech === 'NCM' ? 'NCM-前驱体' : 'LFP-正极',
              reason: '上游锂矿供应延期，导致原材料安全库存击穿',
              gap: -450
          };
      }
      if (month === 9) {
          hasAnomaly = true;
          anomaly = {
              location: '江门基地 (Jiangmen)',
              process: 'Pack-Assembly',
              reason: '成品库容爆仓，无法入库',
              gap: 1200
          };
      }

      return {
        name: monthStr,
        rawMaterial: raw,
        wip: wip,
        finishedGoods: fg,
        turnoverDays: 25 + Math.floor(Math.random() * 10),
        hasAnomaly,
        anomalyDetail: anomaly
      };
    });
  };

  const rollingData = getMockData(filterTech);

  // Custom Dot Component for the Line Chart to show Red Dots on anomalies
  const CustomizedDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.hasAnomaly) {
      return (
        <svg x={cx - 10} y={cy - 10} width={20} height={20} viewBox="0 0 20 20" className="overflow-visible z-50">
            <circle cx="10" cy="10" r="6" fill="#ef4444" stroke="white" strokeWidth="2">
                <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.8;1" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Outer Ring */}
            <circle cx="10" cy="10" r="10" fill="#ef4444" opacity="0.3">
                 <animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite" />
                 <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
        </svg>
      );
    }
    return <circle cx={cx} cy={cy} r={0} />; // Hide normal dots to reduce clutter, or show small ones
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as InventoryDataPoint;
      
      // If Anomaly, show the warning card
      if (data.hasAnomaly && data.anomalyDetail) {
          return (
              <div className="bg-white p-4 border border-red-200 rounded-lg shadow-xl max-w-[300px] z-50">
                  <div className="flex items-center gap-2 border-b border-red-100 pb-2 mb-2">
                      <AlertTriangle className="text-red-600" size={18} />
                      <span className="font-bold text-red-700 text-sm">异常预警监测</span>
                      <span className="text-xs text-slate-400 ml-auto">{label}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                      <div className="flex gap-2">
                          <MapPin size={14} className="text-slate-400 mt-0.5"/>
                          <div>
                              <div className="text-slate-500 text-xs scale-90 origin-left">发生地点</div>
                              <div className="font-bold text-slate-700">{data.anomalyDetail.location}</div>
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <Layers size={14} className="text-slate-400 mt-0.5"/>
                          <div>
                              <div className="text-slate-500 text-xs scale-90 origin-left">涉及工艺</div>
                              <div className="font-bold text-slate-700">{data.anomalyDetail.process}</div>
                          </div>
                      </div>
                      <div className="bg-red-50 p-2 rounded text-red-800 leading-relaxed border border-red-100 text-xs">
                          <span className="font-bold">原因: </span>
                          {data.anomalyDetail.reason}
                      </div>
                      <div className="text-right font-mono font-bold text-red-600">
                          {data.anomalyDetail.gap > 0 ? `积压: +${data.anomalyDetail.gap}` : `缺口: ${data.anomalyDetail.gap}`}
                      </div>
                  </div>
              </div>
          );
      }

      // Standard Tooltip
      return (
        <div className="bg-white p-3 border border-slate-200 rounded shadow-lg text-sm">
          <div className="font-bold text-slate-700 mb-2">{label}</div>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
               <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: entry.color}}></div>
               <span className="text-slate-500">{entry.name}:</span>
               <span className="font-mono font-bold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 w-full">
      <div className="p-6 border-b border-slate-200 bg-white sticky top-0 z-10 flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-purple-600" size={24}/>
            库存滚动监控
            </h2>
            <p className="text-sm text-slate-500 mt-1">Rolling Inventory by Process & Location</p>
        </div>
        
        {/* Tech Filter */}
        <div className="flex bg-slate-100 p-1.5 rounded-lg">
            {(['ALL', 'LFP', 'NCM'] as const).map(t => (
                <button
                    key={t}
                    onClick={() => setFilterTech(t)}
                    className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${
                        filterTech === t ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    {t === 'ALL' ? '全口径' : t}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">成品库存周转天数</div>
                <div className="text-3xl font-bold text-slate-800">28.5 <span className="text-sm font-normal text-slate-400">天</span></div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold mt-2">
                    <TrendingDown size={14}/> 环比下降 1.2天
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <div className="text-sm text-slate-500 mb-1">呆滞库存占比 ({'>'}90天)</div>
                 <div className="text-3xl font-bold text-red-600">5.2%</div>
                 <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                    <AlertCircle size={14}/> 需关注江门基地
                </div>
            </div>
        </div>

        {/* Main Chart: Inventory Levels */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase">
                    {filterTech === 'ALL' ? '全网' : filterTech} 库存水位趋势 (含异常点)
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <span>异常节点 (Hover查看原因)</span>
                </div>
            </div>
            
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={rollingData} margin={{top: 10, right: 10, left: -10, bottom: 0}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                        <XAxis dataKey="name" tick={{fontSize: 12}} tickLine={false} axisLine={false}/>
                        <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false}/>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{fontSize: '12px'}}/>
                        <Bar dataKey="rawMaterial" name="原材料" stackId="a" fill="#cbd5e1" barSize={20} />
                        <Bar dataKey="wip" name="在制品(WIP)" stackId="a" fill="#93c5fd" barSize={20} />
                        <Bar dataKey="finishedGoods" name="成品" stackId="a" fill="#3b82f6" barSize={20} />
                        {/* Line for Anomalies */}
                        <Line 
                            type="monotone" 
                            dataKey="turnoverDays" 
                            name="周转天数趋势" 
                            stroke="#ef4444" 
                            strokeWidth={3} 
                            dot={<CustomizedDot />} 
                            activeDot={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Detailed Breakdown List */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50 text-sm font-bold text-slate-500 flex justify-between">
                 <span>分基地库存明细 (TOP 5)</span>
                 <span>Unit: K Ah</span>
             </div>
             <div className="divide-y divide-slate-100">
                 {[
                     { loc: '常州基地', proc: 'LFP-Cell', val: 12500, status: 'Normal' },
                     { loc: '洛阳基地', proc: 'NCM-Cell', val: 8200, status: 'Warning' },
                     { loc: '厦门基地', proc: 'LFP-Pack', val: 6500, status: 'Normal' },
                     { loc: '武汉基地', proc: 'NCM-Pack', val: 5100, status: 'Critical' },
                 ].map((item, i) => (
                     <div key={i} className="p-4 flex items-center justify-between text-sm hover:bg-slate-50">
                         <div className="flex items-center gap-3">
                             <div className={`w-2 h-2 rounded-full ${item.status === 'Normal' ? 'bg-emerald-500' : item.status === 'Warning' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                             <span className="font-medium text-slate-700">{item.loc}</span>
                             <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded text-xs">{item.proc}</span>
                         </div>
                         <div className="font-mono text-base">{item.val.toLocaleString()}</div>
                     </div>
                 ))}
             </div>
        </div>

      </div>
    </div>
  );
};

export default InventoryPanel;
