import React from "react";
import { ThemePreset, ThemeConfig } from "../types";
import { THEME_CONFIGS } from "../lib/themePresets";
import { Check, X } from "lucide-react";

interface ThemeSelectorModalProps {
  isOpen: boolean;
  currentTheme: ThemeConfig;
  onSelectTheme: (preset: ThemePreset) => void;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  currentTheme,
  onSelectTheme,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white">Roxy's Aura Vibe</h3>
            <p className="text-xs text-gray-400">Choose a futuristic visual color theme</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {(Object.values(THEME_CONFIGS) as ThemeConfig[]).map((cfg) => {
            const isSelected = currentTheme.id === cfg.id;
            return (
              <button
                key={cfg.id}
                onClick={() => {
                  onSelectTheme(cfg.id);
                  onClose();
                }}
                className={`flex items-center space-x-3 p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "border-white bg-white/15 shadow-lg"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center"
                  style={{ backgroundColor: cfg.primary }}
                >
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{cfg.name}</div>
                  <div className="text-[10px] font-mono text-gray-400 uppercase">
                    {cfg.id}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
