import React, { useState } from "react";
import { ThemeConfig, ConversationMessage } from "../types";
import { X, Search, Copy, Trash2, MessageSquare, Bot, User, Wrench, Check } from "lucide-react";

interface ConversationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ConversationMessage[];
  theme: ThemeConfig;
  onClearHistory: () => void;
}

export const ConversationHistoryModal: React.FC<ConversationHistoryModalProps> = ({
  isOpen,
  onClose,
  messages,
  theme,
  onClearHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const filteredMessages = messages.filter((msg) =>
    msg.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (msg.toolCallName && msg.toolCallName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCopy = () => {
    if (messages.length === 0) return;
    const textToCopy = messages
      .map((m) => `[${m.timestamp || ""}] ${(m.sender || "system").toUpperCase()}: ${m.text || ""}`)
      .join("\n");
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-sans">
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0f0f0f]">
          <div className="flex items-center space-x-3">
            <div
              className="p-2 rounded-lg border border-[#222]"
              style={{ backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}40` }}
            >
              <MessageSquare className="w-5 h-5" style={{ color: theme.primary }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Conversational History
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-[#1a1a1a] text-[#888]">
                  {messages.length} turns
                </span>
              </h2>
              <p className="text-xs text-[#888888]">
                Real-time transcript log of all spoken turns & system actions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#888888] hover:text-white hover:bg-[#1a1a1a] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Search Bar */}
        <div className="p-4 border-b border-[#1a1a1a] bg-[#050505] flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg text-white placeholder-[#555555] focus:outline-none focus:border-[#333333]"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopy}
              disabled={messages.length === 0}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#1a1a1a] bg-[#0f0f0f] text-[#cccccc] hover:text-white hover:border-[#333333] transition-all disabled:opacity-40"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Transcript"}</span>
            </button>

            <button
              onClick={onClearHistory}
              disabled={messages.length === 0}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* History Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#050505] min-h-[260px]">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#555555]">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm font-mono">No conversation history yet.</p>
              <p className="text-xs text-[#444444] mt-1 max-w-xs">
                Start speaking with Roxy AI using the microphone to log real-time conversation turns!
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 p-3.5 rounded-xl border ${
                  msg.sender === "roxy"
                    ? "bg-[#0f0f0f] border-[#1a1a1a]"
                    : msg.sender === "user"
                    ? "bg-[#121215] border-[#22222a]"
                    : "bg-[#0a0f0d] border-[#13241b]"
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    msg.sender === "roxy"
                      ? "bg-[#1a1a1a] text-white"
                      : msg.sender === "user"
                      ? "bg-purple-950/60 text-purple-300 border border-purple-800/40"
                      : "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                  }`}
                  style={
                    msg.sender === "roxy"
                      ? { color: theme.primary, backgroundColor: `${theme.primary}15` }
                      : undefined
                  }
                >
                  {msg.sender === "roxy" ? (
                    <Bot className="w-4 h-4" />
                  ) : msg.sender === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Wrench className="w-4 h-4" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888888]">
                      {msg.sender === "roxy" ? "Roxy AI" : msg.sender === "user" ? "You (User)" : "Tool Action"}
                    </span>
                    <span className="text-[9px] font-mono text-[#555555]">{msg.timestamp}</span>
                  </div>

                  <p className="text-xs text-[#e0e0e0] leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-[#1a1a1a] bg-[#090909] text-center text-[10px] font-mono text-[#666666]">
          Real-Time Streaming Session Log • Gemini Live Voice & Function Engine
        </div>
      </div>
    </div>
  );
};
