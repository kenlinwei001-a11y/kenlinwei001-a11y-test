
import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, ChatAttachment, MCPDefinition } from '../types';
import { Send, Bot, User, Sparkles, Database, Network, Calculator, BookOpen, Check } from 'lucide-react';
import { MiniInventoryChart, MiniProductionTable, MiniPlanCards } from './ChatWidgets';
import { AVAILABLE_MCPS } from '../services/mcp';

interface Props {
  messages: ChatMessage[];
  onSendMessage: (text: string, activeMCPs: string[]) => void;
  isThinking: boolean;
  isMaximized?: boolean;
}

const AIChat: React.FC<Props> = ({ messages, onSendMessage, isThinking, isMaximized = false }) => {
  const [input, setInput] = useState('');
  const [activeMCPs, setActiveMCPs] = useState<string[]>(['text2sql']); // Default active
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = () => {
    if (!input.trim() || isThinking) return;
    onSendMessage(input, activeMCPs);
    setInput('');
  };

  const toggleMCP = (id: string) => {
      setActiveMCPs(prev => 
          prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
      );
  };

  const renderAttachment = (attachment: ChatAttachment) => {
      switch (attachment.type) {
          case 'inventory_chart':
              return <MiniInventoryChart data={attachment.data} />;
          case 'production_table':
              return <MiniProductionTable data={attachment.data} />;
          case 'plan_card':
              return <MiniPlanCards plans={attachment.data} />;
          default:
              return null;
      }
  };

  const getMCPIcon = (iconName: string, size: number) => {
      switch(iconName) {
          case 'Database': return <Database size={size}/>;
          case 'Network': return <Network size={size}/>;
          case 'Calculator': return <Calculator size={size}/>;
          case 'BookOpen': return <BookOpen size={size}/>;
          default: return <Sparkles size={size}/>;
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full">
       {!isMaximized && (
           <div className="p-4 border-b border-slate-200 flex items-center gap-2 bg-white sticky top-0 z-10 shadow-sm">
            <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                <Sparkles size={18} />
            </div>
            <div>
                <h2 className="font-bold text-slate-800 text-sm">智能决策助手</h2>
                <p className="text-[10px] text-slate-400">Interactive Simulation Agent</p>
            </div>
            </div>
       )}

       {/* MCP Selector Toolbar */}
       <div className={`px-4 py-2 border-b border-slate-100 bg-white flex gap-2 overflow-x-auto no-scrollbar ${isMaximized ? 'justify-center py-3' : ''}`}>
           {AVAILABLE_MCPS.map(mcp => {
               const isActive = activeMCPs.includes(mcp.id);
               return (
                   <button
                        key={mcp.id}
                        onClick={() => toggleMCP(mcp.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            isActive 
                            ? `${mcp.color} border-transparent shadow-sm ring-1 ring-black/5` 
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                        title={mcp.description}
                   >
                       {getMCPIcon(mcp.icon, 14)}
                       {mcp.name}
                       {isActive && <Check size={12} className="ml-1"/>}
                   </button>
               );
           })}
       </div>

      <div className={`flex-1 overflow-y-auto p-4 space-y-6 ${isMaximized ? 'bg-slate-100/50 p-8' : 'bg-white'}`}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} ${isMaximized ? 'max-w-4xl mx-auto' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'model' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {msg.role === 'model' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                <div className={`rounded-2xl px-5 py-3 text-sm shadow-sm leading-relaxed ${
                msg.role === 'model' 
                    ? 'bg-white text-slate-700 border border-slate-100' 
                    : 'bg-indigo-600 text-white'
                }`}>
                    <div className="whitespace-pre-wrap font-sans">
                        {msg.content}
                    </div>
                </div>
                
                {/* Rich Content Attachment */}
                {msg.attachment && (
                    <div className={`mt-2 w-full animate-in fade-in slide-in-from-top-2 ${isMaximized ? 'max-w-2xl' : 'max-w-full'}`}>
                        {renderAttachment(msg.attachment)}
                    </div>
                )}
                
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
            </div>
          </div>
        ))}
        
        {isThinking && (
          <div className={`flex gap-4 ${isMaximized ? 'max-w-4xl mx-auto' : ''}`}>
             <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
               <Bot size={20} />
             </div>
             <div className="bg-white border border-slate-100 px-5 py-4 rounded-2xl flex items-center gap-1.5 shadow-sm w-24">
               <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
               <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
               <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={`p-4 border-t border-slate-200 bg-white sticky bottom-0 z-10 ${isMaximized ? 'py-6' : ''}`}>
        <div className={`relative ${isMaximized ? 'max-w-4xl mx-auto' : ''}`}>
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-5 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
            placeholder={isMaximized ? "输入指令，系统将根据勾选的 MCP 插件进行推演 (e.g. '查询常州库存并分析上游影响')..." : "输入指令..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
