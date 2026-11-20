import { float32ToPcm16Base64, pcm16Base64ToFloat32 } from "./audioUtils";
import { AudioMetrics } from "../types";

export class MicRecorder {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isMuted: boolean = false;
  private animFrameId: number | null = null;

  async start(
    onAudioChunk: (base64Pcm: string) => void,
    onMetrics?: (metrics: AudioMetrics) => void
  ): Promise<void> {
    this.stop();

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create AudioContext at 16000Hz sample rate for Gemini Live input
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: 16000 });

      if (this.audioCtx.state === "suspended") {
        await this.audioCtx.resume();
      }

      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      
      // Setup Analyser Node for visualizer
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.5;
      source.connect(this.analyser);

      // ScriptProcessorNode for raw PCM extraction
      this.processor = this.audioCtx.createScriptProcessor(2048, 1, 1);
      source.connect(this.processor);
      this.processor.connect(this.audioCtx.destination);

      this.processor.onaudioprocess = (e) => {
        if (this.isMuted) return;
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate volume RMS
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);

        // Convert to base64 16-bit PCM chunk
        const base64Pcm = float32ToPcm16Base64(inputData);
        onAudioChunk(base64Pcm);
      };

      // Loop for visualizer metrics update
      const updateMetrics = () => {
        if (this.analyser && onMetrics) {
          const freqArray = new Uint8Array(this.analyser.frequencyBinCount);
          this.analyser.getByteFrequencyData(freqArray);
          
          let sum = 0;
          for (let i = 0; i < freqArray.length; i++) {
            sum += freqArray[i];
          }
          const avgVolume = sum / (freqArray.length * 255);
          onMetrics({ volume: avgVolume, frequencies: freqArray });
        }
        this.animFrameId = requestAnimationFrame(updateMetrics);
      };
      updateMetrics();

    } catch (error) {
      console.warn("Microphone access notice:", error);
      throw error;
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  stop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
      this.processor = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}

export class ResponseAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private nextStartTime: number = 0;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private animFrameId: number | null = null;
  private onMetricsCallback?: (metrics: AudioMetrics) => void;
  private onPlaybackEnded?: () => void;
  private playbackRate: number = 1.0;

  constructor() {
    this.initContext();
  }

  setPlaybackRate(rate: number) {
    if (typeof rate === "number" && !isNaN(rate) && rate > 0) {
      // Clamp between 0.5x and 2.0x
      this.playbackRate = Math.max(0.5, Math.min(2.0, rate));
      // Update currently active sources in real-time
      for (const source of this.activeSources) {
        try {
          source.playbackRate.setValueAtTime(
            this.playbackRate,
            this.audioCtx ? this.audioCtx.currentTime : 0
          );
        } catch (e) {
          // Ignore
        }
      }
    }
  }

  getPlaybackRate(): number {
    return this.playbackRate;
  }

  async resume() {
    this.initContext();
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      try {
        await this.audioCtx.resume();
      } catch (e) {
        console.warn("Failed to resume AudioContext:", e);
      }
    }
  }

  setOnPlaybackEnded(cb?: () => void) {
    this.onPlaybackEnded = cb;
  }

  private initContext() {
    if (!this.audioCtx || this.audioCtx.state === "closed") {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      // Gemini Live output sample rate is 24000 Hz
      this.audioCtx = new AudioCtxClass({ sampleRate: 24000 });
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.5;
      this.analyser.connect(this.audioCtx.destination);
    }
  }

  setMetricsCallback(onMetrics?: (metrics: AudioMetrics) => void) {
    this.onMetricsCallback = onMetrics;
    if (onMetrics && !this.animFrameId) {
      const loop = () => {
        if (this.analyser && this.onMetricsCallback) {
          const freqArray = new Uint8Array(this.analyser.frequencyBinCount);
          this.analyser.getByteFrequencyData(freqArray);
          let sum = 0;
          for (let i = 0; i < freqArray.length; i++) {
            sum += freqArray[i];
          }
          const volume = sum / (freqArray.length * 255);
          this.onMetricsCallback({ volume, frequencies: freqArray });
        }
        this.animFrameId = requestAnimationFrame(loop);
      };
      loop();
    }
  }

  async playChunk(base64Pcm: string) {
    this.initContext();
    if (!this.audioCtx || !this.analyser) return;

    if (this.audioCtx.state === "suspended") {
      await this.audioCtx.resume();
    }

    const float32Samples = pcm16Base64ToFloat32(base64Pcm);
    if (float32Samples.length === 0) return;

    const buffer = this.audioCtx.createBuffer(1, float32Samples.length, 24000);
    buffer.getChannelData(0).set(float32Samples);

    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    if (this.playbackRate !== 1.0) {
      source.playbackRate.value = this.playbackRate;
    }
    source.connect(this.analyser);

    const currentTime = this.audioCtx.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime;
    }

    source.start(this.nextStartTime);
    const effectiveDuration = buffer.duration / (this.playbackRate || 1.0);
    this.nextStartTime += effectiveDuration;

    this.activeSources.add(source);
    source.onended = () => {
      this.activeSources.delete(source);
      if (this.activeSources.size === 0) {
        if (this.onMetricsCallback) {
          // Reset volume when speaking ends
          this.onMetricsCallback({ volume: 0, frequencies: new Uint8Array(32) });
        }
        if (this.onPlaybackEnded) {
          this.onPlaybackEnded();
        }
      }
    };
  }

  // Handle Interruption: Immediately stop all active playing chunks and reset timing!
  stopAll() {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Ignore already stopped sources
      }
    }
    this.activeSources.clear();
    if (this.audioCtx) {
      this.nextStartTime = this.audioCtx.currentTime;
    } else {
      this.nextStartTime = 0;
    }
    if (this.onMetricsCallback) {
      this.onMetricsCallback({ volume: 0, frequencies: new Uint8Array(32) });
    }
  }

  close() {
    this.stopAll();
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}
