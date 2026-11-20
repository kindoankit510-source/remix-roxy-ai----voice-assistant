import React, { useState, useEffect } from "react";
import { ThemeConfig, AppSettings, LanguageOption, AIGenderOption, VoiceOption } from "../types";
import { saveEncryptedApiKey, loadEncryptedApiKey } from "../lib/secureStorage";
import {
  X,
  Settings,
  Globe,
  UserCheck,
  ShieldCheck,
  Mic,
  Camera,
  Bell,
  Volume2,
  Check,
  Sparkles,
  VolumeX,
  Radio,
  Sliders,
  HelpCircle,
  Key,
  Cpu,
  Eye,
  EyeOff,
  RotateCcw,
  Clipboard,
  Wifi,
  WifiOff,
  ToggleLeft,
  ToggleRight,
  Brain,
  Zap,
  Activity,
  Power,
  Moon,
  Gauge,
  Play,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<"language" | "gender" | "toggles" | "permissions" | "advanced">("language");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isTestingKey, setIsTestingKey] = useState<boolean>(false);

  // Local state for API Key inputs
  const [apiKeyNameInput, setApiKeyNameInput] = useState<string>(settings.apiKeyName || "GEMINI_API_KEY");
  const [customApiKeyInput, setCustomApiKeyInput] = useState<string>(settings.customApiKey || "");
  const [tempValue, setTempValue] = useState<number>(settings.temperature ?? 0.7);
  const [rateValue, setRateValue] = useState<number>(settings.speakingRate ?? 1.0);
  const [isPreviewingVoiceRate, setIsPreviewingVoiceRate] = useState<boolean>(false);

  // Sync inputs ONLY when modal opens to prevent overwriting unsaved user input while typing
  useEffect(() => {
    if (isOpen) {
      setApiKeyNameInput(settings.apiKeyName || "GEMINI_API_KEY");
      const currentEncKey = loadEncryptedApiKey();
      setCustomApiKeyInput(settings.customApiKey || currentEncKey || "");
      setTempValue(settings.temperature ?? 0.7);
      setRateValue(settings.speakingRate ?? 1.0);
    }
  }, [isOpen]);

  // Permission states
  const [micPermission, setMicPermission] = useState<"granted" | "denied" | "prompt" | "testing">("prompt");
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt" | "testing">("prompt");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [audioTesting, setAudioTesting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Check permissions on mount / modal open
  useEffect(() => {
    if (isOpen) {
      checkPermissions();
    }
  }, [isOpen]);

  const checkPermissions = async () => {
    // Check Microphone
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const micStatus = await navigator.permissions.query({ name: "microphone" as PermissionName });
        setMicPermission(micStatus.state as any);
        micStatus.onchange = () => setMicPermission(micStatus.state as any);

        const camStatus = await navigator.permissions.query({ name: "camera" as PermissionName });
        setCameraPermission(camStatus.state as any);
        camStatus.onchange = () => setCameraPermission(camStatus.state as any);
      }
    } catch (e) {
      console.log("Permissions query API not fully supported:", (e as any)?.message || String(e));
    }

    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  };

  const requestMicPermission = async () => {
    setMicPermission("testing");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicPermission("granted");
      showStatus("Microphone access granted!");
    } catch (err) {
      setMicPermission("denied");
      showStatus("Microphone access denied.");
    }
  };

  const requestCameraPermission = async () => {
    setCameraPermission("testing");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraPermission("granted");
      showStatus("Camera access granted!");
    } catch (err) {
      setCameraPermission("denied");
      showStatus("Camera access denied.");
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      showStatus("Notifications are not supported by your browser.");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === "granted") {
        showStatus("Browser notifications enabled!");
      } else {
        showStatus("Notifications permission denied.");
      }
    } catch (err) {
      console.warn("Notification permission request warning:", err);
    }
  };

  const testAudioOutput = () => {
    setAudioTesting(true);
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);

      showStatus("Playing test sound...");
      setTimeout(() => {
        setAudioTesting(false);
      }, 500);
    } catch (e) {
      setAudioTesting(false);
      showStatus("Audio test failed.");
    }
  };

  const previewVoiceSpeechRate = (targetRate: number) => {
    setIsPreviewingVoiceRate(true);
    const wpm = Math.round(targetRate * 175);
    const name = settings.aiName || "Roxy";

    // Use window.speechSynthesis to give an immediate audible voice sample at this exact rate
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const sampleText =
          settings.language === "hi" || settings.language === "hinglish"
            ? `Namaste! Main hoon ${name}. Yeh meri bolne ki speed hai.`
            : `Hello! I am ${name}. This is how fast I talk at ${wpm} words per minute.`;

        const utterance = new SpeechSynthesisUtterance(sampleText);
        utterance.rate = Math.max(0.5, Math.min(2.0, targetRate));
        utterance.pitch = settings.aiGender === "male" ? 0.9 : 1.15;
        
        // Match language if possible
        if (settings.language === "hi") {
          utterance.lang = "hi-IN";
        } else {
          utterance.lang = "en-US";
        }

        utterance.onend = () => setIsPreviewingVoiceRate(false);
        utterance.onerror = () => setIsPreviewingVoiceRate(false);

        window.speechSynthesis.speak(utterance);
        showStatus(`Sample voice preview at ${targetRate.toFixed(2)}x (~${wpm} WPM)`);
        return;
      } catch (e) {
        console.warn("SpeechSynthesis preview warning:", e);
      }
    }

    // Fallback sound chime preview if speech synthesis is disabled
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3 / targetRate);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3 / targetRate);
      showStatus(`Speech rate set to ${targetRate.toFixed(2)}x (~${wpm} WPM)`);
    } catch (e) {}
    setTimeout(() => setIsPreviewingVoiceRate(false), 400);
  };

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, 3000);
  };

  if (!isOpen) return null;

  const languages: { id: LanguageOption; label: string; native: string; desc: string; flag: string }[] = [
    {
      id: "hi",
      label: "Hindi",
      native: "हिन्दी",
      desc: "Speak naturally & fluently in pure Hindi voice banter",
      flag: "🇮🇳",
    },
    {
      id: "hinglish",
      label: "Hinglish",
      native: "Hindi + English",
      desc: "Casual blend of Hindi and English for modern conversation",
      flag: "🇮🇳",
    },
    {
      id: "en",
      label: "English",
      native: "English (US)",
      desc: "Crisp, expressive global English assistant voice",
      flag: "🇺🇸",
    },
    {
      id: "es",
      label: "Spanish",
      native: "Español",
      desc: "Fluidez natural y conversacional en español",
      flag: "🇪🇸",
    },
    {
      id: "fr",
      label: "French",
      native: "Français",
      desc: "Expression vocale naturelle et charmante en français",
      flag: "🇫🇷",
    },
    {
      id: "de",
      label: "German",
      native: "Deutsch",
      desc: "Natürliche und flüssige deutsche Sprachausgabe",
      flag: "🇩🇪",
    },
  ];

  const handleGenderChange = (gender: AIGenderOption) => {
    const isMale = gender === "male";
    const newName = isMale ? "Rex" : "Roxy";
    const newVoice: VoiceOption = isMale ? "Puck" : "Kore";
    onUpdateSettings({
      aiGender: gender,
      aiName: newName,
      voice: newVoice,
    });
    showStatus(`Activated ${isMale ? "REX (Male AI)" : "ROXY (Female AI)"}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
      <div className="w-full max-w-2xl bg-[#0c0c0e] border border-[#222226] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-[#1c1c20] flex items-center justify-between bg-gradient-to-r from-[#121216] to-[#0c0c0e]">
          <div className="flex items-center space-x-3">
            <div
              className="p-2.5 rounded-xl border border-[#2a2a30] bg-[#16161b] shadow-inner"
              style={{ color: theme.primary }}
            >
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center space-x-2">
                <span>Application Settings</span>
              </h2>
              <p className="text-xs text-[#888890] font-mono">Customize Language, AI Voice & App Permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#888890] hover:text-white rounded-lg hover:bg-[#1a1a20] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex border-b border-[#1c1c20] bg-[#09090b] px-4 pt-2 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab("language")}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-3 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "language"
                ? "border-current text-white bg-[#141418]"
                : "border-transparent text-[#888890] hover:text-white hover:bg-[#101014]"
            }`}
            style={{ color: activeTab === "language" ? theme.primary : undefined }}
          >
            <Globe className="w-4 h-4" />
            <span>1. Voice Language</span>
          </button>

          <button
            onClick={() => setActiveTab("gender")}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-3 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "gender"
                ? "border-current text-white bg-[#141418]"
                : "border-transparent text-[#888890] hover:text-white hover:bg-[#101014]"
            }`}
            style={{ color: activeTab === "gender" ? theme.primary : undefined }}
          >
            <UserCheck className="w-4 h-4" />
            <span>2. AI Voice & Gender</span>
          </button>

          <button
            onClick={() => setActiveTab("toggles")}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-3 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "toggles"
                ? "border-current text-white bg-[#141418]"
                : "border-transparent text-[#888890] hover:text-white hover:bg-[#101014]"
            }`}
            style={{ color: activeTab === "toggles" ? theme.primary : undefined }}
          >
            <ToggleRight className="w-4 h-4 text-emerald-400" />
            <span className="flex items-center gap-1.5">
              <span>3. Options (On/Off)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-emerald-500/20 text-emerald-300 font-bold">
                ON/OFF
              </span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab("permissions")}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-3 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "permissions"
                ? "border-current text-white bg-[#141418]"
                : "border-transparent text-[#888890] hover:text-white hover:bg-[#101014]"
            }`}
            style={{ color: activeTab === "permissions" ? theme.primary : undefined }}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>4. Permissions</span>
          </button>

          <button
            onClick={() => setActiveTab("advanced")}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-3 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "advanced"
                ? "border-current text-white bg-[#141418]"
                : "border-transparent text-[#888890] hover:text-white hover:bg-[#101014]"
            }`}
            style={{ color: activeTab === "advanced" ? theme.primary : undefined }}
          >
            <Sliders className="w-4 h-4" />
            <span>5. Advanced & Key</span>
          </button>
        </div>

        {/* Status Toast inside Modal */}
        {statusMessage && (
          <div className="bg-[#181820] border-b border-[#282834] px-4 py-2 text-xs text-center text-emerald-400 font-mono animate-in fade-in">
            {statusMessage}
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* TAB 1: LANGUAGE SELECTION */}
          {activeTab === "language" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                  <span>Select Voice & Speech Language</span>
                </h3>
                <p className="text-xs text-[#888890] mt-1">
                  Choose the language in which {settings.aiName} will speak and respond in real-time.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {languages.map((lang) => {
                  const isSelected = settings.language === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => {
                        onUpdateSettings({ language: lang.id });
                        showStatus(`Voice language updated to ${lang.label} (${lang.native})`);
                      }}
                      className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between relative cursor-pointer ${
                        isSelected
                          ? "bg-[#181822] border-current shadow-lg ring-1"
                          : "bg-[#0f0f12] border-[#1c1c24] hover:bg-[#14141a] hover:border-[#2a2a38]"
                      }`}
                      style={{ borderColor: isSelected ? theme.primary : undefined }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{lang.flag}</span>
                          <div>
                            <span className="text-sm font-bold text-white block">{lang.label}</span>
                            <span className="text-xs text-[#888890] font-mono">{lang.native}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-black"
                            style={{ backgroundColor: theme.primary }}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-[#777780] mt-3 leading-relaxed">{lang.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: AI GENDER & VOICE PERSONA */}
          {activeTab === "gender" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white">AI Assistant Gender Association</h3>
                <p className="text-xs text-[#888890] mt-1">
                  Switch between Female (Roxy) and Male (Rex) voice engine and personality styles.
                </p>
              </div>

              {/* Gender Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Female Card (ROXY) */}
                <button
                  type="button"
                  onClick={() => handleGenderChange("female")}
                  className={`p-5 rounded-2xl border transition-all relative flex flex-col items-center text-center cursor-pointer group ${
                    settings.aiGender === "female"
                      ? "bg-gradient-to-b from-[#241322] to-[#140b15] border-pink-500 shadow-lg ring-1 ring-pink-500/50"
                      : "bg-[#0f0f12] border-[#1c1c24] hover:bg-[#16141c] hover:border-pink-500/40"
                  }`}
                >
                  <div className="absolute top-3 right-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        settings.aiGender === "female"
                          ? "bg-pink-500 text-black shadow-md"
                          : "border border-[#333340] bg-[#121218]"
                      }`}
                    >
                      {settings.aiGender === "female" && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  <div className="w-12 h-12 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 mb-3 shadow-inner group-hover:scale-105 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-black text-white">ROXY</h4>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-pink-400 mt-0.5">
                    Female Companion
                  </span>
                  <p className="text-xs text-[#9999a4] mt-2 leading-relaxed">
                    Young, witty, sassy, and charming female AI persona with natural voice expression.
                  </p>

                  <div className="mt-4 w-full">
                    {settings.aiGender === "female" ? (
                      <div className="w-full py-2 bg-pink-500 text-black text-xs font-black uppercase rounded-xl tracking-wider shadow-md flex items-center justify-center space-x-1.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>ACTIVE</span>
                      </div>
                    ) : (
                      <div className="w-full py-2 bg-[#1a1a24] hover:bg-pink-500 hover:text-black text-xs font-bold text-white uppercase rounded-xl transition-colors border border-[#2a2a38] flex items-center justify-center space-x-1">
                        <span>SELECT ROXY</span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Male Card (REX) */}
                <button
                  type="button"
                  onClick={() => handleGenderChange("male")}
                  className={`p-5 rounded-2xl border transition-all relative flex flex-col items-center text-center cursor-pointer group ${
                    settings.aiGender === "male"
                      ? "bg-gradient-to-b from-[#111e30] to-[#0a121c] border-cyan-500 shadow-lg ring-1 ring-cyan-500/50"
                      : "bg-[#0f0f12] border-[#1c1c24] hover:bg-[#121824] hover:border-cyan-500/40"
                  }`}
                >
                  <div className="absolute top-3 right-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        settings.aiGender === "male"
                          ? "bg-cyan-500 text-black shadow-md"
                          : "border border-[#333340] bg-[#121218]"
                      }`}
                    >
                      {settings.aiGender === "male" && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-3 shadow-inner group-hover:scale-105 transition-transform">
                    <Radio className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-black text-white">REX</h4>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 mt-0.5">
                    Male Companion
                  </span>
                  <p className="text-xs text-[#9999a4] mt-2 leading-relaxed">
                    Confident, smart, charismatic, and sharp male AI assistant persona.
                  </p>

                  <div className="mt-4 w-full">
                    {settings.aiGender === "male" ? (
                      <div className="w-full py-2 bg-cyan-500 text-black text-xs font-black uppercase rounded-xl tracking-wider shadow-md flex items-center justify-center space-x-1.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>ACTIVE</span>
                      </div>
                    ) : (
                      <div className="w-full py-2 bg-[#1a1a24] hover:bg-cyan-500 hover:text-black text-xs font-bold text-white uppercase rounded-xl transition-colors border border-[#2a2a38] flex items-center justify-center space-x-1">
                        <span>SELECT REX</span>
                      </div>
                    )}
                  </div>
                </button>
              </div>

              {/* Prebuilt Voice Selection */}
              <div className="pt-2 border-t border-[#1c1c24]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#aaaab0] mb-3">
                  Prebuilt Voice Engine Model
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {settings.aiGender === "female" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSettings({ voice: "Kore" });
                          showStatus("Voice updated to Kore (Female)");
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          settings.voice === "Kore"
                            ? "bg-[#1f1624] border-pink-500 text-white shadow-md ring-1 ring-pink-500/30"
                            : "bg-[#0f0f12] border-[#1c1c24] text-[#888890] hover:text-white hover:bg-[#14141a]"
                        }`}
                      >
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span>Kore</span>
                          {settings.voice === "Kore" && <Check className="w-3.5 h-3.5 text-pink-400" />}
                        </div>
                        <p className="text-[10px] text-[#888894] mt-1">Clear, upbeat & natural female voice</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSettings({ voice: "Aoede" });
                          showStatus("Voice updated to Aoede (Female)");
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          settings.voice === "Aoede"
                            ? "bg-[#1f1624] border-pink-500 text-white shadow-md ring-1 ring-pink-500/30"
                            : "bg-[#0f0f12] border-[#1c1c24] text-[#888890] hover:text-white hover:bg-[#14141a]"
                        }`}
                      >
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span>Aoede</span>
                          {settings.voice === "Aoede" && <Check className="w-3.5 h-3.5 text-pink-400" />}
                        </div>
                        <p className="text-[10px] text-[#888894] mt-1">Soft, melodic & warm female tone</p>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSettings({ voice: "Puck" });
                          showStatus("Voice updated to Puck (Male)");
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          settings.voice === "Puck"
                            ? "bg-[#101f2e] border-cyan-500 text-white shadow-md ring-1 ring-cyan-500/30"
                            : "bg-[#0f0f12] border-[#1c1c24] text-[#888890] hover:text-white hover:bg-[#14141a]"
                        }`}
                      >
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span>Puck</span>
                          {settings.voice === "Puck" && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>
                        <p className="text-[10px] text-[#888894] mt-1">Playful, energetic & witty male voice</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSettings({ voice: "Fenrir" });
                          showStatus("Voice updated to Fenrir (Male)");
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          settings.voice === "Fenrir"
                            ? "bg-[#101f2e] border-cyan-500 text-white shadow-md ring-1 ring-cyan-500/30"
                            : "bg-[#0f0f12] border-[#1c1c24] text-[#888890] hover:text-white hover:bg-[#14141a]"
                        }`}
                      >
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span>Fenrir</span>
                          {settings.voice === "Fenrir" && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>
                        <p className="text-[10px] text-[#888894] mt-1">Deep, calm & confident male tone</p>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Dynamic Speaking Rate (Words-Per-Minute / Speed Multiplier) Slider */}
              <div className="pt-4 border-t border-[#1c1c24] space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                      <Gauge className="w-4 h-4 text-pink-400" />
                      <span>Speaking Rate (Words Per Minute / गति)</span>
                    </h4>
                    <p className="text-[11px] text-[#888894] mt-0.5">
                      Dynamically control how fast {settings.aiName} speaks audio responses in real-time.
                    </p>
                  </div>

                  {/* Current Rate Display & WPM Pill */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#191924] text-white border border-[#2b2b3d] flex items-center space-x-1.5 shadow-sm">
                      <span className="text-pink-400 font-black">{rateValue.toFixed(2)}x</span>
                      <span className="text-[#888894] text-[10px] font-normal">
                        (~{Math.round(rateValue * 175)} WPM)
                      </span>
                    </span>

                    {/* Preview Voice Button */}
                    <button
                      type="button"
                      disabled={isPreviewingVoiceRate}
                      onClick={() => previewVoiceSpeechRate(rateValue)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 disabled:opacity-50"
                      title="Listen to sample audio at this speed"
                    >
                      <Play className={`w-3 h-3 ${isPreviewingVoiceRate ? "animate-pulse" : ""}`} />
                      <span>{isPreviewingVoiceRate ? "Playing..." : "Test Speed"}</span>
                    </button>
                  </div>
                </div>

                {/* Range Slider */}
                <div className="space-y-2">
                  <div className="relative flex items-center">
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={rateValue}
                      onChange={(e) => {
                        const newRate = parseFloat(e.target.value);
                        setRateValue(newRate);
                        onUpdateSettings({ speakingRate: newRate });
                      }}
                      onMouseUp={() => {
                        showStatus(
                          `${settings.aiName}'s speaking rate set to ${rateValue.toFixed(2)}x (~${Math.round(rateValue * 175)} WPM)`
                        );
                      }}
                      onTouchEnd={() => {
                        showStatus(
                          `${settings.aiName}'s speaking rate set to ${rateValue.toFixed(2)}x (~${Math.round(rateValue * 175)} WPM)`
                        );
                      }}
                      className="w-full h-2 bg-[#1b1b24] rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                    />
                  </div>

                  {/* Preset Speed Buttons */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {[
                      { label: "Slow", rate: 0.75, desc: "130 WPM" },
                      { label: "Normal", rate: 1.0, desc: "175 WPM" },
                      { label: "Brisk", rate: 1.25, desc: "220 WPM" },
                      { label: "Fast", rate: 1.5, desc: "260 WPM" },
                    ].map((preset) => {
                      const isCurrent = Math.abs(rateValue - preset.rate) < 0.04;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setRateValue(preset.rate);
                            onUpdateSettings({ speakingRate: preset.rate });
                            showStatus(
                              `Speaking rate set to ${preset.label} (${preset.rate}x, ~${preset.desc})`
                            );
                            previewVoiceSpeechRate(preset.rate);
                          }}
                          className={`px-2 py-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-pink-500/20 border-pink-500 text-white font-bold shadow-sm"
                              : "bg-[#101016] border-[#1e1e28] text-[#888894] hover:text-white hover:bg-[#161622]"
                          }`}
                        >
                          <div className="text-[11px] font-semibold">{preset.label} ({preset.rate}x)</div>
                          <div className="text-[9px] text-[#777785]">{preset.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#666675] font-mono px-0.5">
                  <span>0.50x (Slow, ~90 WPM)</span>
                  <span>1.00x (Standard, ~175 WPM)</span>
                  <span>2.00x (Double, ~350 WPM)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FEATURE ON/OFF OPTIONS (ऑप्शन ऑन और ऑफ) */}
          {activeTab === "toggles" && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <ToggleRight className="w-4 h-4 text-emerald-400" />
                    <span>Application Feature Options (On / Off)</span>
                  </h3>
                  <p className="text-xs text-[#888890] mt-0.5">
                    Turn specific AI features, memory retention, visual effects, and tools ON or OFF according to your preference.
                  </p>
                </div>

                {/* Quick Master Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({
                        continuousMemory: true,
                        autoLanguageDetect: true,
                        fastStreamMode: true,
                        audioVisualizer: true,
                        soundEffects: true,
                        offlineFallback: true,
                        autoMuteBackground: false,
                      });
                      showStatus("All recommended features turned ON!");
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                  >
                    Enable All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({
                        continuousMemory: true,
                        autoLanguageDetect: true,
                        fastStreamMode: true,
                        audioVisualizer: true,
                        soundEffects: true,
                        offlineFallback: true,
                        autoMuteBackground: false,
                      });
                      showStatus("Options reset to default settings.");
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-[#1a1a24] hover:bg-[#222230] text-[#9999a4] hover:text-white border border-[#2c2c3c] rounded-lg transition-colors cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                </div>
              </div>

              {/* Toggles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. Continuous Memory */}
                {(() => {
                  const isEnabled = settings.continuousMemory ?? true;
                  return (
                    <div
                      onClick={() => {
                        onUpdateSettings({ continuousMemory: !isEnabled });
                        showStatus(`Continuous Memory turned ${!isEnabled ? "ON" : "OFF"}`);
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                        isEnabled
                          ? "bg-[#14121e] border-purple-500/40 shadow-sm ring-1 ring-purple-500/20"
                          : "bg-[#0c0c10] border-[#1c1c24] hover:border-[#2a2a38] opacity-75"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-lg border transition-colors mt-0.5 ${
                            isEnabled
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                              : "bg-[#16161e] text-[#666675] border-[#22222e]"
                          }`}
                        >
                          <Brain className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">Continuous Memory</span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                                isEnabled
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                              }`}
                            >
                              {isEnabled ? "ON" : "OFF"}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#888894] mt-1 leading-relaxed">
                            Roxy remembers previous topics, user names, and context across conversation turns.
                          </p>
                        </div>
                      </div>

                      {/* Animated Toggle Pill */}
                      <div
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 mt-0.5 ${
                          isEnabled ? "bg-emerald-500" : "bg-zinc-700"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                            isEnabled ? "translate-x-5 text-emerald-600" : "translate-x-0 text-zinc-600"
                          }`}
                        >
                          {isEnabled ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Auto-Language Dialect Adapt */}
                {(() => {
                  const isEnabled = settings.autoLanguageDetect ?? true;
                  return (
                    <div
                      onClick={() => {
                        onUpdateSettings({ autoLanguageDetect: !isEnabled });
                        showStatus(`Auto Language Adapt turned ${!isEnabled ? "ON" : "OFF"}`);
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                        isEnabled
                          ? "bg-[#181510] border-amber-500/40 shadow-sm ring-1 ring-amber-500/20"
                          : "bg-[#0c0c10] border-[#1c1c24] hover:border-[#2a2a38] opacity-75"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-lg border transition-colors mt-0.5 ${
                            isEnabled
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-[#16161e] text-[#666675] border-[#22222e]"
                          }`}
                        >
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">Auto Dialect Adapt</span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                                isEnabled
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                              }`}
                            >
                              {isEnabled ? "ON" : "OFF"}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#888894] mt-1 leading-relaxed">
                            Automatically switches between Hindi, Hinglish, and English based on your input style.
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 mt-0.5 ${
                          isEnabled ? "bg-emerald-500" : "bg-zinc-700"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                            isEnabled ? "translate-x-5 text-emerald-600" : "translate-x-0 text-zinc-600"
                          }`}
                        >
                          {isEnabled ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Fast Voice Live-Streaming */}
                {(() => {
                  const isEnabled = settings.fastStreamMode ?? true;
                  return (
                    <div
                      onClick={() => {
                        onUpdateSettings({ fastStreamMode: !isEnabled });
                        showStatus(`Fast Voice Live-Streaming turned ${!isEnabled ? "ON" : "OFF"}`);
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                        isEnabled
                          ? "bg-[#0d1720] border-cyan-500/40 shadow-sm ring-1 ring-cyan-500/20"
                          : "bg-[#0c0c10] border-[#1c1c24] hover:border-[#2a2a38] opacity-75"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-lg border transition-colors mt-0.5 ${
                            isEnabled
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                              : "bg-[#16161e] text-[#666675] border-[#22222e]"
                          }`}
                        >
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">Fast Voice Streaming</span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                                isEnabled
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                              }`}
                            >
                              {isEnabled ? "ON" : "OFF"}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#888894] mt-1 leading-relaxed">
                            Ultra-low latency audio chunking for instant sub-second speech synthesis response.
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 mt-0.5 ${
                          isEnabled ? "bg-emerald-500" : "bg-zinc-700"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                            isEnabled ? "translate-x-5 text-emerald-600" : "translate-x-0 text-zinc-600"
                          }`}
                        >
                          {isEnabled ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 4. Audio Visualizer & Waveforms */}
                {(() => {
                  const isEnabled = settings.audioVisualizer ?? true;
                  return (
                    <div
                      onClick={() => {
                        onUpdateSettings({ audioVisualizer: !isEnabled });
                        showStatus(`Audio Visualizer turned ${!isEnabled ? "ON" : "OFF"}`);
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                        isEnabled
                          ? "bg-[#180f1d] border-pink-500/40 shadow-sm ring-1 ring-pink-500/20"
                          : "bg-[#0c0c10] border-[#1c1c24] hover:border-[#2a2a38] opacity-75"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-lg border transition-colors mt-0.5 ${
                            isEnabled
                              ? "bg-pink-500/20 text-pink-300 border-pink-500/40"
                              : "bg-[#16161e] text-[#666675] border-[#22222e]"
                          }`}
                        >
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">Audio Wave Visualizer</span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                                isEnabled
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                              }`}
                            >
                              {isEnabled ? "ON" : "OFF"}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#888894] mt-1 leading-relaxed">
                            Renders real-time sound frequency waves and particle dynamics during voice playback.
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 mt-0.5 ${
                          isEnabled ? "bg-emerald-500" : "bg-zinc-700"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                            isEnabled ? "translate-x-5 text-emerald-600" : "translate-x-0 text-zinc-600"
                          }`}
                        >
                          {isEnabled ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 5. Sound Chimes & Audio FX */}
                {(() => {
                  const isEnabled = settings.soundEffects ?? true;
                  return (
                    <div
                      onClick={() => {
                        onUpdateSettings({ soundEffects: !isEnabled });
                        showStatus(`Sound Chimes turned ${!isEnabled ? "ON" : "OFF"}`);
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                        isEnabled
                          ? "bg-[#111915] border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/20"
                          : "bg-[#0c0c10] border-[#1c1c24] hover:border-[#2a2a38] opacity-75"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-lg border transition-colors mt-0.5 ${
                            isEnabled
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "bg-[#16161e] text-[#666675] border-[#22222e]"
                          }`}
                        >
                          <Volume2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">Sound FX & Chimes</span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                                isEnabled
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                              }`}
                            >
                              {isEnabled ? "ON" : "OFF"}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#888894] mt-1 leading-relaxed">
                            Plays soft acoustic chimes when connecting, disconnecting, or completing actions.
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 mt-0.5 ${
                          isEnabled ? "bg-emerald-500" : "bg-zinc-700"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                            isEnabled ? "translate-x-5 text-emerald-600" : "translate-x-0 text-zinc-600"
                          }`}
                        >
                          {isEnabled ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 6. Offline Conversational Fallback */}
                {(() => {
                  const isEnabled = settings.offlineFallback ?? true;
                  return (
                    <div
                      onClick={() => {
                        onUpdateSettings({ offlineFallback: !isEnabled });
                        showStatus(`Offline Fallback turned ${!isEnabled ? "ON" : "OFF"}`);
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                        isEnabled
                          ? "bg-[#0d141e] border-blue-500/40 shadow-sm ring-1 ring-blue-500/20"
                          : "bg-[#0c0c10] border-[#1c1c24] hover:border-[#2a2a38] opacity-75"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-lg border transition-colors mt-0.5 ${
                            isEnabled
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                              : "bg-[#16161e] text-[#666675] border-[#22222e]"
                          }`}
                        >
                          <Wifi className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">Offline Mode Fallback</span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                                isEnabled
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                              }`}
                            >
                              {isEnabled ? "ON" : "OFF"}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#888894] mt-1 leading-relaxed">
                            Simulate smart voice responses and local assistance if internet connection is lost.
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 mt-0.5 ${
                          isEnabled ? "bg-emerald-500" : "bg-zinc-700"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                            isEnabled ? "translate-x-5 text-emerald-600" : "translate-x-0 text-zinc-600"
                          }`}
                        >
                          {isEnabled ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 8. Auto-Mute in Background */}
                {(() => {
                  const isEnabled = settings.autoMuteBackground ?? false;
                  return (
                    <div
                      onClick={() => {
                        onUpdateSettings({ autoMuteBackground: !isEnabled });
                        showStatus(`Background Auto-Mute turned ${!isEnabled ? "ON" : "OFF"}`);
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                        isEnabled
                          ? "bg-[#1e1014] border-rose-500/40 shadow-sm ring-1 ring-rose-500/20"
                          : "bg-[#0c0c10] border-[#1c1c24] hover:border-[#2a2a38] opacity-75"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-lg border transition-colors mt-0.5 ${
                            isEnabled
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : "bg-[#16161e] text-[#666675] border-[#22222e]"
                          }`}
                        >
                          <Mic className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">Background Auto-Mute</span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                                isEnabled
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                              }`}
                            >
                              {isEnabled ? "ON" : "OFF"}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#888894] mt-1 leading-relaxed">
                            Automatically pause mic recording whenever you switch away to another browser tab.
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 mt-0.5 ${
                          isEnabled ? "bg-emerald-500" : "bg-zinc-700"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                            isEnabled ? "translate-x-5 text-emerald-600" : "translate-x-0 text-zinc-600"
                          }`}
                        >
                          {isEnabled ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 4: APP PERMISSIONS */}
          {activeTab === "permissions" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Browser & Device Permissions</h3>
                <p className="text-xs text-[#888890] mt-1">
                  Manage microphone, camera, notification, and audio output permissions required for real-time voice & camera tools.
                </p>
              </div>

              <div className="space-y-3">
                {/* Microphone Permission */}
                <div className="p-4 rounded-xl border border-[#1c1c24] bg-[#0f0f12] flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-lg bg-[#16161c] border border-[#252530] text-emerald-400">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Microphone Input</h4>
                      <p className="text-[11px] text-[#777780]">Used for streaming voice input to {settings.aiName}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase font-bold ${
                        micPermission === "granted"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : micPermission === "denied"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {micPermission}
                    </span>
                    <button
                      onClick={requestMicPermission}
                      className="px-3 py-1.5 bg-[#1a1a22] hover:bg-[#252532] text-xs font-semibold text-white rounded-lg border border-[#30303e] transition-colors"
                    >
                      {micPermission === "granted" ? "Re-test" : "Allow Mic"}
                    </button>
                  </div>
                </div>

                {/* Camera Permission */}
                <div className="p-4 rounded-xl border border-[#1c1c24] bg-[#0f0f12] flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-lg bg-[#16161c] border border-[#252530] text-cyan-400">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Camera Capture</h4>
                      <p className="text-[11px] text-[#777780]">Required for visual tools & snapshot capabilities</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase font-bold ${
                        cameraPermission === "granted"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : cameraPermission === "denied"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {cameraPermission}
                    </span>
                    <button
                      onClick={requestCameraPermission}
                      className="px-3 py-1.5 bg-[#1a1a22] hover:bg-[#252532] text-xs font-semibold text-white rounded-lg border border-[#30303e] transition-colors"
                    >
                      {cameraPermission === "granted" ? "Re-test" : "Allow Cam"}
                    </button>
                  </div>
                </div>

                {/* Notifications Permission */}
                <div className="p-4 rounded-xl border border-[#1c1c24] bg-[#0f0f12] flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-lg bg-[#16161c] border border-[#252530] text-purple-400">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Browser Notifications</h4>
                      <p className="text-[11px] text-[#777780]">Receive alerts for tool actions and updates</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase font-bold ${
                        notifPermission === "granted"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : notifPermission === "denied"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {notifPermission}
                    </span>
                    <button
                      onClick={requestNotificationPermission}
                      className="px-3 py-1.5 bg-[#1a1a22] hover:bg-[#252532] text-xs font-semibold text-white rounded-lg border border-[#30303e] transition-colors"
                    >
                      {notifPermission === "granted" ? "Enabled" : "Enable"}
                    </button>
                  </div>
                </div>

                {/* Audio Output Test */}
                <div className="p-4 rounded-xl border border-[#1c1c24] bg-[#0f0f12] flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-lg bg-[#16161c] border border-[#252530] text-pink-400">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Audio Speaker Output</h4>
                      <p className="text-[11px] text-[#777780]">Test your web audio speaker playback stream</p>
                    </div>
                  </div>

                  <button
                    onClick={testAudioOutput}
                    disabled={audioTesting}
                    className="px-3 py-1.5 bg-[#1a1a22] hover:bg-[#252532] text-xs font-semibold text-white rounded-lg border border-[#30303e] transition-colors flex items-center space-x-1.5"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                    <span>{audioTesting ? "Testing..." : "Test Audio Chime"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ADVANCED & API KEY OPTIONS */}
          {activeTab === "advanced" && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                  <Key className="w-4 h-4" style={{ color: theme.primary }} />
                  <span>Advanced Engine & API Key Configuration</span>
                </h3>
                <p className="text-xs text-[#888890] mt-1">
                  Manage your Gemini API Key environment variable name, custom API Key, response speed latency, and model temperature parameters.
                </p>
              </div>

              {/* Status Active Key Indicator */}
              <div className="p-4 rounded-xl border border-[#1f1f2b] bg-[#0e0e13] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="p-2.5 rounded-lg border bg-[#14141b]"
                    style={{ borderColor: settings.customApiKey ? theme.primary : "#252530", color: theme.primary }}
                  >
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center space-x-2">
                      <span>API KEY SOURCE:</span>
                      {settings.customApiKey ? (
                        <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          CUSTOM USER KEY ACTIVE
                        </span>
                      ) : (
                        <span className="text-cyan-400 font-mono text-[10px] bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                          SERVER ENVIRONMENT KEY ({settings.apiKeyName || "GEMINI_API_KEY"})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#777785] mt-1">
                      {settings.customApiKey
                        ? `Using custom key override (${settings.customApiKey.slice(0, 6)}...${settings.customApiKey.slice(-4)})`
                        : `Key variable resolved from server process.env['${settings.apiKeyName || "GEMINI_API_KEY"}']`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Connection Mode Option (Online vs Offline) */}
              <div className="p-4 rounded-xl border border-[#1c1c24] bg-[#0f0f12] space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                    {settings.connectionMode === "offline" ? (
                      <WifiOff className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Wifi className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>Connection Mode</span>
                  </h4>
                  <p className="text-[11px] text-[#777780] mt-0.5">
                    Choose between online streaming AI voice or local offline simulation mode.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ connectionMode: "online" });
                      showStatus("Online Mode selected — Gemini API Key required.");
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      (settings.connectionMode || "online") === "online"
                        ? "bg-[#181822] text-white font-bold border-cyan-500/60 shadow-md"
                        : "bg-[#121216] border-[#22222c] text-[#888890] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-xs font-semibold">Online Live Mode</span>
                    </div>
                    <p className="text-[10px] text-[#777785] mt-1 font-normal">
                      Real-time Gemini Live AI voice stream (API Key required)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ connectionMode: "offline" });
                      showStatus("Offline Mode selected — API Key is optional.");
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      settings.connectionMode === "offline"
                        ? "bg-[#181822] text-white font-bold border-amber-500/60 shadow-md"
                        : "bg-[#121216] border-[#22222c] text-[#888890] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-semibold">Offline Mode</span>
                    </div>
                    <p className="text-[10px] text-[#777785] mt-1 font-normal">
                      Local speech & banter simulator (API Key is optional)
                    </p>
                  </button>
                </div>
              </div>

              {/* API Key Name Setting */}
              <div className="p-4 rounded-xl border border-[#1c1c24] bg-[#0f0f12] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                      <span>1. API Key Variable Name</span>
                    </h4>
                    <p className="text-[11px] text-[#777780]">
                      The environment variable name used by the backend server to resolve your Gemini API key.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={apiKeyNameInput}
                    onChange={(e) => setApiKeyNameInput(e.target.value)}
                    placeholder="e.g. GEMINI_API_KEY"
                    className="flex-1 px-3 py-2 bg-[#14141a] border border-[#2a2a38] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ apiKeyName: apiKeyNameInput.trim() || "GEMINI_API_KEY" });
                      showStatus(`Updated API key variable name to '${apiKeyNameInput.trim() || "GEMINI_API_KEY"}'`);
                    }}
                    className="px-4 py-2 bg-[#1e1e28] hover:bg-[#282836] text-xs font-semibold text-white rounded-xl border border-[#353545] transition-colors"
                  >
                    Save Name
                  </button>
                </div>
              </div>

              {/* Custom API Key Input */}
              <div className="p-4 rounded-xl border border-[#1c1c24] bg-[#0f0f12] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                      <Key className="w-4 h-4 text-pink-400" />
                      <span>Gemini API Key</span>
                    </h4>
                    <p className="text-[11px] text-[#777780] mt-0.5">
                      Provide your personal Google Gemini API key. Stored in encrypted storage.
                    </p>
                  </div>
                  {settings.connectionMode === "offline" && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                      Optional in Offline Mode
                    </span>
                  )}
                </div>

                {/* Editable Text / Password Input with Paste and Show/Hide */}
                <div className="relative flex items-center">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={customApiKeyInput}
                    onChange={(e) => setCustomApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="off"
                    inputMode="text"
                    className="w-full pl-3 pr-36 py-3 bg-[#14141a] border border-[#2a2a38] focus:border-white text-xs text-white font-mono rounded-xl select-text transition-colors"
                  />

                  {/* Inline Action Controls */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="px-2 py-1 bg-[#1e1e28] hover:bg-[#282838] text-[#aaaaaa] hover:text-white rounded-lg text-[11px] font-medium border border-[#303040] transition-colors flex items-center space-x-1 cursor-pointer"
                      title={showApiKey ? "Hide API Key" : "Show API Key"}
                    >
                      {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showApiKey ? "Hide" : "Show"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const clipText = await navigator.clipboard.readText();
                          if (clipText) {
                            setCustomApiKeyInput(clipText.trim());
                            showStatus("Pasted API key from clipboard");
                          }
                        } catch (err) {
                          showStatus("Please long-press the box to paste");
                        }
                      }}
                      className="px-2 py-1 bg-[#1e1e28] hover:bg-[#282838] text-cyan-400 hover:text-cyan-300 rounded-lg text-[11px] font-medium border border-[#303040] transition-colors flex items-center space-x-1 cursor-pointer"
                      title="Paste from clipboard"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      <span>Paste</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Action Bar: Test Connection, Delete Key, Apply Key */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] text-[#666675]">
                    {customApiKeyInput.trim()
                      ? `Key length: ${customApiKeyInput.trim().length} chars (Masked)`
                      : "No custom key saved"}
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={isTestingKey}
                      onClick={async () => {
                        const targetKey = customApiKeyInput.trim();
                        setIsTestingKey(true);
                        showStatus("Testing Gemini API key connection...");
                        try {
                          const res = await fetch("/api/test-key", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              apiKey: targetKey,
                              keyName: apiKeyNameInput.trim() || "GEMINI_API_KEY",
                            }),
                          });
                          const data = await res.json();
                          if (res.ok && data.ok) {
                            showStatus("Connection successful! Gemini API key is working.");
                          } else {
                            showStatus(`Test failed: ${data.error || "Invalid API Key"}`);
                          }
                        } catch (e: any) {
                          showStatus("Connection test failed (Network Error)");
                        } finally {
                          setIsTestingKey(false);
                        }
                      }}
                      className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      {isTestingKey ? (
                        <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Wifi className="w-3.5 h-3.5" />
                      )}
                      <span>{isTestingKey ? "Testing..." : "Test Connection"}</span>
                    </button>

                    {customApiKeyInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomApiKeyInput("");
                          saveEncryptedApiKey("");
                          onUpdateSettings({ customApiKey: "" });
                          showStatus("API key deleted");
                        }}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Delete Key</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = customApiKeyInput.trim();
                        saveEncryptedApiKey(trimmed);
                        onUpdateSettings({ customApiKey: trimmed });
                        showStatus(trimmed ? "API key saved securely!" : "API key cleared.");
                      }}
                      className="px-4 py-1.5 text-xs font-bold text-black rounded-lg transition-transform active:scale-95 shadow-md flex items-center space-x-1.5 cursor-pointer"
                      style={{ backgroundColor: theme.primary }}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply Key</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Response Speed / Latency Profile */}
              <div className="p-4 rounded-xl border border-[#1c1c24] bg-[#0f0f12] space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span>3. Response Latency Profile</span>
                  </h4>
                  <p className="text-[11px] text-[#777780] mt-0.5">
                    Tune real-time audio chunking speed for lower latency speech synthesis.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(["fast", "balanced", "precise"] as const).map((speed) => {
                    const isSelected = (settings.responseSpeed || "balanced") === speed;
                    return (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => {
                          onUpdateSettings({ responseSpeed: speed });
                          showStatus(`Response profile set to ${speed.toUpperCase()}`);
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#181822] text-white font-bold border-current shadow-md"
                            : "bg-[#121216] border-[#22222c] text-[#888890] hover:text-white hover:bg-[#16161f]"
                        }`}
                        style={{ borderColor: isSelected ? theme.primary : undefined }}
                      >
                        <span className="text-xs uppercase font-mono tracking-wider block">{speed}</span>
                        <span className="text-[9px] text-[#777780] block mt-0.5 font-normal">
                          {speed === "fast" ? "Low Latency" : speed === "balanced" ? "Optimal Flow" : "High Precision"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Temperature Slider */}
              <div className="p-4 rounded-xl border border-[#1c1c24] bg-[#0f0f12] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                      <Sliders className="w-4 h-4 text-pink-400" />
                      <span>4. Personality Creativity Temperature</span>
                    </h4>
                    <p className="text-[11px] text-[#777780] mt-0.5">
                      Controls conversational creativity and wit (0.2 = focused, 1.0 = highly creative banter).
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-[#181822] text-white border border-[#282836]">
                    {tempValue.toFixed(2)}
                  </span>
                </div>

                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={tempValue}
                  onChange={(e) => setTempValue(parseFloat(e.target.value))}
                  onMouseUp={() => {
                    onUpdateSettings({ temperature: tempValue });
                    showStatus(`Creativity temperature set to ${tempValue.toFixed(2)}`);
                  }}
                  onTouchEnd={() => {
                    onUpdateSettings({ temperature: tempValue });
                    showStatus(`Creativity temperature set to ${tempValue.toFixed(2)}`);
                  }}
                  className="w-full accent-pink-500 cursor-pointer"
                />
              </div>

              {/* Reset Defaults */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setApiKeyNameInput("GEMINI_API_KEY");
                    setCustomApiKeyInput("");
                    setTempValue(0.7);
                    onUpdateSettings({
                      apiKeyName: "GEMINI_API_KEY",
                      customApiKey: "",
                      responseSpeed: "balanced",
                      temperature: 0.7,
                    });
                    showStatus("Reset advanced settings to default.");
                  }}
                  className="px-3.5 py-2 bg-[#16161f] hover:bg-[#20202c] text-xs font-semibold text-[#888898] hover:text-white rounded-xl border border-[#2a2a38] transition-colors flex items-center space-x-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Advanced Defaults</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1c1c20] bg-[#09090b] flex items-center justify-between">
          <div className="text-xs text-[#888890] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            <span>Settings synced locally</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-black rounded-lg transition-transform active:scale-95 shadow-md"
            style={{ backgroundColor: theme.primary }}
          >
            Done & Save
          </button>
        </div>
      </div>
    </div>
  );
};
