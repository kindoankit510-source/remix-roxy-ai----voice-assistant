import React, { useState, useRef, useEffect } from "react";
import { ThemeConfig, ConversationMessage, AppState, AppSettings } from "../types";
import {
  Send,
  Bot,
  User,
  Wrench,
  Sparkles,
  Trash2,
  Copy,
  Check,
  MessageSquare,
  Mic,
  Volume2,
  ExternalLink,
  RotateCcw,
  Sliders,
  Globe,
  Radio,
  Zap,
  Brain,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ConversationalChatPanelProps {
  messages: ConversationMessage[];
  theme: ThemeConfig;
  appState: AppState;
  settings: AppSettings;
  isTyping?: boolean;
  onSendMessage: (text: string) => void;
  onClearHistory: () => void;
  onConnectVoice: () => void;
  onSwitchToOrb?: () => void;
  onOpenSettings?: () => void;
}

export const ConversationalChatPanel: React.FC<ConversationalChatPanelProps> = ({
  messages,
  theme,
  appState,
  settings,
  isTyping = false,
  onSendMessage,
  onClearHistory,
  onConnectVoice,
  onSwitchToOrb,
  onOpenSettings,
}) => {
  const [inputText, setInputText] = useState("");
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const aiName = settings?.aiName || "Roxy";
  const language = settings?.language || "hi";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleCopy = () => {
    if (messages.length === 0) return;
    const textToCopy = messages
      .map((m) => `[${m.timestamp || ""}] ${(m.sender || "system").toUpperCase()}: ${m.text || ""}`)
      .join("\n");
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const samplePrompts = [
    language === "hi"
      ? "Namaste Roxy! Hindi mein baat karo na"
      : "Hey Roxy, what can you do?",
    "Mera naam yaad rakhna, main Ankit hoon",
    "Humne pehle kya baat ki thi? Kya tumhe yaad hai?",
    "Open YouTube for me",
    "Change visual theme to Cyber Purple",
    "Aaj ka time aur tareekh batao",
    "Tell me a funny joke!",
  ];

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-[540px] md:h-[580px] bg-[#09090b] border border-[#1f1f23] rounded-2xl shadow-2xl overflow-hidden font-sans relative">
      {/* Panel Top Bar */}
      <div className="px-4 md:px-5 py-3 border-b border-[#1c1c22] bg-[#0e0e12] flex items-center justify-between z-10 select-none">
        <div className="flex items-center space-x-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center border border-[#26262e] shadow-inner"
            style={{ backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}40` }}
          >
            <MessageSquare className="w-4 h-4" style={{ color: theme.primary }} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>{aiName} Live Chat</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    appState === "listening" || appState === "speaking"
                      ? "bg-emerald-400 animate-pulse"
                      : appState === "connecting"
                      ? "bg-amber-400 animate-pulse"
                      : "bg-[#555555]"
                  }`}
                  title={`Status: ${appState}`}
                />
              </h3>
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase"
                style={{
                  color: theme.primary,
                  borderColor: `${theme.primary}40`,
                  backgroundColor: `${theme.primary}10`,
                }}
              >
                {language.toUpperCase()}
              </span>

              {/* Memory Status Badge */}
              <span
                className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#16161e] text-emerald-400 border border-emerald-500/30"
                title="Continuous conversation memory retention is active"
              >
                <Brain className="w-3 h-3 text-emerald-400" />
                <span>Memory Active ({messages.length})</span>
              </span>
            </div>
            <p className="text-[10px] text-[#888890] font-mono">
              {appState === "disconnected"
                ? `Memory Active (${messages.length} turns) • Text Chat Ready`
                : appState === "speaking"
                ? `${aiName} is speaking audio live...`
                : "Real-time Voice & Text Stream Active"}
            </p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center space-x-1.5">
          {onSwitchToOrb && (
            <button
              id="switch-to-orb-view-btn"
              onClick={onSwitchToOrb}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-mono text-[#aaaaaa] hover:text-white bg-[#141418] hover:bg-[#1c1c22] border border-[#22222a] transition-all"
              title="Switch to 3D Audio Visual Orb View"
            >
              <Radio className="w-3.5 h-3.5" style={{ color: theme.primary }} />
              <span className="hidden sm:inline">Orb View</span>
            </button>
          )}

          {appState === "disconnected" && (
            <button
              id="chat-start-voice-btn"
              onClick={onConnectVoice}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-black transition-all hover:scale-105 active:scale-95 shadow-md"
              style={{ backgroundColor: theme.primary }}
              title="Connect Voice to Speak and Listen"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice</span>
            </button>
          )}

          <button
            id="chat-copy-transcript-btn"
            onClick={handleCopy}
            disabled={messages.length === 0}
            className="p-2 rounded-lg border border-[#22222a] bg-[#141418] text-[#aaaaaa] hover:text-white transition-all disabled:opacity-30 cursor-pointer"
            title="Copy Chat Transcript"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            id="chat-clear-history-btn"
            onClick={onClearHistory}
            disabled={messages.length === 0}
            className="p-2 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-30 cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Stream Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3.5 bg-[#050507]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#666670]">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border border-[#22222a] bg-[#0d0d11]"
              style={{ color: theme.primary }}
            >
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Chat with {aiName} AI</h4>
            <p className="text-xs text-[#888890] mt-1 max-w-sm">
              Type in Hindi, Hinglish, or English. You can also tap prompts below or turn on the microphone!
            </p>

            {/* Quick Starter Chips */}
            <div className="mt-5 flex flex-wrap gap-2 justify-center max-w-lg">
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(prompt)}
                  className="px-3 py-1.5 rounded-full border border-[#22222a] bg-[#0e0e12] text-[11px] text-[#cccccc] hover:text-white hover:border-[#383848] transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>"{prompt}"</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${
                msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Sender Avatar */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm ${
                  msg.sender === "roxy"
                    ? "bg-[#14141a] border border-[#282834]"
                    : msg.sender === "user"
                    ? "bg-purple-950/70 text-purple-200 border border-purple-800/50"
                    : "bg-emerald-950/70 text-emerald-300 border border-emerald-800/50"
                }`}
                style={
                  msg.sender === "roxy"
                    ? { color: theme.primary, borderColor: `${theme.primary}50` }
                    : undefined
                }
              >
                {msg.sender === "roxy" ? (
                  <Bot className="w-4 h-4" />
                ) : msg.sender === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Wrench className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed font-sans shadow-md ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-700/40 text-purple-50 rounded-tr-none"
                    : msg.sender === "roxy"
                    ? "bg-[#111116] border border-[#22222c] text-[#f0f0f4] rounded-tl-none"
                    : "bg-emerald-950/40 border border-emerald-800/40 text-emerald-100 rounded-tl-none font-mono text-[11px]"
                }`}
              >
                <div className="flex items-center justify-between mb-1 gap-4">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888894]">
                    {msg.sender === "roxy"
                      ? `${aiName} AI`
                      : msg.sender === "user"
                      ? "You"
                      : "System Action"}
                  </span>
                  <span className="text-[9px] font-mono text-[#666672]">{msg.timestamp}</span>
                </div>
                <p className="whitespace-pre-wrap selection:bg-purple-500/30 selection:text-white">
                  {msg.text}
                </p>

                {/* If tool was executed, show a badge */}
                {msg.toolCallName && (
                  <div className="mt-2 pt-2 border-t border-emerald-500/20 flex items-center space-x-1 text-[10px] text-emerald-400 font-mono">
                    <Wrench className="w-3 h-3" />
                    <span>Tool Invoked: {msg.toolCallName}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center space-x-2 text-xs text-[#888890] font-mono pl-10 py-1">
            <div className="flex space-x-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#aaaaaa] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#aaaaaa] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#aaaaaa] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span>{aiName} is replying...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips Bar above input when messages exist */}
      {messages.length > 0 && (
        <div className="px-4 py-2 border-t border-[#181820] bg-[#0a0a0d] flex items-center space-x-2 overflow-x-auto no-scrollbar text-nowrap">
          <span className="text-[10px] font-mono text-[#666675] uppercase flex-shrink-0">Quick Ask:</span>
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(prompt)}
              className="px-2.5 py-1 rounded-full border border-[#202028] bg-[#121216] text-[10px] text-[#aaaaaa] hover:text-white hover:border-[#383848] transition-all flex-shrink-0 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Message Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 md:p-3.5 border-t border-[#1c1c24] bg-[#0c0c10] flex items-center gap-2"
      >
        <input
          ref={inputRef}
          id="chat-message-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message ${aiName} AI (e.g. 'Hindi mein baat karo na', 'Open YouTube')...`}
          className="flex-1 bg-[#060608] border border-[#202028] focus:border-[#444455] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#555560] outline-none transition-all font-sans"
        />

        <button
          id="chat-send-message-btn"
          type="submit"
          disabled={!inputText.trim()}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-black transition-all flex items-center space-x-1.5 disabled:opacity-40 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
          style={{ backgroundColor: theme.primary }}
          title="Send message (Enter)"
        >
          <Send className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline font-mono font-bold uppercase text-[11px]">Send</span>
        </button>
      </form>
    </div>
  );
};
