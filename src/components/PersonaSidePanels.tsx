import React from "react";
import { AppState, ThemeConfig, ToolActionNotification, AudioMetrics, ConversationMessage } from "../types";
import { Terminal, Radio, MessageSquare, ExternalLink, Sparkles, Sliders, Brain } from "lucide-react";

interface PersonaLeftPanelProps {
  appState: AppState;
  theme: ThemeConfig;
  aiName?: string;
}

export const PersonaLeftPanel: React.FC<PersonaLeftPanelProps> = ({
  appState,
  theme,
  aiName = "Roxy",
}) => {
  const nameUpper = (aiName || "Roxy").toUpperCase();
  const getMoodText = () => {
    switch (appState) {
      case "listening":
        return "Listening intently with sharp wit";
      case "speaking":
        return "Delivering witty banter & advice";
      case "connecting":
        return `Booting up ${aiName} persona matrix`;
      case "error":
        return "Slightly annoyed at connection lag";
      default:
        return "Ready to chat via text or voice";
    }
  };

  return (
    <aside className="w-full flex flex-col gap-6 p-6 border-b lg:border-b-0 lg:border-r border-[#1a1a1a] bg-[#050505]/90 text-white font-sans">
      {/* Persona Module */}
      <div>
        <div className="text-[10px] uppercase font-mono tracking-widest text-[#888888] mb-2 font-semibold flex items-center justify-between">
          <span>Persona Module</span>
          <span className="font-bold text-white font-mono">{nameUpper}</span>
        </div>
        <div className="font-serif italic text-sm text-[#cccccc] leading-relaxed border-l-2 pl-3 border-[#FF2E63]" style={{ borderColor: theme.primary }}>
          "Namaste! Ready to talk or chat? Ask me anything or tell me what to do!"
        </div>
        <div className="mt-3">
          <span
            className="inline-block px-3 py-1 text-xs font-bold font-mono tracking-wider border rounded uppercase"
            style={{
              borderColor: theme.primary,
              color: theme.primary,
              backgroundColor: `${theme.primary}10`,
            }}
          >
            Sassy & Playful
          </span>
        </div>
      </div>

      {/* System Metrics Grid */}
      <div>
        <div className="text-[10px] uppercase font-mono tracking-widest text-[#888888] mb-2 font-semibold">
          AI Attributes
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="border border-[#1a1a1a] bg-[#0f0f0f] p-3 rounded flex flex-col justify-center">
            <span className="text-[9px] font-mono text-[#888888] uppercase tracking-wider">IQ LEVEL</span>
            <span className="text-lg font-bold font-mono text-white mt-0.5">184</span>
          </div>
          <div className="border border-[#1a1a1a] bg-[#0f0f0f] p-3 rounded flex flex-col justify-center">
            <span className="text-[9px] font-mono text-[#888888] uppercase tracking-wider">CHARM</span>
            <span className="text-lg font-bold font-mono text-white mt-0.5" style={{ color: theme.primary }}>
              99%
            </span>
          </div>
        </div>
      </div>

      {/* Current Mood */}
      <div className="border border-[#1a1a1a] bg-[#0f0f0f] p-3.5 rounded">
        <div className="text-[9px] uppercase font-mono tracking-widest text-[#888888] mb-1">
          Current Vibe / Mood
        </div>
        <div className="text-xs font-medium text-[#e0e0e0] flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: theme.primary }} />
          <span>{getMoodText()}</span>
        </div>
      </div>
    </aside>
  );
};

interface PersonaRightPanelProps {
  toolHistory: ToolActionNotification[];
  audioMetrics: AudioMetrics;
  theme: ThemeConfig;
  appState: AppState;
  messages: ConversationMessage[];
  onOpenHistoryModal: () => void;
  onOpenChatView?: () => void;
  aiName?: string;
}

export const PersonaRightPanel: React.FC<PersonaRightPanelProps> = ({
  toolHistory,
  audioMetrics,
  theme,
  appState,
  messages,
  onOpenHistoryModal,
  onOpenChatView,
  aiName = "Roxy",
}) => {
  return (
    <aside className="w-full flex flex-col gap-5 p-6 border-t lg:border-t-0 lg:border-l border-[#1a1a1a] bg-[#050505]/90 text-white font-sans">
      {/* Live Conversation Stream & Memory Section */}
      <div>
        <div className="text-[10px] uppercase font-mono tracking-widest text-[#888888] mb-2.5 font-semibold flex items-center justify-between">
          <span>Continuous Memory</span>
          <Brain className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="p-3 bg-[#0a0a0e] border border-[#1a1a20] rounded-xl flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#888890] font-mono text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Memory Retained:
            </span>
            <span className="font-bold font-mono text-emerald-400">{messages.length} turns</span>
          </div>
          {messages.length > 0 ? (
            <div className="text-xs text-[#cccccc] font-sans line-clamp-2 bg-[#121218] p-2 rounded border border-[#1f1f28] italic">
              "{messages[messages.length - 1].text}"
            </div>
          ) : (
            <p className="text-[11px] text-[#666670] italic">Continuous memory active. Everything you speak or write is remembered!</p>
          )}

          <div className="flex gap-2 mt-1">
            {onOpenChatView && (
              <button
                onClick={onOpenChatView}
                className="flex-1 py-1.5 px-2.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#161620] hover:bg-[#202030] text-white border border-[#2a2a38] transition-all flex items-center justify-center space-x-1"
              >
                <MessageSquare className="w-3 h-3" style={{ color: theme.primary }} />
                <span>Open Chat</span>
              </button>
            )}
            <button
              onClick={onOpenHistoryModal}
              className="py-1.5 px-2.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#121218] hover:bg-[#1c1c24] text-[#aaaaaa] hover:text-white border border-[#22222c] transition-all"
              title="View full history transcript"
            >
              Logs
            </button>
          </div>
        </div>
      </div>

      {/* Recent Tool Calls */}
      <div>
        <div className="text-[10px] uppercase font-mono tracking-widest text-[#888888] mb-2.5 font-semibold flex items-center justify-between">
          <span>Recent Tool Calls</span>
          <Terminal className="w-3.5 h-3.5 text-[#888888]" />
        </div>
        <div className="flex flex-col gap-2">
          {toolHistory.length === 0 ? (
            <div className="text-xs font-mono text-[#666666] italic p-3 border border-[#1a1a1a] bg-[#080808] rounded">
              No functions invoked yet. Try asking {aiName} to open YouTube!
            </div>
          ) : (
            toolHistory.slice(-2).map((item) => (
              <div
                key={item.id}
                className="bg-[#0f0f0f] border border-[#1a1a1a] p-2.5 rounded text-xs font-mono flex items-center justify-between"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span style={{ color: theme.primary }}>&#8227;</span>
                  <span className="truncate text-[#e0e0e0] font-semibold">{item.title}</span>
                </div>
                <span className="text-[9px] text-[#666666] ml-2 flex-shrink-0">{item.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Audio Stream Data Monitor */}
      <div>
        <div className="text-[10px] uppercase font-mono tracking-widest text-[#888888] mb-2 font-semibold flex items-center justify-between">
          <span>Live Audio Stream</span>
          <Radio className="w-3.5 h-3.5 text-[#888888]" />
        </div>

        <div className="bg-[#000000] border border-[#1a1a1a] p-3 rounded">
          <div className="flex items-center justify-between text-[9px] font-mono text-[#888888] mb-2">
            <span>INPUT: PCM16 16kHz</span>
            <span style={{ color: appState !== "disconnected" ? theme.primary : "#555" }}>
              {(appState || "idle").toUpperCase()}
            </span>
          </div>

          <div className="h-9 flex items-end gap-1">
            {Array.from({ length: 16 }).map((_, idx) => {
              const freqVal = audioMetrics.frequencies[idx * 2] || 0;
              const heightPct = appState !== "disconnected" ? Math.max(15, Math.min(100, (freqVal / 255) * 100)) : 10;
              return (
                <div
                  key={idx}
                  className="flex-1 transition-all duration-75 rounded-t-sm"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: appState === "speaking" ? theme.primary : appState === "listening" ? "#ffffff" : "#333333",
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
