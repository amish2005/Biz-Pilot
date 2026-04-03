import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Bot, User, Download, Plus, RotateCcw, TimerReset, Mic, MicOff, Languages, Cpu, ShieldAlert } from 'lucide-react';
import type { ProviderInfo } from '../types';

interface Props {
  agentId: string;
  agentName: string;
  providerInfo: ProviderInfo;
  onBack: () => void;
  onNewAgent: () => void;
}

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
}

export default function AgentChat({ agentId, agentName, providerInfo, onBack, onNewAgent }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: `Hi! I'm ${agentName}, your AutoGen agent running on ${providerInfo.model} via ${providerInfo.provider}. Send me a message to test the live workflow.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [pendingRetryMessage, setPendingRetryMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'en-US' | 'hi-IN'>('en-US');
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech Recognition is not supported in your browser.');
      return;
    }
    const recognition = new SpeechRec();
    recognition.lang = voiceLang;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setInput(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownSeconds(0);
      return;
    }
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownSeconds(remaining);
      if (remaining === 0) {
        setCooldownUntil(null);
      }
    };
    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(intervalId);
  }, [cooldownUntil]);

  const sendMessage = async (message: string, appendUserMessage = true) => {
    if (!message.trim()) return;

    if (appendUserMessage) {
      setMessages((prev) => [...prev, { role: 'user', text: message }]);
    }
    setIsTyping(true);

    try {
      const response = await fetch(`/api/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'The chat request failed.');
      }

      if (data.status === 'rate_limited') {
        const waitSeconds = Number(data.wait_seconds) || 60;
        setPendingRetryMessage(message);
        setCooldownUntil(Date.now() + waitSeconds * 1000);
        const replyText = data.reply || `Rate limit reached. Please wait ${waitSeconds} seconds.`;
        setMessages((prev) => [...prev, { role: 'assistant', text: replyText }]);
        return;
      }

      setPendingRetryMessage(null);
      setCooldownUntil(null);
      const replyText = data.reply || 'No reply returned by the agent.';
      setMessages((prev) => [...prev, { role: 'assistant', text: replyText }]);
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Backend unreachable.';
      setMessages((prev) => [...prev, { role: 'assistant', text: `Backend error: ${errorText}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || cooldownSeconds > 0) return;
    const message = input.trim();
    setInput('');
    await sendMessage(message, true);
  };

  const handleRetry = async () => {
    if (!pendingRetryMessage || isTyping || cooldownSeconds > 0) return;
    await sendMessage(pendingRetryMessage, true);
  };

  return (
    <div className="h-screen bg-[#050505] flex flex-col font-sans relative overflow-hidden">
      {/* Background Atmosphere */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10 z-0 pointer-events-none"
        style={{ backgroundImage: "url('https://framerusercontent.com/images/EqTvMX987cRyoYGTSVcaTDhwgWM.jpg')" }}
      />

      {/* Premium Header */}
      <header className="px-6 py-6 md:px-12 border-b border-white/[0.04] flex justify-between items-center bg-[#050505]/90 backdrop-blur-2xl sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-luxury"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="text-[10px] font-mono tracking-[0.3em] text-cyan-400 uppercase mb-1 font-bold animate-pulse">Live Inference Stream</div>
            <h1 className="text-2xl font-serif text-white tracking-tight leading-none">{agentName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Hindi / English Toggle */}
          <button
            onClick={() => setVoiceLang(voiceLang === 'en-US' ? 'hi-IN' : 'en-US')}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-white/60 hover:text-white transition-luxury"
            title="Toggle Hindi / English"
          >
            <Languages size={14} />
            <span className="text-[11px] font-bold tracking-widest uppercase">{voiceLang === 'hi-IN' ? '\u0939\u093f\u0902' : 'EN'}</span>
          </button>
          <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full border border-white/[0.05] bg-white/[0.03] shadow-inner">
            <Cpu size={14} className="text-white/30" />
            <span className="text-[11px] font-mono tracking-widest text-white/50 uppercase font-bold">gemini-1.5-flash</span>
          </div>
          <button
            onClick={() => window.open(`/api/agents/${agentId}/download`, '_blank')}
            className="w-10 h-10 rounded-full border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-luxury"
            title="Download Agent Script"
          >
            <Download size={16} />
          </button>
          <button
            onClick={onNewAgent}
            className="text-white/30 hover:text-white transition-luxury flex items-center gap-2 group"
          >
            <Plus size={16} className="group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold uppercase tracking-widest hidden sm:inline">New</span>
          </button>
        </div>
      </header>

      {/* Cooldown Banner */}
      {(cooldownSeconds > 0 || pendingRetryMessage) && (
        <div className="px-6 md:px-12 py-4 border-b border-white/[0.04] bg-white/[0.02] flex items-center justify-between gap-6 z-40">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <TimerReset size={18} className="text-white/40" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white">Gemini Cooldown</p>
              <p className="text-[12px] text-white/40">
                {cooldownSeconds > 0
                  ? `Free-tier capacity is cooling down. Retry available in ${cooldownSeconds}s.`
                  : 'Your last prompt is ready to retry.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            disabled={!pendingRetryMessage || cooldownSeconds > 0 || isTyping}
            className="px-6 py-3 rounded-2xl border border-white/10 bg-white/5 text-white/60 hover:text-white disabled:opacity-20 transition-luxury flex items-center gap-2 text-sm font-bold"
          >
            <RotateCcw size={14} />
            {cooldownSeconds > 0 ? `Retry in ${cooldownSeconds}s` : 'Retry'}
          </button>
        </div>
      )}

      {/* Main Chat Interface */}
      <main className="flex-1 overflow-y-auto pt-16 pb-12 relative z-10" ref={scrollRef}>
        <div className="max-w-4xl mx-auto w-full px-6 space-y-16">
          {messages.map((msg, index) => (
            <div key={index} className="flex gap-8 animate-fade-in group">
              <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 border transition-luxury ${msg.role === 'assistant' ? 'border-white/10 bg-white/5 text-white/50' : 'border-white/5 bg-transparent text-white/20'}`}>
                {msg.role === 'assistant' ? <Bot size={24} /> : <User size={24} />}
              </div>
              <div className="flex-1 space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
                    {msg.role === 'assistant' ? agentName : 'You'}
                  </div>
                </div>
                <div className={`text-[17px] leading-relaxed font-light ${msg.role === 'assistant' ? 'text-white/90' : 'text-white/60'} whitespace-pre-wrap selection:bg-white selection:text-black`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-8 animate-pulse">
              <div className="w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 border border-white/10 bg-white/5 text-white/40">
                <Bot size={24} />
              </div>
              <div className="flex-1 space-y-4 pt-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 font-mono animate-blink">Synthesizing...</div>
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}
          {/* Spacer to prevent input overlay */}
          <div className="h-40" />
        </div>
      </main>

      {/* Input Terminal Shell */}
      <div className="absolute bottom-0 w-full px-6 py-12 md:pb-16 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent z-50">
        <div className="max-w-4xl mx-auto w-full relative">
          <form onSubmit={handleSend} className="relative group flex gap-3">
            <div className="absolute inset-0 bg-white/[0.02] blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <input
              type="text"
              className="relative flex-1 bg-[#080808]/80 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-6 text-xl outline-none focus:border-white/30 transition-luxury placeholder:text-white/10 font-light pr-20 shadow-2xl"
              placeholder={cooldownSeconds > 0 ? `Cooldown active (${cooldownSeconds}s)...` : `Communicate with ${agentName}...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isTyping || cooldownSeconds > 0}
            />
            {/* Mic Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`relative w-14 rounded-2xl border flex items-center justify-center transition-luxury shadow-xl ${isListening ? 'bg-white/10 border-white/30' : 'bg-[#080808]/80 border-white/10 hover:border-white/20'}`}
            >
              {isListening ? <Mic size={20} className="text-white animate-pulse" /> : <MicOff size={20} className="text-white/30" />}
            </button>
            {/* Send Button */}
            <button
              type="submit"
              disabled={isTyping || cooldownSeconds > 0 || !input.trim()}
              className="relative w-14 rounded-2xl bg-white text-black flex items-center justify-center hover:scale-[1.08] active:scale-95 transition-luxury disabled:opacity-10 shadow-xl"
            >
              <Send size={20} />
            </button>
          </form>
          <div className="mt-6 flex justify-between items-center px-4 opacity-10 text-[10px] font-bold uppercase tracking-[0.3em] font-mono pointer-events-none">
            <div className="flex items-center gap-3">
              <ShieldAlert size={12} />
              ENCRYPTED_SESSION: {agentId.slice(0, 16)}
            </div>
            <span>LATENT_LATENCY: 24MS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
