import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphData, NodeData, NodeType } from '../types';

interface Props {
  data: GraphData;
  onNodeHover: (node: NodeData | null, x: number, y: number) => void;
  onNodeClick?: (node: NodeData) => void;
  onBackgroundClick?: () => void;
  selectedNodeIds?: string[];
  width: number;
  height: number;
}

const SupplyChainGraph: React.FC<Props> = ({ data, onNodeHover, onNodeClick, onBackgroundClick, selectedNodeIds = [], width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  // Ref to persist simulation nodes state (positions) across renders
  const simulationStateRef = useRef<d3.SimulationNodeDatum[]>([]);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    // 1. Prepare Simulation Nodes
    // Try to preserve x/y/vx/vy from previous simulation to prevent "exploding" resets
    const simulationNodes = data.nodes.map(n => {
      const prev = simulationStateRef.current.find((p: any) => p.id === n.id);
      if (prev) {
        return { ...n, x: prev.x, y: prev.y, vx: prev.vx, vy: prev.vy };
      }
      return { ...n };
    }) as d3.SimulationNodeDatum[];

    const simulationLinks = JSON.parse(JSON.stringify(data.links));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 

    // Groups
    const g = svg.append("g");
    
    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .filter((event) => {
         // Disable panning on mouse down (drag), allow wheel zoom
         return event.type === 'wheel';
      })
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom)
       .on("click", (event) => {
           // Check if click was on the background (svg)
           // event.target is the actual element clicked. If it's the SVG, it's background.
           if (event.target === svgRef.current && onBackgroundClick) {
               onBackgroundClick();
           }
       });

    // Initial Zoom (Center)
    const initialScale = 0.85;
    const initialTranslateX = width / 2;
    const initialTranslateY = height / 2;
    svg.call(zoom.transform, d3.zoomIdentity.translate(initialTranslateX - (width * initialScale) / 2, initialTranslateY - (height * initialScale) / 2).scale(initialScale));

    // Force Simulation configuration
    const simulation = d3.forceSimulation(simulationNodes)
      .alphaDecay(0.05) // Faster settling (default ~0.0228)
      .force("link", d3.forceLink(simulationLinks).id((d: any) => d.id).distance(180)) 
      .force("charge", d3.forceManyBody().strength(-400)) // Reduced strength slightly
      .force("collide", d3.forceCollide(50)) // Reduced collision radius
      .force("x", d3.forceX((d: any) => {
        if (d.type === NodeType.SUPPLIER) return width * 0.15;
        if (d.type === NodeType.BASE) return width * 0.5;
        return width * 0.85;
      }).strength(0.5)) // Reduced x-strength for smoother movement
      .force("y", d3.forceY(height / 2).strength(0.08));

    // Define Markers
    const defs = svg.append("defs");
    
    defs.append("marker")
      .attr("id", "arrow-normal")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#94a3b8");

    defs.append("marker")
      .attr("id", "arrow-critical")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#ef4444");

    const linkWidthScale = d3.scaleLinear()
      .domain([0, 5000]) 
      .range([1.5, 8]) 
      .clamp(true);

    // Links
    const link = g.append("g")
      .selectAll("path")
      .data(simulationLinks)
      .enter()
      .append("path")
      .attr("stroke", (d: any) => d.status === 'critical' ? '#ef4444' : d.status === 'warning' ? '#f59e0b' : '#94a3b8')
      .attr("stroke-opacity", (d: any) => d.status !== 'normal' ? 0.9 : 0.3 + (linkWidthScale(d.value) / 10))
      .attr("stroke-width", (d: any) => d.status !== 'normal' ? 3 : linkWidthScale(d.value))
      .attr("fill", "none")
      .attr("marker-end", (d: any) => d.status === 'critical' ? "url(#arrow-critical)" : null);

    // Nodes
    const node = g.append("g")
      .selectAll("g")
      .data(simulationNodes)
      .enter()
      .append("g")
      .attr("cursor", "pointer")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Node Visuals
    node.each(function(d: any) {
      const el = d3.select(this);
      const isSelected = selectedNodeIds.includes(d.id);
      
      const isCritical = d.status === 'critical';
      const isWarning = d.status === 'warning';
      const strokeColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : (d.type === NodeType.SUPPLIER ? '#22c55e' : d.type === NodeType.BASE ? '#a855f7' : '#3b82f6');
      const fillColor = isCritical ? '#fef2f2' : isWarning ? '#fffbeb' : (d.type === NodeType.SUPPLIER ? '#f0fdf4' : d.type === NodeType.BASE ? '#fdf4ff' : '#eff6ff');

      // Selection Halo
      if (isSelected) {
          el.append("circle")
            .attr("r", 28)
            .attr("fill", "none")
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4 2")
            .attr("opacity", 0.8)
            .append("animateTransform")
            .attr("attributeName", "transform")
            .attr("type", "rotate")
            .attr("from", "0 0 0")
            .attr("to", "360 0 0")
            .attr("dur", "10s")
            .attr("repeatCount", "indefinite");
      }

      // Critical Pulse
      if (isCritical && !isSelected) {
         el.append("circle")
           .attr("r", 20)
           .attr("fill", "#ef4444")
           .attr("opacity", 0.2)
           .append("animate")
           .attr("attributeName", "r")
           .attr("from", 20)
           .attr("to", 40)
           .attr("dur", "1.5s")
           .attr("repeatCount", "indefinite")
           .append("animate") 
           .attr("attributeName", "opacity")
           .attr("from", 0.4)
           .attr("to", 0)
           .attr("dur", "1.5s")
           .attr("repeatCount", "indefinite");
      }

      // Shapes
      if (d.type === NodeType.CUSTOMER) {
         el.append("path")
           .attr("d", "M0,-15 L13,-7.5 L13,7.5 L0,15 L-13,7.5 L-13,-7.5 Z")
           .attr("fill", fillColor)
           .attr("stroke", strokeColor)
           .attr("stroke-width", isCritical || isSelected ? 3 : 2);
      } else if (d.type === NodeType.BASE) {
        el.append("rect")
          .attr("x", -15)
          .attr("y", -15)
          .attr("width", 30)
          .attr("height", 30)
          .attr("rx", 4)
          .attr("fill", fillColor)
          .attr("stroke", strokeColor)
          .attr("stroke-width", isCritical || isSelected ? 3 : 2);
      } else {
        el.append("circle")
          .attr("r", 10)
          .attr("fill", fillColor)
          .attr("stroke", strokeColor)
          .attr("stroke-width", isCritical || isSelected ? 3 : 2);
      }

      // Checkmark
      if (isSelected) {
          el.append("circle")
            .attr("cx", 12)
            .attr("cy", -12)
            .attr("r", 8)
            .attr("fill", "#3b82f6")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2);
          
          el.append("path")
            .attr("d", "M8,-12 L11,-9 L16,-15") 
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round");
      }

      // Label
      el.append("text")
        .text(d.name)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", isCritical ? "#ef4444" : "#475569")
        .attr("font-weight", isCritical ? "700" : "500")
        .style("pointer-events", "none")
        .style("text-shadow", "0 1px 2px rgba(255,255,255,0.8)");
        
      if ((isCritical || isWarning) && !isSelected) {
          el.append("text")
            .text("!")
            .attr("y", 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", strokeColor)
            .attr("font-weight", "bold");
      }

      // Stats Badge
      if ((d.type === NodeType.SUPPLIER || d.type === NodeType.BASE) && d.inventoryLevel !== undefined) {
         const hasIssue = d.activeAlerts > 0;
         const badgeColor = hasIssue ? "#fee2e2" : "#f8fafc";
         const badgeBorder = hasIssue ? "#ef4444" : "#cbd5e1";
         const badgeText = hasIssue ? "#b91c1c" : "#64748b";
         const formattedValue = d3.format(".2s")(d.inventoryLevel); 

         el.append("rect")
           .attr("x", -16)
           .attr("y", 30)
           .attr("width", 32)
           .attr("height", 12)
           .attr("rx", 6)
           .attr("fill", badgeColor)
           .attr("stroke", badgeBorder)
           .attr("stroke-width", 1);
         
         el.append("text")
           .text(formattedValue)
           .attr("x", 0)
           .attr("y", 39)
           .attr("text-anchor", "middle")
           .attr("font-size", "8px")
           .attr("font-weight", "700")
           .attr("fill", badgeText)
           .style("pointer-events", "none");
      }
    });

    // Events
    node.on("mouseenter", function(event, d: any) {
      const originalNode = data.nodes.find(n => n.id === d.id) || d;
      onNodeHover(originalNode, event.clientX, event.clientY);
    }).on("mouseleave", function(event, d: any) {
      onNodeHover(null, 0, 0);
    }).on("click", function(event, d: any) {
      event.stopPropagation();
      const originalNode = data.nodes.find(n => n.id === d.id) || d;
      if (onNodeClick) {
          onNodeClick(originalNode);
      }
    });

    // Simulation Tick
    simulation.on("tick", () => {
      link.attr("d", (d: any) => {
        const midX = (d.source.x + d.target.x) / 2;
        return `M${d.source.x},${d.source.y} C${midX},${d.source.y} ${midX},${d.target.y} ${d.target.x},${d.target.y}`;
      });
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      
      // Update ref with current positions
      simulationStateRef.current = simulationNodes;
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, width, height, onNodeHover, onNodeClick, onBackgroundClick, selectedNodeIds]);

  return (
    <div className="relative w-full h-full">
        {/* Legend */}
        <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur border border-slate-200 p-2 rounded shadow-sm text-[10px] text-slate-600 space-y-2 pointer-events-none select-none">
            <div className="font-bold border-b border-slate-100 pb-1 mb-1">图例说明</div>
            <div className="flex items-center gap-2">
                <div className="w-6 h-[2px] bg-slate-400 opacity-40"></div>
                <span>普通流量</span>
            </div>
             <div className="flex items-center gap-2">
                <div className="w-6 h-[6px] bg-slate-400 opacity-80"></div>
                <span>高频/大宗供货</span>
            </div>
             <div className="flex items-center gap-2">
                <div className="w-8 h-3 rounded-full border border-slate-300 bg-slate-50 flex items-center justify-center text-[8px] font-bold text-slate-500">2.5k</div>
                <span>实时库存 (Ah)</span>
            </div>
        </div>

        <svg 
            ref={svgRef} 
            width={width} 
            height={height} 
            className="bg-slate-50/50"
            style={{ cursor: 'default' }} 
        />
    </div>
  );
};

export default React.memo(SupplyChainGraph);