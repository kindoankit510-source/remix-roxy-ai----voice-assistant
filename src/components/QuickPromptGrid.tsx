import React from "react";
import { ThemeConfig } from "../types";
import { MessageSquareCode, Sparkles, Globe, Palette, Smile } from "lucide-react";

interface QuickPromptGridProps {
  theme: ThemeConfig;
  onSelectPrompt: (promptText: string) => void;
}

export const QuickPromptGrid: React.FC<QuickPromptGridProps> = ({
  theme,
  onSelectPrompt,
}) => {
  const prompts = [
    {
      icon: <Smile className="w-4 h-4 text-pink-400" />,
      text: "Namaste Roxy, Hindi mein baat karo na!",
      category: "Hindi Voice",
    },
    {
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
      text: "Roxy, YouTube kholo mere liye",
      category: "Hindi Tool Action",
    },
    {
      icon: <Palette className="w-4 h-4 text-purple-400" />,
      text: "Mera visual theme badal do",
      category: "Hindi Theme Action",
    },
    {
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      text: "Aaj ka time batao na Roxy!",
      category: "Hindi Time Query",
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto px-4 mt-4 z-20 font-sans">
      <div className="flex items-center space-x-2 mb-3">
        <MessageSquareCode className="w-4 h-4 text-[#888888]" />
        <span className="text-[10px] font-mono font-bold text-[#888888] uppercase tracking-widest">
          Conversational Sparks (Speak to Roxy)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {prompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(p.text)}
            className="group flex items-start space-x-3 p-3 rounded bg-[#0f0f0f] border border-[#1a1a1a] hover:border-[#333333] transition-all text-left"
          >
            <div className="p-2 rounded bg-[#050505] border border-[#1a1a1a] group-hover:scale-105 transition-transform">
              {p.icon}
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold text-[#888888] uppercase tracking-wider">
                {p.category}
              </span>
              <p className="text-xs text-[#e0e0e0] group-hover:text-white font-medium line-clamp-1 mt-0.5">
                "{p.text}"
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
