
import React, { useState, useRef, useEffect } from 'react';
import { getDesignAdvice } from '../services/geminiService';
import { ChatMessage, VendorProduct, AIAction } from '../types';

interface AIAssistantProps {
  appliedMaterials: Record<string, VendorProduct>;
  onApplyActions: (actions: AIAction[]) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ appliedMaterials, onApplyActions, isOpen, onToggle }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello. I am your Design Architect. Command me to modify the "Exterior", "Living Room", or any other zone.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setInput('');
    setLoading(true);

    const response = await getDesignAdvice(textToSend, appliedMaterials);

    setMessages(prev => [...prev, { role: 'model', text: response.message }]);
    
    if (response.actions && response.actions.length > 0) {
      onApplyActions(response.actions);
    }

    setLoading(false);
  };

  // Floating Toggle Button (Visible when closed)
  if (!isOpen) {
    return (
      <button 
        onClick={onToggle}
        className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-2xl z-50 transition-all transform hover:scale-105 flex items-center gap-3 border border-indigo-400"
      >
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
        </div>
        <span className="font-bold tracking-wide hidden md:block">AI ARCHITECT</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-800 flex flex-col overflow-hidden z-50 animate-fade-in-up font-sans">
      
      {/* Header */}
      <div className="bg-[#121212] p-4 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-900/50 rounded-lg border border-indigo-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-gray-100 font-bold text-sm tracking-wider">AI DESIGNER</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-gray-400 uppercase">Online</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onToggle} 
          className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0f0f0f]">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-lg backdrop-blur-sm ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-sm border border-indigo-500' 
                : 'bg-[#222] text-gray-200 border border-gray-700 rounded-bl-sm'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
            </div>
          </div>
        ))}
        {loading && (
           <div className="flex justify-start">
             <div className="bg-[#222] border border-gray-700 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
               <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></span>
               <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></span>
             </div>
           </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length < 3 && (
        <div className="px-4 py-2 bg-[#0f0f0f] flex gap-2 overflow-x-auto no-scrollbar">
           {['Paint outside white', 'Modern interior', 'Dark theme bedroom'].map(s => (
             <button 
               key={s}
               onClick={() => handleSend(s)}
               className="flex-shrink-0 bg-[#222] hover:bg-[#333] border border-gray-700 text-gray-400 hover:text-indigo-400 text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
             >
               {s}
             </button>
           ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-[#121212] border-t border-gray-800">
        <div className="flex gap-3 items-center relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a command..."
            className="flex-1 bg-[#1a1a1a] text-white border border-gray-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all placeholder-gray-600"
          />
          <button 
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-900/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
