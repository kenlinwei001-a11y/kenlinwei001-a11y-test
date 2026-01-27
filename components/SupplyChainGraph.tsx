import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, NodeData, NodeType } from '../types';

interface Props {
  data: GraphData;
  onNodeHover: (node: NodeData | null, x: number, y: number) => void;
  width: number;
  height: number;
}

const SupplyChainGraph: React.FC<Props> = ({ data, onNodeHover, width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // Groups
    const g = svg.append("g");
    
    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);

    // Initial Zoom - adjusted to fit
    const initialScale = 0.85;
    const initialTranslateX = width / 2;
    const initialTranslateY = height / 2;
    svg.call(zoom.transform, d3.zoomIdentity.translate(initialTranslateX - (width * initialScale) / 2, initialTranslateY - (height * initialScale) / 2).scale(initialScale));


    // Force Simulation Setup
    const simulation = d3.forceSimulation(data.nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(180)) // Increased distance slightly
      .force("charge", d3.forceManyBody().strength(-500))
      .force("collide", d3.forceCollide(60)) // Avoid overlap with new badges
      .force("x", d3.forceX((d: any) => {
        if (d.type === NodeType.SUPPLIER) return width * 0.15;
        if (d.type === NodeType.BASE) return width * 0.5;
        return width * 0.85;
      }).strength(0.8))
      .force("y", d3.forceY(height / 2).strength(0.1));

    // Define Arrow markers
    const defs = svg.append("defs");
    
    // Normal Arrow
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

    // Critical Arrow
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

    // Scale for Link Width based on Value (Traffic Heatmap)
    const linkWidthScale = d3.scaleLinear()
      .domain([0, 5000]) // Based on mock data range
      .range([1.5, 8]) // Min width 1.5px, Max 8px
      .clamp(true);

    // Links (Curves)
    const link = g.append("g")
      .selectAll("path")
      .data(data.links)
      .enter()
      .append("path")
      .attr("stroke", (d) => d.status === 'critical' ? '#ef4444' : d.status === 'warning' ? '#f59e0b' : '#94a3b8')
      .attr("stroke-opacity", (d) => {
          if (d.status !== 'normal') return 0.9;
          // Heatmap effect: thicker lines slightly more opaque
          return 0.3 + (linkWidthScale(d.value) / 10); 
      })
      .attr("stroke-width", (d) => {
          // If critical, use a fixed visible width. If normal, use traffic volume.
          if (d.status !== 'normal') return 3;
          return linkWidthScale(d.value);
      })
      .attr("fill", "none")
      .attr("marker-end", (d) => d.status === 'critical' ? "url(#arrow-critical)" : null);

    // Nodes
    const node = g.append("g")
      .selectAll("g")
      .data(data.nodes)
      .enter()
      .append("g")
      .attr("cursor", "pointer")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Node Visuals - Shapes based on Type
    node.each(function(d: any) {
      const el = d3.select(this);
      
      const isCritical = d.status === 'critical';
      const isWarning = d.status === 'warning';
      const strokeColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : (d.type === NodeType.SUPPLIER ? '#22c55e' : d.type === NodeType.BASE ? '#a855f7' : '#3b82f6');
      const fillColor = isCritical ? '#fef2f2' : isWarning ? '#fffbeb' : (d.type === NodeType.SUPPLIER ? '#f0fdf4' : d.type === NodeType.BASE ? '#fdf4ff' : '#eff6ff');

      // Pulse effect for critical nodes
      if (isCritical) {
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
           .append("animate") // Fade out
           .attr("attributeName", "opacity")
           .attr("from", 0.4)
           .attr("to", 0)
           .attr("dur", "1.5s")
           .attr("repeatCount", "indefinite");
      }

      if (d.type === NodeType.CUSTOMER) {
         // Hexagon for Customer
         el.append("path")
           .attr("d", "M0,-15 L13,-7.5 L13,7.5 L0,15 L-13,7.5 L-13,-7.5 Z")
           .attr("fill", fillColor)
           .attr("stroke", strokeColor)
           .attr("stroke-width", isCritical ? 3 : 2);
      } else if (d.type === NodeType.BASE) {
        // Rectangle for Base
        el.append("rect")
          .attr("x", -15)
          .attr("y", -15)
          .attr("width", 30)
          .attr("height", 30)
          .attr("rx", 4)
          .attr("fill", fillColor)
          .attr("stroke", strokeColor)
          .attr("stroke-width", isCritical ? 3 : 2);
      } else {
        // Circle for Supplier
        el.append("circle")
          .attr("r", 10)
          .attr("fill", fillColor)
          .attr("stroke", strokeColor)
          .attr("stroke-width", isCritical ? 3 : 2);
      }

      // Main Labels
      el.append("text")
        .text(d.name)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", isCritical ? "#ef4444" : "#475569")
        .attr("font-weight", isCritical ? "700" : "500")
        .style("pointer-events", "none")
        .style("text-shadow", "0 1px 2px rgba(255,255,255,0.8)");
        
      if (isCritical || isWarning) {
          el.append("text")
            .text("!")
            .attr("y", 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", strokeColor)
            .attr("font-weight", "bold");
      }

      // === Real-time Inventory/Status Badge ===
      // Display for Supplier and Base
      if ((d.type === NodeType.SUPPLIER || d.type === NodeType.BASE) && d.inventoryLevel !== undefined) {
         const hasIssue = d.activeAlerts > 0;
         const badgeColor = hasIssue ? "#fee2e2" : "#f8fafc";
         const badgeBorder = hasIssue ? "#ef4444" : "#cbd5e1";
         const badgeText = hasIssue ? "#b91c1c" : "#64748b";
         const formattedValue = d3.format(".2s")(d.inventoryLevel); // e.g., 2.5k

         // Badge Background Pill
         el.append("rect")
           .attr("x", -16)
           .attr("y", 30)
           .attr("width", 32)
           .attr("height", 12)
           .attr("rx", 6)
           .attr("fill", badgeColor)
           .attr("stroke", badgeBorder)
           .attr("stroke-width", 1);
         
         // Badge Text
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

    // Interaction Events
    node.on("mouseenter", function(event, d) {
      // Highlight Logic
      const connectedLinkIds = new Set();
      const connectedNodeIds = new Set();
      connectedNodeIds.add(d.id);

      // Find connections
      data.links.forEach((l: any) => {
        if (l.source.id === d.id) {
          connectedLinkIds.add(l.index);
          connectedNodeIds.add(l.target.id);
        } else if (l.target.id === d.id) {
          connectedLinkIds.add(l.index);
          connectedNodeIds.add(l.source.id);
        }
      });

      // Visually dim others
      node.style("opacity", (n: any) => connectedNodeIds.has(n.id) ? 1 : 0.1);
      link.style("stroke-opacity", (l: any) => connectedLinkIds.has(l.index) ? 0.9 : 0.05);
      
      // Expand ring if not critical (critical has its own animation)
      if (d.status !== 'critical') {
        // Simple scale up
        d3.select(this).attr("transform", `translate(${d.x},${d.y}) scale(1.2)`);
      }

      onNodeHover(d, event.clientX, event.clientY);

    }).on("mouseleave", function(event, d) {
      // Reset
      node.style("opacity", 1);
      link.style("stroke-opacity", (l) => {
         // Restore heatmap opacity
         if (l.status !== 'normal') return 0.9;
         return 0.3 + (linkWidthScale(l.value) / 10);
      });
      
      if (d.status !== 'critical') {
        d3.select(this).attr("transform", `translate(${d.x},${d.y}) scale(1)`);
      }

      onNodeHover(null, 0, 0);
    });


    // Tick Function
    simulation.on("tick", () => {
      link.attr("d", (d: any) => {
        // Bezier curve
        const midX = (d.source.x + d.target.x) / 2;
        return `M${d.source.x},${d.source.y} C${midX},${d.source.y} ${midX},${d.target.y} ${d.target.x},${d.target.y}`;
      });

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
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
  }, [data, width, height, onNodeHover]);

  return (
    <div className="relative w-full h-full">
        {/* Legend for Heatmap & Inventory */}
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
            style={{ cursor: 'grab' }}
        />
    </div>
  );
};

export default React.memo(SupplyChainGraph);