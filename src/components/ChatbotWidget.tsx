import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, RefreshCw } from 'lucide-react';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    {
      role: 'model',
      text: 'Namaste! Welcome to Neelu Vora Haute Atelier. I am your concierge stylist. How can I assist you with fine jewelry purities, styling recommendations, or saree drapes today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat history
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    // Call secure server-side Gemini proxy (api.ts endpoint /api/ai/chat)
    fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg })
    })
      .then(res => res.json())
      .then(data => {
        setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setMessages(prev => [...prev, { role: 'model', text: "Forgive me, my connection to the Maison server encountered a transient disturbance. Please ask again shortly." }]);
        setLoading(false);
      });
  };

  return (
    <div id="chatbot-widget-container" className="fixed bottom-6 left-6 z-40">
      
      {/* Floating Action Circle */}
      {!isOpen && (
        <button
          id="chatbot-fab"
          onClick={() => setIsOpen(true)}
          className="bg-luxury-black hover:bg-gold-600 hover:text-black text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center border border-gold-800/20"
          title="Styling Concierge Chat"
        >
          <MessageSquare size={26} className="text-gold-400 animate-pulse" />
        </button>
      )}

      {/* Expanded Stylist Window */}
      {isOpen && (
        <div id="chatbot-panel" className="bg-white border-2 border-gold-400/50 rounded-lg shadow-2xl w-80 sm:w-96 h-[480px] flex flex-col justify-between overflow-hidden animate-scaleUp">
          
          {/* Header */}
          <div className="bg-luxury-black text-white p-4 flex items-center justify-between border-b border-gold-800/20">
            <div className="flex items-center space-x-2">
              <span className="text-gold-500 font-bold">⚜</span>
              <div>
                <h4 className="font-serif text-sm font-bold tracking-wide uppercase">Maison Stylist</h4>
                <p className="text-[8px] text-gold-400 uppercase tracking-widest font-semibold flex items-center gap-0.5">
                  <Sparkles size={8} /> Active Gemini AI
                </p>
              </div>
            </div>
            <button
              id="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Thread panel */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#050505]">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded px-3 py-2 text-xs leading-relaxed ${msg.role === 'user' ? 'bg-gold-600 text-black font-semibold rounded-br-none shadow-md' : 'bg-[#121212] text-gray-100 border border-gold-500/10 rounded-bl-none shadow-sm'}`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#121212] border border-gold-500/10 rounded px-3.5 py-2 text-xs text-gray-400 flex items-center gap-1.5 shadow-sm">
                  <RefreshCw size={10} className="animate-spin text-gold-500" />
                  <span>Atelier assistant drafting response...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input sender */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gold-500/20 flex gap-2 bg-[#0c0c0c]">
            <input
              id="chatbot-input-field"
              type="text"
              placeholder="Ask: Recommend necklaces or silk care..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border border-gold-500/20 text-xs rounded px-3 py-2 text-gray-100 placeholder-gray-500 bg-[#121212] focus:outline-none focus:border-gold-500"
            />
            <button
              id="chatbot-send-btn"
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-gold-600 hover:bg-gold-500 text-black font-bold p-2.5 rounded transition disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
