import React from "react";
import { ThemeConfig, AppState, AppSettings } from "../types";
import {
  Mic,
  MicOff,
  Palette,
  Info,
  Sparkles,
  History,
  Settings,
  MessageSquare,
  Radio,
  Sliders,
} from "lucide-react";

interface HeaderBarProps {
  theme: ThemeConfig;
  settings: AppSettings;
  isMuted: boolean;
  appState: AppState;
  viewMode: "orb" | "chat";
  onToggleViewMode: () => void;
  onToggleMute: () => void;
  onOpenThemeModal: () => void;
  onOpenInfoModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenSettingsModal: () => void;
  historyCount: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  theme,
  settings,
  isMuted,
  appState,
  viewMode,
  onToggleViewMode,
  onToggleMute,
  onOpenThemeModal,
  onOpenInfoModal,
  onOpenHistoryModal,
  onOpenSettingsModal,
  historyCount,
}) => {
  const aiName = settings?.aiName || "Roxy";
  const language = settings?.language || "hi";

  return (
    <header className="w-full h-20 border-b border-[#1a1a1a] bg-gradient-to-b from-[#0a0a0a] to-[#050505] px-4 sm:px-6 flex items-center justify-between z-30 font-sans select-none">
      {/* Brand Identity */}
      <div className="flex items-center space-x-3.5">
        <div
          className="w-10 h-10 border border-[#1f1f26] bg-[#0f0f14] rounded-xl flex items-center justify-center shadow-inner"
          style={{ borderColor: `${theme.primary}40` }}
        >
          <Sparkles className="w-5 h-5" style={{ color: theme.primary }} />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-black tracking-tighter text-white flex items-center space-x-2 uppercase">
            <span>{aiName}</span>
            <span style={{ color: theme.primary }}>AI</span>
          </h1>
          <p className="text-[10px] font-mono text-[#888888] tracking-wider uppercase flex items-center space-x-1.5">
            <span>Live Companion</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">{language.toUpperCase()}</span>
          </p>
        </div>
      </div>

      {/* Central View Switcher Segmented Control */}
      <div className="flex items-center bg-[#0d0d10] border border-[#1f1f26] rounded-xl p-1 shadow-inner">
        <button
          id="view-orb-mode-btn"
          onClick={() => viewMode !== "orb" && onToggleViewMode()}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
            viewMode === "orb"
              ? "bg-[#181820] text-white shadow-sm border border-[#2a2a38]"
              : "text-[#888890] hover:text-white"
          }`}
          style={{
            color: viewMode === "orb" ? theme.primary : undefined,
          }}
          title="Switch to 3D Audio Visual Orb Studio"
        >
          <Radio className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Voice Orb</span>
        </button>

        <button
          id="view-chat-mode-btn"
          onClick={() => viewMode !== "chat" && onToggleViewMode()}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer relative ${
            viewMode === "chat"
              ? "bg-[#181820] text-white shadow-sm border border-[#2a2a38]"
              : "text-[#888890] hover:text-white"
          }`}
          style={{
            color: viewMode === "chat" ? theme.primary : undefined,
          }}
          title="Switch to Interactive Text & Voice Chat"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
          {historyCount > 0 && (
            <span
              className="text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ml-0.5"
              style={{
                backgroundColor: `${theme.primary}25`,
                color: theme.primary,
              }}
            >
              {historyCount}
            </span>
          )}
        </button>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {/* Toggle Mic Mute Button */}
        <button
          id="toggle-mic-mute-btn"
          onClick={onToggleMute}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          className={`p-2 sm:p-2.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
            isMuted
              ? "bg-red-500/20 border-red-500/40 text-red-400"
              : "bg-[#0f0f12] border-[#1f1f26] text-[#888890] hover:text-white hover:border-[#353545]"
          }`}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Conversation History Modal Button */}
        <button
          id="open-history-btn"
          onClick={onOpenHistoryModal}
          title="View Full Conversation Transcript Log"
          className="p-2 sm:p-2.5 rounded-xl bg-[#0f0f12] border border-[#1f1f26] text-[#888890] hover:text-white hover:border-[#353545] transition-all cursor-pointer"
        >
          <History className="w-4 h-4" />
        </button>

        {/* Visual Theme Selector Button */}
        <button
          id="open-theme-picker-btn"
          onClick={onOpenThemeModal}
          title="Change Visual Aura Theme"
          className="p-2 sm:p-2.5 rounded-xl bg-[#0f0f12] border border-[#1f1f26] text-[#888890] hover:text-white hover:border-[#353545] transition-all cursor-pointer"
        >
          <Palette className="w-4 h-4" />
        </button>

        {/* Application Settings Modal Button */}
        <button
          id="open-settings-btn"
          onClick={onOpenSettingsModal}
          title="Language, AI Gender, Voice & API Key Settings"
          className="p-2 sm:p-2.5 rounded-xl bg-[#0f0f12] border border-[#1f1f26] text-[#888890] hover:text-white hover:border-[#353545] transition-all cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Info Modal Button */}
        <button
          id="open-info-btn"
          onClick={onOpenInfoModal}
          title="About Voice & Chat Assistant"
          className="hidden sm:flex p-2 sm:p-2.5 rounded-xl bg-[#0f0f12] border border-[#1f1f26] text-[#888890] hover:text-white hover:border-[#353545] transition-all cursor-pointer"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
