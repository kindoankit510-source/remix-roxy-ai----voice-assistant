import React from "react";
import { ToolActionNotification, ThemeConfig } from "../types";
import { ExternalLink, Sparkles, CheckCircle2, Clock, Globe, Palette } from "lucide-react";

interface ToolActionToastProps {
  notification: ToolActionNotification | null;
  history: ToolActionNotification[];
  theme: ThemeConfig;
  onClear: () => void;
}

export const ToolActionToast: React.FC<ToolActionToastProps> = ({
  notification,
  history,
  theme,
  onClear,
}) => {
  if (!notification && history.length === 0) return null;

  const current = notification || (history.length > 0 ? history[history.length - 1] : null);
  if (!current) return null;

  return (
    <div className="w-full max-w-md mx-auto px-4 my-3 z-30">
      <div
        id="roxy-tool-toast"
        className="relative overflow-hidden rounded-2xl p-4 border border-white/15 bg-slate-900/90 backdrop-blur-xl shadow-2xl transition-all duration-300"
        style={{
          boxShadow: `0 10px 30px ${theme.glowColor}`,
        }}
      >
        <div className="flex items-start space-x-3">
          <div
            className="p-2.5 rounded-xl text-white flex-shrink-0"
            style={{ backgroundColor: theme.primary }}
          >
            {current.toolName === "openWebsite" ? (
              <Globe className="w-5 h-5" />
            ) : current.toolName === "changeVisualTheme" ? (
              <Palette className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-pink-400">
                Roxy Action Executed
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {current.timestamp}
              </span>
            </div>

            <h4 className="text-sm font-bold text-white truncate mt-0.5">
              {current.title}
            </h4>

            <p className="text-xs text-gray-300 mt-1 line-clamp-2">
              {current.description}
            </p>

            {current.url && (
              <div className="mt-3 flex items-center space-x-2">
                <a
                  href={current.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                  style={{ backgroundColor: theme.primary }}
                >
                  <span>Launch {current.title}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          <button
            onClick={onClear}
            className="text-gray-400 hover:text-white p-1 rounded-lg text-xs"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};
