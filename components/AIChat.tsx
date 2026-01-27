import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from '../types';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface Props {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isThinking: boolean;
}

const AIChat: React.FC<Props> = ({ messages, onSendMessage, isThinking }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = () => {
    if (!input.trim() || isThinking) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-white w-full">
       <div className="p-4 border-b border-slate-200 flex items-center gap-2 bg-gradient-to-r from-slate-50 to-white sticky top-0 z-10">
        <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
           <Sparkles size={18} />
        </div>
        <div>
          <h2 className="font-bold text-slate-800 text-sm">智能决策助手</h2>
          <p className="text-[10px] text-slate-400">Interactive Simulation Agent</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'model' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {msg.role === 'model' ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
              msg.role === 'model' 
                ? 'bg-white text-slate-700 border border-slate-100' 
                : 'bg-blue-600 text-white'
            }`}>
              {/* Simple Markdown rendering replacement */}
              <div className="whitespace-pre-wrap leading-relaxed font-sans">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
               <Bot size={16} />
             </div>
             <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
               <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100"></div>
               <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0 z-10">
        <div className="relative">
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="输入指令..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;