import React, { useState, useRef, useEffect } from 'react';
import Logo from './Logo';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface SkinChatModalProps {
  onClose: () => void;
  diseaseName?: string;
}

export const SkinChatModal: React.FC<SkinChatModalProps> = ({ onClose, diseaseName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: diseaseName 
        ? `Hello! I am your Derma Assist AI companion. I see your scan identified "${diseaseName}". How can I assist with your care plan, precautions, or questions today?`
        : `Hello! I am your Derma Assist AI companion. Ask me any question regarding skin conditions, care routines, symptoms, or precautions!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    "What precautions should I take?",
    "Is this condition contagious?",
    "What OTC ointments are recommended?",
    "When should I visit a dermatologist?"
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendQuestion = async (userText: string) => {
    if (!userText.trim() || loading) return;

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
      
      const prompt = `You are an expert AI Dermatological Assistant. The user asks: "${userText}". 
Context: ${diseaseName ? `User skin condition: ${diseaseName}` : 'General skin consultation'}.
Provide a clear, empathetic, medically sound response (max 3 short paragraphs). Include practical precautions, when to consult a doctor, and clear steps. Do not provide definitive medical diagnoses.`;

      let aiResponseText = '';

      if (apiKey) {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'qwen/qwen3.6-27b',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 600
          })
        });

        if (response.ok) {
          const data = await response.json();
          aiResponseText = data.choices?.[0]?.message?.content || '';
        }
      }

      if (!aiResponseText) {
        if (userText.toLowerCase().includes('contagious')) {
          aiResponseText = `Most non-infectious inflammatory skin patterns (like eczema, dermatitis, or vitiligo) are not contagious. However, viral, bacterial, or fungal rashes can spread. Avoid sharing towels, keep the area clean, and avoid picking at lesions.`;
        } else if (userText.toLowerCase().includes('precaution') || userText.toLowerCase().includes('care')) {
          aiResponseText = `Key precautions:\n1. Apply fragrance-free, gentle moisturizers.\n2. Avoid harsh chemical soaps or scalding hot water.\n3. Wear broad-spectrum SPF 50+ sunscreen outdoors.\n4. Avoid scratching to prevent secondary bacterial infection.`;
        } else if (userText.toLowerCase().includes('dermatologist') || userText.toLowerCase().includes('doctor')) {
          aiResponseText = `You should seek immediate medical evaluation if you notice rapid spreading, severe pain, pus formation, bleeding, fever, or lesions near your eyes or mouth.`;
        } else {
          aiResponseText = `Thank you for asking. For ${diseaseName || 'skin care'}, maintaining proper moisture, gentle cleansing, and sun protection are essential foundation steps. Always consult a board-certified dermatologist for prescription treatments.`;
        }
      }

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: 'I am experiencing a momentary connection issue. Please ensure gentle cleansing, avoid scratching, and consult a medical professional if symptoms persist.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-[#041408]/90 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#0a2a12] border border-[#1d4a25] rounded-[28px] shadow-2xl flex flex-col h-[650px] max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-300 font-geist relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <Logo size={28} />
            <div>
              <h3 className="font-semibold text-white text-base">AI Vision Live Assistant</h3>
              <p className="text-xs text-[#c8f542]">Active Session • Groq Qwen Vision</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 flex items-center justify-center font-bold transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Quick Question Pills */}
        <div className="px-5 py-3 border-b border-white/5 bg-black/20 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          {quickQuestions.map((q, idx) => (
            <button 
              key={idx}
              onClick={() => sendQuestion(q)}
              className="shrink-0 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-[#c8f542] hover:bg-[#c8f542]/10 transition-all font-geist"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map(msg => (
            <div 
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#c8f542] text-[#12300f] font-medium rounded-tr-none shadow-md'
                    : 'bg-white/10 border border-white/15 text-white rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                <span className={`block text-[9px] mt-2 ${msg.sender === 'user' ? 'text-[#12300f]/60' : 'text-white/40'} text-right`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Dots Animation */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/10 border border-white/15 rounded-2xl rounded-tl-none p-4 text-xs text-white/80 flex items-center gap-2">
                <span className="text-white/60">Derma AI is typing</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#c8f542] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-[#c8f542] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-[#c8f542] rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); sendQuestion(input); }}
          className="p-4 border-t border-white/10 bg-black/30 flex gap-3 items-center shrink-0"
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about skin conditions, care, or symptoms..."
            className="flex-1 p-3.5 rounded-full bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#c8f542]"
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="px-6 py-3.5 rounded-full font-semibold text-xs text-[#12300f] uppercase transition-all disabled:opacity-50 hover:brightness-105"
            style={{ backgroundColor: '#c8f542', boxShadow: '0 4px 14px rgba(200,245,66,0.3)' }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default SkinChatModal;
