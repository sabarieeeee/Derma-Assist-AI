import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface SkinChatModalProps {
  onClose: () => void;
  diseaseName?: string;
  onOpenPricing?: () => void;
}

export const SkinChatModal: React.FC<SkinChatModalProps> = ({ onClose, diseaseName, onOpenPricing }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const CHAT_LIMIT = 10;

  useEffect(() => {
    // Check subscription and quota
    const storedQuota = localStorage.getItem('derm_chat_quota');
    if (storedQuota) {
      const parsed = JSON.parse(storedQuota);
      if (parsed.date === new Date().toDateString()) {
        setChatCount(parsed.count || 0);
      } else {
        localStorage.setItem('derm_chat_quota', JSON.stringify({ date: new Date().toDateString(), count: 0 }));
      }
    }

    const isFresh = !diseaseName;
    const greetingText = isFresh
      ? `Welcome to your dedicated AI Assistant. I have no prior context for this session. How can I assist you with your skin health today?`
      : `Hello! I analyzed your recent scan indicating potential [${diseaseName}]. What specific precautions or symptoms would you like to discuss?`;

    setMessages([{ id: '1', sender: 'ai', text: greetingText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [diseaseName]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendQuestion = async (userText: string) => {
    if (!userText.trim()) return;

    // Premium Check
    const sub = localStorage.getItem('derm_subscription');
    const isPremium = sub ? JSON.parse(sub).isUnlimited : false;
    
    if (!isPremium && chatCount >= CHAT_LIMIT) {
      if (onOpenPricing) onOpenPricing();
      return;
    }

    const userMsg: ChatMessage = { 
      id: crypto.randomUUID(), 
      sender: 'user', 
      text: userText, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY || '';
      
      if (!apiKey) {
        throw new Error("Missing Groq API Key in environment variables.");
      }

      const sysPrompt = diseaseName 
        ? `You are an expert Dermatological Assistant. Context: Patient scan detected "${diseaseName}". Answer specifically based on this condition. Be concise and empathetic.`
        : `You are an expert Dermatological Assistant. You have no prior scan context. Provide general, medically sound, and empathetic skin care advice. Be concise.`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${apiKey}` 
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile', // Guaranteed stable Groq model for text generation
          messages: [
            { role: 'system', content: sysPrompt },
            ...messages.filter(m => m.id !== '1').map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: 'user', content: userText }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Groq Chat API Error:", response.status, errorData);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content;
      
      setMessages(prev => [...prev, { 
        id: crypto.randomUUID(), 
        sender: 'ai', 
        text: reply || "I'm sorry, I couldn't process that request.", 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
      
      // Update Quota
      const newCount = chatCount + 1;
      setChatCount(newCount);
      localStorage.setItem('derm_chat_quota', JSON.stringify({ date: new Date().toDateString(), count: newCount }));

    } catch (err: any) {
      console.error("Chatbot failed:", err);
      setMessages(prev => [...prev, { 
        id: crypto.randomUUID(), 
        sender: 'ai', 
        text: `Connection error: ${err.message}. Please verify your network and Groq API key limits.`, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-[#041408]/95 backdrop-blur-md animate-in fade-in duration-300 font-geist" onClick={onClose}>
      <div className="w-full max-w-3xl bg-gradient-to-b from-[#0a2a12] to-[#041408] border border-[#1d4a25]/60 rounded-[32px] shadow-2xl flex flex-col h-[700px] max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Premium Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#c8f542]/10 to-transparent opacity-50"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-[#c8f542]/20 border border-[#c8f542]/50 flex items-center justify-center">
              <iconify-icon icon="solar:magic-stick-3-linear" width="24" style={{ color: '#c8f542' }}></iconify-icon>
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg tracking-tight">Qwen Intelligence</h3>
              <p className="text-xs text-[#c8f542] font-medium">{diseaseName ? 'Contextual Analysis Mode' : 'Fresh Session Active'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 relative z-10">
             <div className="text-right hidden sm:block">
               <p className="text-[10px] text-white/50 uppercase tracking-widest">Free Chats Remaining</p>
               <p className="text-sm font-semibold text-white">{Math.max(0, CHAT_LIMIT - chatCount)} / {CHAT_LIMIT}</p>
             </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 flex items-center justify-center transition-all">
              &times;
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-black/10">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] rounded-3xl p-5 text-sm leading-relaxed shadow-lg ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-[#c8f542] to-[#9dbf30] text-[#12300f] font-medium rounded-tr-none'
                    : 'bg-[#1a3821]/80 border border-[#2d5a35] text-white rounded-tl-none backdrop-blur-md'
                }`}
              >
                <p>{msg.text}</p>
                <span className={`block text-[10px] mt-3 ${msg.sender === 'user' ? 'text-[#12300f]/60' : 'text-[#c8f542]/60'} font-semibold tracking-wider ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start">
              <div className="bg-[#1a3821]/50 border border-[#2d5a35]/50 rounded-3xl rounded-tl-none p-5 text-sm text-[#c8f542] flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-[#c8f542] border-t-transparent rounded-full animate-spin"></div>
                Engine is synthesizing response...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); sendQuestion(input); }} className="p-5 border-t border-white/10 bg-[#041408] flex gap-3 items-center">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Consult AI about symptoms, routines, or care..."
            className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#c8f542] focus:bg-white/10 transition-all"
          />
          <button type="submit" disabled={!input.trim() || loading} className="px-8 py-4 rounded-2xl font-bold text-sm text-[#12300f] uppercase tracking-wider transition-all disabled:opacity-50 hover:scale-[1.02] shadow-[0_0_20px_rgba(200,245,66,0.3)]" style={{ backgroundColor: '#c8f542' }}>
            <iconify-icon icon="solar:plain-2-bold" width="20"></iconify-icon>
          </button>
        </form>
      </div>
    </div>
  );
};
export default SkinChatModal;
