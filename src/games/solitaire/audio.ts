"use client";

import { TRACKS, type Track } from "./musicTracks";

/**
 * Tiny audio singleton:
 *  - SFX (deal / draw) preloaded HTMLAudioElement instances
 *  - Music: single <audio> element auto-advances through TRACKS playlist
 *  - Pub/sub for React via subscribe()
 *
 * Browsers block autoplay until a user gesture; the manager exposes
 * `unlock()` which is wired to the first pointer event on the board.
 */

export type SfxName = "deal" | "draw";

const SFX_URLS: Record<SfxName, string> = {
  deal: "/sounds/sfx/dealing_cards.ogg",
  draw: "/sounds/sfx/draw_cards.ogg",
};

class AudioManager {
  readonly tracks: Track[] = TRACKS;
  private sfx: Partial<Record<SfxName, HTMLAudioElement>> = {};
  private music: HTMLAudioElement | null = null;

  private _currentIdx = -1;
  private _playing = false;
  private _muted = false;
  private _musicVolume = 0.45;
  private _sfxVolume = 0.7;
  private _unlocked = false;

  private listeners = new Set<() => void>();

  /** Lazy-init audio elements (must run client-side). */
  init(): void {
    if (typeof window === "undefined") return;
    if (!this.music) {
      this.music = new Audio();
      this.music.preload = "auto";
      this.music.volume = this._musicVolume;
      this.music.addEventListener("ended", () => this.next());
    }
    for (const name of Object.keys(SFX_URLS) as SfxName[]) {
      if (!this.sfx[name]) {
        const a = new Audio(SFX_URLS[name]);
        a.preload = "auto";
        a.volume = this._sfxVolume;
        this.sfx[name] = a;
      }
    }
  }

  /** Unlock playback on first user gesture. Starts shuffled playlist. */
  unlock(): void {
    if (this._unlocked) return;
    this._unlocked = true;
    this.init();
    // If ensurePlaying already prepared a track, resume it.
    if (this._currentIdx >= 0) {
      void this.resume();
    } else if (this.tracks.length > 0) {
      const start = Math.floor(Math.random() * this.tracks.length);
      void this.play(start);
    }
  }

  /**
   * Attempt to play `idx` immediately (may be blocked by autoplay policy).
   * If blocked, the track is "prepared" so that the first call to unlock()
   * or any subsequent user gesture will resume from this track.
   */
  async ensurePlaying(idx: number): Promise<void> {
    this.init();
    if (this._currentIdx >= 0) return; // already playing/prepared
    if (!this.music || idx < 0 || idx >= this.tracks.length) return;
    this._currentIdx = idx;
    this.music.src = this.tracks[idx].url;
    this.music.volume = this._muted ? 0 : this._musicVolume;
    try {
      await this.music.play();
      this._playing = true;
      this._unlocked = true;
    } catch {
      // Autoplay blocked; will start on first unlock() call.
      this._playing = false;
    }
    this.emit();
  }

  // ── SFX ────────────────────────────────────────────────
  playSfx(name: SfxName): void {
    if (this._muted) return;
    this.init();
    const a = this.sfx[name];
    if (!a) return;
    a.currentTime = 0;
    // Catch both NotAllowedError (before gesture) and NotSupportedError (codec)
    a.play().catch(() => { /* swallow — sfx is best-effort */ });
  }

  // ── Music ──────────────────────────────────────────────
  async play(idx: number): Promise<void> {
    this.init();
    if (!this.music) return;
    if (idx < 0 || idx >= this.tracks.length) return;
    this._currentIdx = idx;
    this.music.src = this.tracks[idx].url;
    this.music.volume = this._muted ? 0 : this._musicVolume;
    try {
      await this.music.play();
      this._playing = true;
      this._unlocked = true;
    } catch {
      this._playing = false;
    }
    this.emit();
  }

  pause(): void {
    if (!this.music) return;
    this.music.pause();
    this._playing = false;
    this.emit();
  }

  resume(): void {
    if (!this.music) return;
    void this.music.play().then(() => {
      this._playing = true;
      this._unlocked = true;
      this.emit();
    }).catch(() => {
      this._playing = false;
      this.emit();
    });
  }

  toggle(): void {
    if (this._playing) this.pause();
    else if (this._currentIdx >= 0) this.resume();
    else this.unlock();
  }

  next(): void {
    if (this.tracks.length === 0) return;
    void this.play((this._currentIdx + 1) % this.tracks.length);
  }

  prev(): void {
    if (this.tracks.length === 0) return;
    const i = this._currentIdx <= 0 ? this.tracks.length - 1 : this._currentIdx - 1;
    void this.play(i);
  }

  toggleMute(): void {
    this._muted = !this._muted;
    if (this.music) this.music.volume = this._muted ? 0 : this._musicVolume;
    this.emit();
  }

  setMusicVolume(v: number): void {
    this._musicVolume = Math.max(0, Math.min(1, v));
    if (this.music && !this._muted) this.music.volume = this._musicVolume;
    this.emit();
  }

  // ── State accessors ────────────────────────────────────
  get currentIdx(): number {
    return this._currentIdx;
  }
  get currentTrack(): Track | null {
    return this._currentIdx >= 0 ? this.tracks[this._currentIdx] : null;
  }
  get isPlaying(): boolean {
    return this._playing;
  }
  get isMuted(): boolean {
    return this._muted;
  }
  get musicVolume(): number {
    return this._musicVolume;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const l of this.listeners) l();
  }
}

export const audio = new AudioManager();
