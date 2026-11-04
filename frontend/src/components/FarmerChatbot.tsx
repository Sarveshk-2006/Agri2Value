// frontend/src/components/FarmerChatbot.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Mic,
  MicOff,
  Sparkles,
  Bot,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  quickAction?: {
    label: string;
    route?: string;
  };
}

const SMART_SUGGESTIONS = [
  'Tomato mandi price in Nashik today?',
  'Which selling route gives the most profit?',
  'Cold storage facilities in Niphad?',
  'What are my rights if payment is delayed?',
  'How does Crop Rescue salvage rain-damaged crops?'
];

export const FarmerChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Namaste! I am your Agri2Value AI Post-Harvest Advisor 🌾. Ask me about mandi prices, profitable buyer routes, cold storage, or payment protection!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const generateAnswer = (query: string): { text: string; action?: { label: string; route: string } } => {
    const q = query.toLowerCase();

    if (q.includes('price') || q.includes('mandi') || q.includes('rate') || q.includes('tomato')) {
      return {
        text: 'Nashik APMC modal price for Tomato is ₹14.00/kg (Pimpalgaon APMC: ₹14.50/kg). However, our Profit Decision Engine shows institutional buyers (like Sahyadri Agro) are paying ₹16.50–₹23.80/kg net! We recommend checking direct buyer offers before selling at the mandi.',
        action: { label: 'Compare Selling Routes', route: '/app/decision' }
      };
    }

    if (q.includes('profit') || q.includes('route') || q.includes('recommend') || q.includes('best')) {
      return {
        text: 'For 4,000 kg Tomato, Direct Institutional Retail offers ₹62,500 net profit (+₹8,900 / +16.6% over the local mandi) with a 3-day payment guarantee. Standard cold storage is flagged as high-risk for tomatoes due to chilling injury without ethylene scrubbers.',
        action: { label: 'View Ranked Pathways', route: '/app/decision' }
      };
    }

    if (q.includes('cold') || q.includes('storage') || q.includes('warehouse')) {
      return {
        text: 'Niphad Multi-Commodity Cold Chain Hub has 45,000 kg available capacity at ₹0.70/kg/month. It is ideal for Onions and Grapes (up to 90 days), providing price arbitrage during seasonal supply gluts.',
        action: { label: 'Explore Infrastructure', route: '/app/infra' }
      };
    }

    if (q.includes('dispute') || q.includes('delay') || q.includes('payment') || q.includes('rights') || q.includes('contract')) {
      return {
        text: 'Under Agri2Value digital agreements, buyers are legally bound to statutory payment terms (typically 3 business days post-weighbridge confirmation). If a buyer delays, an automated PAYMENT_OVERDUE risk alert triggers and you can file a formal dispute in 1 click.',
        action: { label: 'Farmer Protection Center', route: '/app/protection' }
      };
    }

    if (q.includes('rescue') || q.includes('rain') || q.includes('damage') || q.includes('rot') || q.includes('salvage')) {
      return {
        text: 'Our Crop Rescue engine models perishable salvage: rain-threatened tomatoes can be immediately diverted to Sahyadri Puree & Pulp Works (₹3.20/kg processing tariff) to recover 75% of commercial value instead of suffering 100% field spoilage.',
        action: { label: 'Launch Crop Rescue', route: '/app/rescue' }
      };
    }

    return {
      text: 'Agri2Value provides complete farm-to-profit protection: deterministic profit optimization, logistics coordination, digital deal records, and IoT smart monitoring. Would you like to evaluate your crop lot now?',
      action: { label: 'Go to Dashboard', route: '/app/dashboard' }
    };
  };

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateAnswer(query);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickAction: response.action
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 700);
  };

  const toggleSpeech = () => {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your question.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleSend(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {/* ─── Trigger Button ─── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-full shadow-green-lg hover:-translate-y-1.5 animate-float transition-all duration-300 cursor-pointer"
          aria-label="Open Agri AI Advisor"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Bot className="w-5 h-5 text-white animate-bounce" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-black tracking-tight flex items-center gap-1.5 font-display">
              <span>Agri2Value AI</span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            </div>
            <div className="text-[10px] text-green-100 font-medium">Ask Post-Harvest Advisor</div>
          </div>
        </button>
      )}

      {/* ─── Chat Window Modal ─── */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[400px] h-[550px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scale-in">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-green-700 via-emerald-700 to-teal-800 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Bot className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm font-display flex items-center gap-1.5">
                  <span>Agri2Value Assistant</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/30 border border-green-400/40 text-emerald-200">
                    AI 2.0
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-100/90 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-time post-harvest intelligence</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/70 text-xs">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`max-w-[82%] space-y-1.5 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3 rounded-2xl text-[12px] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-green-600 text-white rounded-br-none shadow-md shadow-green-900/10'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {msg.quickAction && (
                    <a
                      href={msg.quickAction.route || '#'}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-xl transition-colors"
                    >
                      <span>{msg.quickAction.label}</span>
                      <ChevronRight className="w-3 h-3" />
                    </a>
                  )}

                  <div className="text-[9px] text-slate-400 px-1 font-mono">
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs pl-9">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Thinking & calculating...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestions */}
          <div className="p-2.5 bg-white border-t border-slate-100 overflow-x-auto no-scrollbar flex items-center gap-1.5">
            {SMART_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[10px] font-medium border border-slate-200 transition-colors cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleSpeech}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
              title={isListening ? 'Listening...' : 'Voice Input'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about prices, routes, storage..."
              className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />

            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 bg-green-600 disabled:bg-slate-200 text-white rounded-xl hover:bg-green-700 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
};
