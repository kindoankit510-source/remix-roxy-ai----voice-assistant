import React, { useEffect, useRef } from "react";
import { AppState, AudioMetrics, ThemeConfig } from "../types";
import { motion } from "motion/react";

interface VisualOrbProps {
  appState: AppState;
  audioMetrics: AudioMetrics;
  theme: ThemeConfig;
  onOrbClick: () => void;
  isMuted: boolean;
}

export const VisualOrb: React.FC<VisualOrbProps> = ({
  appState,
  audioMetrics,
  theme,
  onOrbClick,
  isMuted,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas animation for frequency waveform & fluid glowing particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let rotation = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = 90;

      // React to audio volume
      const vol = audioMetrics.volume || 0;
      const dynamicRadius = baseRadius + vol * 45;

      rotation += 0.01 + vol * 0.05;

      // Draw outer glowing audio frequency ring
      const numPoints = 64;
      const freqs = audioMetrics.frequencies;
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);

      if (appState === "listening" || appState === "speaking") {
        ctx.beginPath();
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          const freqVal = freqs[i % freqs.length] || 0;
          const amp = (freqVal / 255) * (appState === "speaking" ? 40 : 25);
          const r = dynamicRadius + amp;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = theme.primary;
        ctx.stroke();

        // Second inner shimmering wave
        ctx.beginPath();
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2 + Math.PI / numPoints;
          const freqVal = freqs[(i + 5) % freqs.length] || 0;
          const amp = (freqVal / 255) * (appState === "speaking" ? 25 : 15);
          const r = dynamicRadius - 15 + amp;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [appState, audioMetrics, theme]);

  // Determine state labels & aura styles
  const getOrbStateStyles = () => {
    switch (appState) {
      case "disconnected":
        return {
          pulseScale: [1, 1.03, 1],
          pulseDuration: 4,
          shadow: `0 0 35px ${theme.glowColor}`,
          borderColor: "rgba(255,255,255,0.2)",
          statusText: "POWER ON ROXY",
          subText: "Tap to start voice conversation",
        };
      case "connecting":
        return {
          pulseScale: [0.95, 1.1, 0.95],
          pulseDuration: 1.2,
          shadow: `0 0 60px ${theme.glowColor}`,
          borderColor: theme.primary,
          statusText: "CONNECTING...",
          subText: "Establishing secure neural audio stream",
        };
      case "listening":
        return {
          pulseScale: isMuted ? [1, 1.02, 1] : [1, 1.08 + audioMetrics.volume * 0.3, 1],
          pulseDuration: 1.8,
          shadow: `0 0 80px ${theme.glowColor}, 0 0 120px rgba(255,255,255,0.2)`,
          borderColor: theme.primary,
          statusText: isMuted ? "MIC MUTED" : "LISTENING...",
          subText: isMuted ? "Unmute mic to speak to Roxy" : "Talk naturally, Roxy is listening",
        };
      case "speaking":
        return {
          pulseScale: [1.02, 1.18 + audioMetrics.volume * 0.4, 1.02],
          pulseDuration: 0.8,
          shadow: `0 0 100px ${theme.glowColor}, 0 0 150px ${theme.primary}`,
          borderColor: "#ffffff",
          statusText: "ROXY SPEAKING...",
          subText: "Speak anytime to interrupt",
        };
      case "error":
        return {
          pulseScale: [1, 1.05, 1],
          pulseDuration: 1.5,
          shadow: "0 0 40px rgba(239, 68, 68, 0.6)",
          borderColor: "#ef4444",
          statusText: "CONNECTION ERROR",
          subText: "Tap orb to retry connection",
        };
    }
  };

  const orbStyle = getOrbStateStyles();

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-8">
      {/* Background radial atmosphere glow */}
      <div
        className="absolute w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] rounded-full blur-[70px] pointer-events-none transition-all duration-700 opacity-60"
        style={{
          background: theme.bgRadial,
        }}
      />

      {/* Canvas for real-time frequency soundwave rings */}
      <canvas
        ref={canvasRef}
        width={360}
        height={360}
        className="absolute z-10 pointer-events-none"
      />

      {/* Main Interactive Central Power / Orb Button */}
      <motion.button
        id="roxy-main-power-orb"
        onClick={onOrbClick}
        animate={{
          scale: orbStyle.pulseScale,
        }}
        transition={{
          repeat: Infinity,
          ease: "easeInOut",
          duration: orbStyle.pulseDuration,
        }}
        className="relative z-20 w-44 h-44 sm:w-56 sm:h-56 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-pink-500/50"
        style={{
          boxShadow: orbStyle.shadow,
          border: `2px solid ${orbStyle.borderColor}`,
          background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.25) 0%, rgba(15,12,28,0.92) 65%, ${theme.primary}33 100%)`,
        }}
      >
        {/* Inner Core Shimmer */}
        <div
          className="w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center relative overflow-hidden backdrop-blur-md"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.15), rgba(0,0,0,0.6))`,
          }}
        >
          {/* Animated Liquid Gradient Background */}
          <div
            className={`absolute inset-0 bg-gradient-to-tr ${theme.gradient} opacity-40 blur-md animate-pulse`}
          />

          {/* Core Icon / Logo */}
          <div className="relative z-30 flex flex-col items-center text-white">
            {appState === "disconnected" ? (
              <svg
                className="w-12 h-12 text-white/90 drop-shadow-lg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            ) : appState === "connecting" ? (
              <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="flex items-center space-x-1">
                {/* Dynamic voice indicator bars */}
                <div
                  className="w-1.5 bg-white rounded-full transition-all duration-75"
                  style={{
                    height: `${14 + (audioMetrics.frequencies[2] || 0) * 0.15}px`,
                  }}
                />
                <div
                  className="w-1.5 bg-white rounded-full transition-all duration-75"
                  style={{
                    height: `${22 + (audioMetrics.frequencies[8] || 0) * 0.25}px`,
                  }}
                />
                <div
                  className="w-1.5 bg-white rounded-full transition-all duration-75"
                  style={{
                    height: `${32 + (audioMetrics.frequencies[14] || 0) * 0.3}px`,
                  }}
                />
                <div
                  className="w-1.5 bg-white rounded-full transition-all duration-75"
                  style={{
                    height: `${22 + (audioMetrics.frequencies[20] || 0) * 0.25}px`,
                  }}
                />
                <div
                  className="w-1.5 bg-white rounded-full transition-all duration-75"
                  style={{
                    height: `${14 + (audioMetrics.frequencies[26] || 0) * 0.15}px`,
                  }}
                />
              </div>
            )}
            <span className="mt-2 text-[10px] tracking-widest font-mono uppercase text-white/80 font-bold">
              {appState === "disconnected" ? "TAP TO START" : "ROXY AI"}
            </span>
          </div>
        </div>
      </motion.button>

      {/* State Status Badge & Geometric Mode Prompt */}
      <div className="mt-8 text-center z-20 space-y-2">
        <div className="label text-[#888888] font-mono text-[10px] uppercase tracking-widest">
          {appState === "speaking" ? "NOW SPEAKING" : appState === "listening" ? "MICROPHONE ACTIVE" : "STATUS MODE"}
        </div>
        <div className="text-xl font-mono tracking-widest font-light text-white uppercase">
          {appState === "speaking" ? "WAVEFORM_ACTIVE" : orbStyle.statusText}
        </div>
        
        {/* Equalizer bars indicator */}
        {(appState === "listening" || appState === "speaking") && (
          <div className="flex gap-1 justify-center items-end h-6 mt-1">
            <div className="w-[3px] bg-[#FF2E63] animate-pulse" style={{ height: `${10 + (audioMetrics.frequencies[2] || 0) * 0.1}px`, backgroundColor: theme.primary }} />
            <div className="w-[3px] bg-[#FF2E63] animate-pulse" style={{ height: `${16 + (audioMetrics.frequencies[6] || 0) * 0.15}px`, backgroundColor: theme.primary }} />
            <div className="w-[3px] bg-[#FF2E63] animate-pulse" style={{ height: `${8 + (audioMetrics.frequencies[10] || 0) * 0.08}px`, backgroundColor: theme.primary }} />
            <div className="w-[3px] bg-[#FF2E63] animate-pulse" style={{ height: `${20 + (audioMetrics.frequencies[14] || 0) * 0.18}px`, backgroundColor: theme.primary }} />
            <div className="w-[3px] bg-[#FF2E63] animate-pulse" style={{ height: `${12 + (audioMetrics.frequencies[18] || 0) * 0.12}px`, backgroundColor: theme.primary }} />
          </div>
        )}
      </div>
    </div>
  );
};
