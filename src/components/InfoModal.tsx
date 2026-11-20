import React from "react";
import { X, Sparkles, Mic, Zap, ShieldCheck } from "lucide-react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <h3 className="text-lg font-bold text-white">About Roxy AI</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mt-4 text-sm text-gray-300">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20">
            <h4 className="font-bold text-white text-base mb-1">Meet Roxy</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Roxy is a witty, confident, sassy, and playful AI voice companion powered directly by Gemini 3.1 Live API. She speaks naturally like a close girlfriend with bold humor, sharp banter, and zero robotic monotone!
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Mic className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-white text-xs uppercase font-mono">Audio-to-Audio Native Streaming</h5>
                <p className="text-xs text-gray-400">
                  Streams 16kHz PCM microphone audio continuously to Gemini 3.1 Live API over WebSocket and plays back 24kHz studio-quality voice responses.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-white text-xs uppercase font-mono">Instant Voice Interruptions</h5>
                <p className="text-xs text-gray-400">
                  You can cut Roxy off anytime by speaking over her — the model recognizes your voice immediately and stops playback without delay.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-white text-xs uppercase font-mono">Live Function Calling</h5>
                <p className="text-xs text-gray-400">
                  Ask Roxy to open YouTube, Wikipedia, search topics, or change her ambient aura theme live!
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <h5 className="font-bold text-white text-xs mb-2">Try Saying:</h5>
            <ul className="text-xs space-y-1.5 text-gray-300 list-disc list-inside font-mono">
              <li>"Hey Roxy, open YouTube for me."</li>
              <li>"Give me a witty roast about standard AI assistants!"</li>
              <li>"Turn your visual theme to Neon Pink."</li>
              <li>"What time is it right now?"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
