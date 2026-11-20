import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  AppState,
  ThemePreset,
  AudioMetrics,
  ToolActionNotification,
  ConversationMessage,
  AppSettings,
} from "./types";
import { THEME_CONFIGS } from "./lib/themePresets";
import { MicRecorder, ResponseAudioPlayer } from "./lib/AudioStreamer";
import { saveEncryptedApiKey, loadEncryptedApiKey } from "./lib/secureStorage";
import { VisualOrb } from "./components/VisualOrb";
import { HeaderBar } from "./components/HeaderBar";
import { ToolActionToast } from "./components/ToolActionToast";
import { QuickPromptGrid } from "./components/QuickPromptGrid";
import { ConversationalChatPanel } from "./components/ConversationalChatPanel";
import { ThemeSelectorModal } from "./components/ThemeSelectorModal";
import { InfoModal } from "./components/InfoModal";
import { ConversationHistoryModal } from "./components/ConversationHistoryModal";
import { SettingsModal } from "./components/SettingsModal";
import { PersonaLeftPanel, PersonaRightPanel } from "./components/PersonaSidePanels";
import {
  Mic,
  MicOff,
  AlertTriangle,
  MessageSquare,
  Radio,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [appState, setAppState] = useState<AppState>("disconnected");
  const [themePreset, setThemePreset] = useState<ThemePreset>("neon-pink");
  const [viewMode, setViewMode] = useState<"orb" | "chat">("orb");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // App Settings (Language, AI Gender, Prebuilt Voice, AI Name, Advanced API Key, Feature Toggles)
  const DEFAULT_SETTINGS: AppSettings = {
    language: "hi",
    aiGender: "female",
    voice: "Kore",
    aiName: "Roxy",
    apiKeyName: "GEMINI_API_KEY",
    customApiKey: "",
    responseSpeed: "balanced",
    temperature: 0.7,
    speakingRate: 1.0,
    continuousMemory: true,
    soundEffects: true,
    audioVisualizer: true,
    autoLanguageDetect: true,
    fastStreamMode: true,
    offlineFallback: true,
    autoMuteBackground: false,
  };

  const [settings, setSettings] = useState<AppSettings>(() => {
    const loadedEncryptedKey = loadEncryptedApiKey();
    try {
      const saved = localStorage.getItem("roxy_app_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return {
            ...DEFAULT_SETTINGS,
            ...parsed,
            customApiKey: loadedEncryptedKey || parsed.customApiKey || "",
          };
        }
      }
    } catch (e) {}
    return {
      ...DEFAULT_SETTINGS,
      customApiKey: loadedEncryptedKey,
    };
  });

  const [audioMetrics, setAudioMetrics] = useState<AudioMetrics>({
    volume: 0,
    frequencies: new Uint8Array(32),
  });

  const [activeNotification, setActiveNotification] = useState<ToolActionNotification | null>(null);
  const [notificationHistory, setNotificationHistory] = useState<ToolActionNotification[]>([]);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  
  // Persistent Conversation History with Memory across sessions & turns
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>(() => {
    try {
      const savedHistory = localStorage.getItem("roxy_conversation_history");
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return [];
  });

  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // References for WebSocket and Audio Managers
  const wsRef = useRef<WebSocket | null>(null);
  const micRecorderRef = useRef<MicRecorder | null>(null);
  const audioPlayerRef = useRef<ResponseAudioPlayer | null>(null);
  const pendingTextRef = useRef<string | null>(null);

  const themeConfig = THEME_CONFIGS[themePreset] || THEME_CONFIGS["neon-pink"];

  const appStateRef = useRef<AppState>(appState);
  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  // Initialize Audio Player on mount
  useEffect(() => {
    const player = new ResponseAudioPlayer();
    player.setMetricsCallback((metrics) => {
      // Update visualizer when Roxy is speaking
      if (appStateRef.current === "speaking") {
        setAudioMetrics(metrics);
      }
    });
    player.setOnPlaybackEnded(() => {
      setAppState((prev) => (prev === "speaking" ? "listening" : prev));
      setIsTyping(false);
    });
    audioPlayerRef.current = player;

    return () => {
      player.close();
    };
  }, []);

  // Dynamically update audio playback speaking rate whenever changed in Settings
  useEffect(() => {
    if (audioPlayerRef.current && settings.speakingRate) {
      audioPlayerRef.current.setPlaybackRate(settings.speakingRate);
    }
  }, [settings.speakingRate]);

  // Clean disconnect handler
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (micRecorderRef.current) {
      micRecorderRef.current.stop();
      micRecorderRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stopAll();
    }
    setAppState("disconnected");
    setIsTyping(false);
    setAudioMetrics({ volume: 0, frequencies: new Uint8Array(32) });
  }, []);

  // Helper to append message to history with persistence
  const addHistoryMessage = useCallback(
    (sender: "user" | "roxy" | "system" | "tool", text: string, toolCallName?: string) => {
      const timeStr = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const newMsg: ConversationMessage = {
        id: Math.random().toString(),
        sender,
        text,
        timestamp: timeStr,
        toolCallName,
      };

      setConversationMessages((prev) => {
        const next = [...prev, newMsg];
        try {
          // Keep up to 100 recent turns in localStorage for instant recall
          localStorage.setItem("roxy_conversation_history", JSON.stringify(next.slice(-100)));
        } catch (e) {}
        return next;
      });
    },
    []
  );

  // Tool Call Execution Handler
  const handleToolCalls = useCallback(
    (calls: Array<{ id?: string; name: string; args: any }>) => {
      const responses: Array<{ id?: string; name: string; response: any }> = [];

      for (const call of calls) {
        const { id, name, args } = call;
        console.log("Executing tool call:", name, args);

        if (name === "openWebsite") {
          let targetUrl = args.url || "";
          if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
            targetUrl = `https://${targetUrl}`;
          }
          const siteName = args.name || "Website";

          try {
            window.open(targetUrl, "_blank");
          } catch (e) {
            console.warn("Popup blocked or failed to open tab", (e as any)?.message || String(e));
          }

          const notif: ToolActionNotification = {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            toolName: "openWebsite",
            title: `Opening ${siteName}`,
            description: `Navigating to ${targetUrl}`,
            url: targetUrl,
            status: "completed",
          };

          setActiveNotification(notif);
          setNotificationHistory((prev) => [...prev, notif]);
          addHistoryMessage(
            "tool",
            `Action Executed: Opening ${siteName} (${targetUrl})`,
            "openWebsite"
          );

          responses.push({
            id,
            name,
            response: { result: `Successfully opened ${siteName} at ${targetUrl}` },
          });
        } else if (name === "changeVisualTheme") {
          const newTheme = (args.theme as ThemePreset) || "neon-pink";
          if (THEME_CONFIGS[newTheme]) {
            setThemePreset(newTheme);
          }

          const notif: ToolActionNotification = {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            toolName: "changeVisualTheme",
            title: `Vibe Shifted to ${THEME_CONFIGS[newTheme]?.name || newTheme}`,
            description: args.reason || "Updated Roxy's futuristic glow preset",
            status: "completed",
          };

          setActiveNotification(notif);
          setNotificationHistory((prev) => [...prev, notif]);
          addHistoryMessage(
            "tool",
            `Action Executed: Theme changed to ${THEME_CONFIGS[newTheme]?.name || newTheme}`,
            "changeVisualTheme"
          );

          responses.push({
            id,
            name,
            response: { result: `Theme changed to ${newTheme}` },
          });
        } else if (name === "getSystemTime") {
          const nowStr = new Date().toLocaleString();
          addHistoryMessage("tool", `Action Executed: Provided system time (${nowStr})`, "getSystemTime");
          responses.push({
            id,
            name,
            response: { currentTime: nowStr },
          });
        } else {
          responses.push({
            id,
            name,
            response: { status: "unknown_function" },
          });
        }
      }

      // Send tool responses back instantly over WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "toolResponse",
            responses,
          })
        );
      }
    },
    [addHistoryMessage]
  );

  // Connect to Roxy Live WebSocket with query parameters
  const connect = useCallback(
    (overrideSettings?: AppSettings) => {
      disconnect();
      setErrorMessage(null);

      const activeSet = overrideSettings || settings || DEFAULT_SETTINGS;

      // Handle Offline Mode where API key is optional
      if (activeSet.connectionMode === "offline") {
        setAppState("listening");
        addHistoryMessage(
          "system",
          "Connected in Offline Mode (Local Simulation). API Key is optional."
        );
        return;
      }

      setAppState("connecting");

      const safeLang = activeSet?.language || "hi";
      const safeVoice = activeSet?.voice || "Kore";
      const safeGender = activeSet?.aiGender || "female";
      const safeName = activeSet?.aiName || "Roxy";
      const safeApiKey = encodeURIComponent(activeSet?.customApiKey || "");
      const safeKeyName = encodeURIComponent(activeSet?.apiKeyName || "GEMINI_API_KEY");
      const safeTemp = activeSet?.temperature ?? 0.7;
      const safeSpeed = activeSet?.responseSpeed || "balanced";
      const safeRate = activeSet?.speakingRate ?? 1.0;

      // Formulate past context for live session so voice companion retains memory
      const recentContext = conversationMessages
        .filter((m) => m && m.text && (m.sender === "user" || m.sender === "roxy"))
        .slice(-15)
        .map((m) => `${m.sender === "user" ? "User" : safeName}: ${m.text}`)
        .join("\n");
      const safeContext = encodeURIComponent(recentContext);

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws?voice=${safeVoice}&gender=${safeGender}&lang=${safeLang}&apiKey=${safeApiKey}&keyName=${safeKeyName}&temp=${safeTemp}&speed=${safeSpeed}&rate=${safeRate}&context=${safeContext}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`WebSocket connected to AI server (${safeName}, ${safeLang}, Voice: ${safeVoice})`);
        addHistoryMessage("system", `Connected to ${safeName} AI Live Stream (${safeLang.toUpperCase()}).`);
        if (pendingTextRef.current) {
          setIsTyping(true);
          ws.send(JSON.stringify({ type: "text", text: pendingTextRef.current }));
          pendingTextRef.current = null;
        }
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "connected") {
            setAppState("listening");

            // Start Microphone Recording & Stream chunks
            try {
              const mic = new MicRecorder();
              micRecorderRef.current = mic;

              await mic.start(
                (base64Pcm) => {
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(
                      JSON.stringify({
                        type: "audio",
                        audio: base64Pcm,
                      })
                    );
                  }
                },
                (metrics) => {
                  if (appStateRef.current !== "speaking") {
                    setAudioMetrics(metrics);
                  }
                }
              );
            } catch (micErr: any) {
              console.warn("Microphone access warning:", micErr);
              addHistoryMessage(
                "system",
                "Microphone stream inactive. You can chat via text anytime!"
              );
            }
          } else if (msg.type === "audio" && msg.audio) {
            setAppState("speaking");
            setIsTyping(false);
            if (audioPlayerRef.current) {
              audioPlayerRef.current.playChunk(msg.audio);
            }
          } else if (msg.type === "interrupted") {
            console.log("User interrupted Roxy! Stopping audio playback.");
            if (audioPlayerRef.current) {
              audioPlayerRef.current.stopAll();
            }
            setAppState("listening");
            setIsTyping(false);
            addHistoryMessage("system", "[User Interrupted Speech]");
          } else if (msg.type === "text" && msg.text) {
            setIsTyping(false);
            setLiveTranscript((prev) => {
              const newText = msg.text;
              addHistoryMessage("roxy", newText);
              return newText;
            });
          } else if (msg.type === "toolCall" && msg.calls) {
            handleToolCalls(msg.calls);
          } else if (msg.type === "error") {
            setIsTyping(false);
            const rawErr = msg.message || "";
            if (
              rawErr === "API key not configured" ||
              rawErr.includes("API key not configured") ||
              rawErr.includes("key missing") ||
              (!activeSet.customApiKey && rawErr.includes("API key"))
            ) {
              const notConfiguredText = "API key not configured";
              setErrorMessage(notConfiguredText);
              addHistoryMessage("system", notConfiguredText);
            } else {
              setErrorMessage(rawErr);
              addHistoryMessage("system", `Error: ${rawErr}`);
            }
            setAppState("error");
            disconnect();
          } else if (msg.type === "closed") {
            setIsTyping(false);
            addHistoryMessage("system", "Session ended.");
            disconnect();
          }
        } catch (e) {
          console.warn("Failed to parse WebSocket message:", e);
        }
      };

      ws.onerror = (e: any) => {
        console.warn("WebSocket connection error occurred");
        setIsTyping(false);
        if (!activeSet.customApiKey) {
          const notConfiguredText = "API key not configured";
          setErrorMessage(notConfiguredText);
          addHistoryMessage("system", notConfiguredText);
        } else {
          const errMsg = "Failed to connect to Roxy Live server.";
          setErrorMessage(errMsg);
          addHistoryMessage("system", errMsg);
        }
        setAppState("error");
        disconnect();
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
        setIsTyping(false);
        if (appState !== "error") {
          setAppState("disconnected");
        }
      };
    },
    [disconnect, appState, handleToolCalls, addHistoryMessage, settings]
  );

  // Main Orb Button Click Action
  const handleOrbClick = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.resume();
    }
    if (appState === "disconnected" || appState === "error") {
      connect();
    } else {
      disconnect();
    }
  };

  // Toggle Mic Mute
  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (micRecorderRef.current) {
      micRecorderRef.current.setMuted(nextMute);
    }
  };

  // Send Text Message to Roxy Chat
  const handleSendChatMessage = useCallback(
    async (text: string) => {
      addHistoryMessage("user", text);
      setIsTyping(true);

      // If offline mode is enabled, generate a witty simulated response
      if (settings.connectionMode === "offline") {
        setTimeout(() => {
          setIsTyping(false);
          const aiName = settings.aiName || "Roxy";
          let reply = "";
          if (settings.language === "hi") {
            reply = `Arey wah! Offline mode mein bhi main aapke saath hoon. Main hoon ${aiName} — boliye kya hukum hai?`;
          } else {
            reply = `Hey there! Offline mode is active, but ${aiName} is right here with you! What's next?`;
          }
          addHistoryMessage("roxy", reply);
        }, 600);
        return;
      }

      // If active WebSocket session exists
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "text", text }));
        return;
      }

      // If disconnected, attempt to send via HTTP chat fallback with full history context
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: conversationMessages,
            apiKey: settings.customApiKey,
            keyName: settings.apiKeyName,
            lang: settings.language,
            gender: settings.aiGender,
            temp: settings.temperature,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setIsTyping(false);
          if (data.text) {
            addHistoryMessage("roxy", data.text);
            return;
          }
        }
      } catch (err) {
        console.warn("HTTP chat fallback failed, falling back to connect():", err);
      }

      // Fallback: connect WebSocket with pending text
      pendingTextRef.current = text;
      connect();
    },
    [connect, addHistoryMessage, settings, conversationMessages]
  );

  // Clear all conversation messages and local storage memory
  const handleClearHistory = useCallback(() => {
    setConversationMessages([]);
    setNotificationHistory([]);
    setActiveNotification(null);
    setLiveTranscript("");
    try {
      localStorage.removeItem("roxy_conversation_history");
    } catch (e) {}
  }, []);

  // Update Settings handler
  const updateSettings = useCallback(
    (newPartial: Partial<AppSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newPartial };

        if (newPartial.customApiKey !== undefined) {
          saveEncryptedApiKey(newPartial.customApiKey);
        }

        try {
          const toSave = { ...updated };
          delete toSave.customApiKey;
          localStorage.setItem("roxy_app_settings", JSON.stringify(toSave));
        } catch (e) {}

        // Reconnect WebSocket if session is open to apply new settings live
        if (
          wsRef.current &&
          wsRef.current.readyState === WebSocket.OPEN &&
          (newPartial.voice ||
            newPartial.aiGender ||
            newPartial.language ||
            newPartial.customApiKey !== undefined ||
            newPartial.apiKeyName !== undefined ||
            newPartial.temperature !== undefined ||
            newPartial.responseSpeed !== undefined ||
            newPartial.connectionMode !== undefined)
        ) {
          setTimeout(() => {
            connect(updated);
          }, 100);
        }
        return updated;
      });
    },
    [connect]
  );

  const isPowerButtonBreathing = appState === "listening" || appState === "speaking";

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white flex flex-col justify-between overflow-x-hidden relative transition-colors duration-700 font-sans border border-[#1a1a1a]">
      {/* Top Header Controls */}
      <HeaderBar
        theme={themeConfig}
        settings={settings}
        isMuted={isMuted}
        appState={appState}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((prev) => (prev === "orb" ? "chat" : "orb"))}
        onToggleMute={handleToggleMute}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenInfoModal={() => setIsInfoModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        historyCount={conversationMessages.length}
      />

      {/* Geometric 3-Column Grid Viewport */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] w-full min-h-0 border-b border-[#1a1a1a]">
        {/* Left Side Panel: Persona Module & Attributes */}
        <div className="hidden lg:block">
          <PersonaLeftPanel
            appState={appState}
            theme={themeConfig}
            aiName={settings.aiName}
          />
        </div>

        {/* Central Stage: Toggle between 3D Voice Orb and Conversational Chat */}
        <main className="flex-1 flex flex-col items-center justify-center relative px-3 sm:px-6 py-4 sm:py-6 bg-[radial-gradient(circle_at_center,#111115_0%,#050507_80%)] overflow-hidden">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2 max-w-sm backdrop-blur-md z-20">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
              <button
                onClick={() => connect()}
                className="ml-auto px-2 py-1 bg-red-500/30 hover:bg-red-500/50 text-white rounded text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* View Mode Content with Motion Animation */}
          <div className="w-full flex-1 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {viewMode === "orb" ? (
                <motion.div
                  key="orb-view"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                  className="w-full flex flex-col items-center justify-center"
                >
                  <VisualOrb
                    appState={appState}
                    audioMetrics={audioMetrics}
                    theme={themeConfig}
                    onOrbClick={handleOrbClick}
                    isMuted={isMuted}
                  />

                  {/* Live Action Toast for Function Calling */}
                  <ToolActionToast
                    notification={activeNotification}
                    history={notificationHistory}
                    theme={themeConfig}
                    onClear={() => setActiveNotification(null)}
                  />

                  {/* Live Subtitle Transcript */}
                  {liveTranscript && appState === "speaking" && (
                    <div className="mt-2 max-w-md mx-auto px-4 text-center">
                      <p className="text-xs text-[#cccccc] italic font-serif">
                        "{liveTranscript}"
                      </p>
                    </div>
                  )}

                  {/* Quick Conversational Prompt Sparks */}
                  {appState === "disconnected" && (
                    <QuickPromptGrid
                      theme={themeConfig}
                      onSelectPrompt={(promptText) => {
                        handleSendChatMessage(promptText);
                      }}
                    />
                  )}

                  {/* Switch to Chat Callout Button */}
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      id="quick-open-chat-btn"
                      onClick={() => setViewMode("chat")}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-[#22222a] bg-[#0f0f14] hover:bg-[#181820] text-xs font-mono text-[#aaaaaa] hover:text-white transition-all cursor-pointer shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" style={{ color: themeConfig.primary }} />
                      <span>Open Interactive Chat Option</span>
                      {conversationMessages.length > 0 && (
                        <span
                          className="px-1.5 py-0.2 rounded-full text-[9px] font-bold"
                          style={{ backgroundColor: `${themeConfig.primary}30`, color: themeConfig.primary }}
                        >
                          {conversationMessages.length}
                        </span>
                      )}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="chat-view"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="w-full flex-1 flex flex-col items-center justify-center max-w-3xl"
                >
                  <ConversationalChatPanel
                    messages={conversationMessages}
                    theme={themeConfig}
                    appState={appState}
                    settings={settings}
                    isTyping={isTyping}
                    onSendMessage={handleSendChatMessage}
                    onClearHistory={handleClearHistory}
                    onConnectVoice={handleOrbClick}
                    onSwitchToOrb={() => setViewMode("orb")}
                    onOpenSettings={() => setIsSettingsModalOpen(true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Right Side Panel: Conversational History, Tool Calls & PCM Stream Meter */}
        <div className="hidden lg:block">
          <PersonaRightPanel
            toolHistory={notificationHistory}
            audioMetrics={audioMetrics}
            theme={themeConfig}
            appState={appState}
            messages={conversationMessages}
            onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
            onOpenChatView={() => setViewMode("chat")}
            aiName={settings.aiName}
          />
        </div>
      </div>

      {/* Footer / Control Bar */}
      <footer className="h-20 sm:h-24 bg-[#080808] px-4 sm:px-6 flex items-center justify-between relative select-none font-sans border-t border-[#1a1a1a]">
        <div className="hidden sm:flex items-center space-x-3 text-xs font-mono text-[#888888]">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: appState !== "disconnected" ? "#4ade80" : "#71717a",
              }}
            />
            MODE: {viewMode.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center justify-center gap-4 sm:gap-6 mx-auto sm:mx-0">
          {/* View Mode Toggle Button */}
          <button
            id="footer-toggle-chat-btn"
            onClick={() => setViewMode((prev) => (prev === "orb" ? "chat" : "orb"))}
            className={`w-11 h-11 rounded-full border border-[#202028] flex items-center justify-center cursor-pointer transition-all ${
              viewMode === "chat"
                ? "bg-[#1f1f2a] text-white border-[#444455]"
                : "bg-[#101014] text-[#888890] hover:text-white"
            }`}
            title={viewMode === "orb" ? "Switch to Chat View" : "Switch to Orb View"}
          >
            {viewMode === "orb" ? (
              <MessageSquare className="w-4 h-4" style={{ color: themeConfig.primary }} />
            ) : (
              <Radio className="w-4 h-4" style={{ color: themeConfig.primary }} />
            )}
          </button>

          {/* Mute toggle button */}
          <button
            id="footer-mic-mute-btn"
            onClick={handleToggleMute}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-[#202028] flex items-center justify-center cursor-pointer bg-[#101014] text-[#888890] hover:text-white transition-all ${
              isMuted ? "border-red-500/50 text-red-400 bg-red-500/10" : ""
            }`}
            title={isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Main Central Power Mic Control Button */}
          <button
            id="footer-main-power-btn"
            onClick={handleOrbClick}
            className={`w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full border-2 flex items-center justify-center cursor-pointer transition-all shadow-lg hover:scale-105 active:scale-95 ${
              isPowerButtonBreathing ? "animate-breathing-glow" : ""
            }`}
            style={{
              borderColor: themeConfig.primary,
              backgroundColor: `${themeConfig.primary}15`,
              ...(isPowerButtonBreathing
                ? ({
                    "--pulse-glow": themeConfig.glowColor,
                    "--pulse-border": themeConfig.primary,
                  } as React.CSSProperties)
                : {
                    boxShadow: `0 0 25px ${themeConfig.glowColor}`,
                  }),
            }}
            title={appState === "disconnected" ? "Power On Voice Stream" : "Disconnect Session"}
          >
            <Mic className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: themeConfig.primary }} />
          </button>
        </div>

        <div className="hidden md:block text-right text-[10px] font-mono text-[#666666]">
          ROXY LIVE ENGINE • FULL DUAL VOICE & CHAT
        </div>
      </footer>

      {/* Modals */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        currentTheme={themeConfig}
        onSelectTheme={(preset) => setThemePreset(preset)}
        onClose={() => setIsThemeModalOpen(false)}
      />

      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />

      <ConversationHistoryModal
        isOpen={isHistoryModalOpen}
        messages={conversationMessages}
        theme={themeConfig}
        onClearHistory={handleClearHistory}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        theme={themeConfig}
        settings={settings}
        onUpdateSettings={updateSettings}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}
