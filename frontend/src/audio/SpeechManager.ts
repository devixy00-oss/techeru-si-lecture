export type VisemeType = 'A' | 'O' | 'E' | 'NEUTRAL';

export interface LipSyncData {
  amplitude: number; // 0.0 to 1.0 (jaw opening)
  viseme: VisemeType;
  currentWord: string;
  charIndex: number;
}

export type LipSyncCallback = (data: LipSyncData) => void;
export type SubtitleCallback = (text: string, isSpeaking: boolean) => void;
export type RecognitionCallback = (transcript: string, isFinal: boolean) => void;

class SpeechManager {
  private isSpeaking = false;
  private isListening = false;
  private recognition: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private lipSyncCallbacks: Set<LipSyncCallback> = new Set();
  private subtitleCallbacks: Set<SubtitleCallback> = new Set();
  private animFrameId: number | null = null;

  // Audio simulation state for boundary interpolation
  private targetAmplitude = 0;
  private currentAmplitude = 0;
  private currentViseme: VisemeType = 'NEUTRAL';
  private currentWord = '';
  private rate = 1.0;
  private pitch = 1.05;
  private muted = false;
  private currentLanguage: 'en' | 'am' = 'en';
  private lastSpokenText: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      this.initRecognition();
    }
  }

  private initRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      } catch (e) {
        console.warn('SpeechRecognition initialization warning:', e);
      }
    }
  }

  public setLanguage(lang: 'en' | 'am') {
    this.currentLanguage = lang;
    if (this.recognition) {
      this.recognition.lang = lang === 'am' ? 'am-ET' : 'en-US';
    }
  }

  public getLanguage(): 'en' | 'am' {
    return this.currentLanguage;
  }

  public setPitch(pitch: number) {
    this.pitch = Math.max(0.6, Math.min(1.6, pitch));
  }

  public getPitch(): number {
    return this.pitch;
  }

  public getLastSpokenText(): string {
    return this.lastSpokenText;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (muted && this.isSpeaking) {
      this.interrupt();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setRate(rate: number) {
    this.rate = Math.max(0.7, Math.min(1.5, rate));
  }

  public getRate(): number {
    return this.rate;
  }

  public onLipSync(cb: LipSyncCallback): () => void {
    this.lipSyncCallbacks.add(cb);
    return () => this.lipSyncCallbacks.delete(cb);
  }

  public onSubtitle(cb: SubtitleCallback): () => void {
    this.subtitleCallbacks.add(cb);
    return () => this.subtitleCallbacks.delete(cb);
  }

  // ── TEXT TO SPEECH & LIP-SYNC ─────────────────────────────────
  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        onStart?.();
        setTimeout(() => {
          onEnd?.();
          resolve();
        }, 1500);
        return;
      }

      this.interrupt();

      if (this.muted) {
        onStart?.();
        this.broadcastSubtitles(text, true);
        const duration = Math.min(8000, Math.max(2000, text.length * 60));
        setTimeout(() => {
          this.broadcastSubtitles('', false);
          onEnd?.();
          resolve();
        }, duration);
        return;
      }

      // Strip markdown symbols for clean vocal speech
      const cleanText = text
        .replace(/#+\s*/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/>\s*/g, '')
        .replace(/`{1,3}[\s\S]*?`{1,3}/g, '')
        .trim();

      this.lastSpokenText = text;
      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.currentUtterance = utterance;
      utterance.rate = this.rate;
      utterance.pitch = this.pitch;
      utterance.lang = this.currentLanguage === 'am' ? 'am-ET' : 'en-US';

      // Pick natural voice for active language
      const voices = window.speechSynthesis.getVoices();
      let chosenVoice: SpeechSynthesisVoice | undefined;

      if (this.currentLanguage === 'am') {
        chosenVoice = voices.find(v => v.lang.startsWith('am') || v.lang.includes('ETH'));
      } else {
        chosenVoice =
          voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Guy') || v.name.includes('David'))) ||
          voices.find(v => v.lang.startsWith('en'));
      }

      if (chosenVoice) {
        utterance.voice = chosenVoice;
      } else if (voices.length > 0 && !chosenVoice && this.currentLanguage !== 'am') {
        utterance.voice = voices[0];
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        onStart?.();
        this.startLipSyncLoop();
      };

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const charIndex = event.charIndex;
          const remaining = cleanText.slice(charIndex);
          const match = remaining.match(/^\S+/);
          const word = match ? match[0] : '';
          this.currentWord = word;
          this.broadcastSubtitles(cleanText.slice(0, charIndex + (match ? match[0].length : 0)), true);

          // Viseme estimation based on vowels in the active word
          const lower = word.toLowerCase();
          if (/[ao]/.test(lower)) {
            this.currentViseme = 'A';
            this.targetAmplitude = 0.85;
          } else if (/[ou]/.test(lower)) {
            this.currentViseme = 'O';
            this.targetAmplitude = 0.75;
          } else if (/[eiy]/.test(lower)) {
            this.currentViseme = 'E';
            this.targetAmplitude = 0.65;
          } else {
            this.currentViseme = 'NEUTRAL';
            this.targetAmplitude = 0.35;
          }
        }
      };

      utterance.onend = () => {
        this.stopLipSyncLoop();
        this.isSpeaking = false;
        this.broadcastSubtitles('', false);
        onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        this.stopLipSyncLoop();
        this.isSpeaking = false;
        this.broadcastSubtitles('', false);
        onEnd?.();
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  private startLipSyncLoop() {
    const loop = () => {
      if (!this.isSpeaking) return;

      // Smooth decay & oscillation to simulate natural syllable cadence
      this.currentAmplitude += (this.targetAmplitude - this.currentAmplitude) * 0.25;
      this.targetAmplitude = Math.max(0.1, this.targetAmplitude - 0.04);

      // Random micro-vocal pulse
      const wave = Math.abs(Math.sin(performance.now() * 0.015)) * 0.2;
      const amplitude = Math.min(1.0, this.currentAmplitude + wave);

      this.lipSyncCallbacks.forEach(cb =>
        cb({
          amplitude,
          viseme: this.currentViseme,
          currentWord: this.currentWord,
          charIndex: 0,
        })
      );

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private stopLipSyncLoop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.currentAmplitude = 0;
    this.targetAmplitude = 0;
    this.currentViseme = 'NEUTRAL';
    this.currentWord = '';
    this.lipSyncCallbacks.forEach(cb =>
      cb({
        amplitude: 0,
        viseme: 'NEUTRAL',
        currentWord: '',
        charIndex: 0,
      })
    );
  }

  private broadcastSubtitles(text: string, isSpeaking: boolean) {
    this.subtitleCallbacks.forEach(cb => cb(text, isSpeaking));
  }

  // ── INTERRUPTION ─────────────────────────────────────────────
  public interrupt(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.stopLipSyncLoop();
    this.broadcastSubtitles('', false);
  }

  // ── STUDENT MICROPHONE SPEECH RECOGNITION ────────────────────
  public startListening(onResult: RecognitionCallback, onError?: (err: any) => void): boolean {
    if (!this.recognition) {
      onError?.('Speech recognition not supported in this browser.');
      return false;
    }

    try {
      this.interrupt(); // Stop teacher if currently speaking
      this.isListening = true;

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) {
          onResult(final.trim(), true);
        } else if (interim) {
          onResult(interim.trim(), false);
        }
      };

      this.recognition.onerror = (e: any) => {
        console.warn('SpeechRecognition error:', e);
        onError?.(e);
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      this.recognition.start();
      return true;
    } catch (e) {
      console.warn('Speech recognition start failed:', e);
      onError?.(e);
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Recognition stop error:', e);
      }
      this.isListening = false;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const speechManager = new SpeechManager();
