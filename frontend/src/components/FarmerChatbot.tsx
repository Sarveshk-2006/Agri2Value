// frontend/src/components/FarmerChatbot.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  X,
  Sprout,
  Send,
  Mic,
  MicOff,
  Sparkles,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { getAIContent } from '../services/aiAdvisorI18n';
import { getIntlLocale } from '../i18n/formatters';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  provider?: string;
  disclaimer?: string;
  quickAction?: {
    label: string;
    route?: string;
  };
}

export const FarmerChatbot: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const aiContent = getAIContent(currentLang);

  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: aiContent.welcome,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update initial welcome message when language changes if no conversation has started
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{
          id: 'welcome',
          sender: 'ai',
          text: aiContent.welcome,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }];
      }
      return prev;
    });
  }, [currentLang, aiContent.welcome]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const generateAnswer = (query: string): { text: string; action?: { label: string; route: string } } => {
    const q = query.toLowerCase();
    const localizedAnswers = aiContent.answers;

    if (
      q.includes('price') || q.includes('mandi') || q.includes('rate') || q.includes('tomato') ||
      q.includes('भाव') || q.includes('দর') || q.includes('ధర') || q.includes('விலை') ||
      q.includes('ದರ') || q.includes('ਕੀਮਤ') || q.includes('ചന്ത') || q.includes('റേറ്റ്')
    ) {
      return {
        text: localizedAnswers.price.text,
        action: { label: localizedAnswers.price.actionLabel, route: '/app/decision' }
      };
    }

    if (
      q.includes('profit') || q.includes('route') || q.includes('recommend') || q.includes('best') ||
      q.includes('नफा') || q.includes('मुनाफा') || q.includes('लाभ') || q.includes('లాభం') ||
      q.includes('லாபம்') || q.includes('ಆದಾಯ') || q.includes('ਲਾਭ') || q.includes('അറ്റാദായം')
    ) {
      return {
        text: localizedAnswers.profit.text,
        action: { label: localizedAnswers.profit.actionLabel, route: '/app/decision' }
      };
    }

    if (
      q.includes('cold') || q.includes('storage') || q.includes('warehouse') ||
      q.includes('शीतगृह') || q.includes('कोल्ड') || q.includes('হিমাগার') ||
      q.includes('గోడౌన్') || q.includes('கிடங்கு') || q.includes('ಶೀತಲ') || q.includes('ശീതീകരണ')
    ) {
      return {
        text: localizedAnswers.storage.text,
        action: { label: localizedAnswers.storage.actionLabel, route: '/app/infra' }
      };
    }

    if (
      q.includes('dispute') || q.includes('delay') || q.includes('payment') || q.includes('rights') || q.includes('contract') ||
      q.includes('तक्रार') || q.includes('पेमेंट') || q.includes('पैसे') || q.includes('शिकायत') || q.includes('చెల్లింపు') ||
      q.includes('பணம்') || q.includes('ಪಾವತಿ') || q.includes('টাকা') || q.includes('പരാതി')
    ) {
      return {
        text: localizedAnswers.dispute.text,
        action: { label: localizedAnswers.dispute.actionLabel, route: '/app/protection' }
      };
    }

    if (
      q.includes('rescue') || q.includes('rain') || q.includes('damage') || q.includes('rot') || q.includes('salvage') ||
      q.includes('बचाव') || q.includes('पाऊस') || q.includes('पाऊस') || q.includes('बारिश') || q.includes('ವರ್ಷ') ||
      q.includes('వర్షం') || q.includes('மழை') || q.includes('ਮੀਂਹ') || q.includes('বৃষ্টি') || q.includes('മഴ')
    ) {
      return {
        text: localizedAnswers.rescue.text,
        action: { label: localizedAnswers.rescue.actionLabel, route: '/app/rescue' }
      };
    }

    return {
      text: localizedAnswers.fallback.text,
      action: { label: localizedAnswers.fallback.actionLabel, route: '/app/dashboard' }
    };
  };

  const handleSend = async (textToSend?: string) => {
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

    try {
      const serverAdvice = await api.askAIAdvisor(query, undefined, undefined, currentLang);
      const action = serverAdvice.suggested_actions?.[0];
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: serverAdvice.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: serverAdvice.provider === 'google_gemini' ? 'Google Gemini AI' : 'Agronomic Rules Engine',
        disclaimer: serverAdvice.disclaimer,
        quickAction: action ? { label: action.label, route: action.route } : undefined,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      // Offline fallback
      const fallback = generateAnswer(query);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: fallback.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: 'Agronomic Rules Engine',
        quickAction: fallback.action,
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
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
      recognition.lang = getIntlLocale(currentLang);
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

  // Do not render floating advisor on auth screens to avoid obstructing forms
  if (['/login', '/register'].includes(location.pathname)) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 sm:z-50">
      
      {/* ─── Clean Circular Floating Trigger Button (Matches Reference Design) ─── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 sm:w-14 sm:h-14 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-full shadow-lg shadow-green-600/30 flex items-center justify-center transition-all duration-200 cursor-pointer"
          aria-label="Open Krishi Advisory"
          title="Chat with Mandi Advisor"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* ─── Chat Window Modal ─── */}
      {isOpen && (
        <div className="w-[94vw] sm:w-[400px] h-[520px] max-h-[76vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scale-in">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-green-700 via-emerald-700 to-teal-800 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Sprout className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm font-display flex items-center gap-1.5">
                  <span>Krishi Advisory Desk 🌾</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/30 border border-green-400/40 text-emerald-200">
                    Agri Expert
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-100/90 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-time mandi rates & agronomic guidance</span>
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

                  <div className="flex items-center justify-between text-[9px] text-slate-400 px-1 font-mono gap-2">
                    <span>{msg.timestamp}</span>
                    {msg.provider && (
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-sans">
                        {msg.provider}
                      </span>
                    )}
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
                <span>Checking mandi rates & advice...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestions */}
          <div className="p-2.5 bg-white border-t border-slate-100 overflow-x-auto no-scrollbar flex items-center gap-1.5">
            {aiContent.suggestions.map((s, idx) => (
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
              if (e.cancelable) e.preventDefault();
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
