/**
 * Chalkboard Web Audio API Procedural Synthesizer
 * High-fidelity, self-contained chalk and eraser sound effects with 0 external file dependencies.
 */

let audioCtx: AudioContext | null = null;
let isMuted = false;

// Audio buffer cache for instant zero-latency playback
let noiseBuffer: AudioBuffer | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const bufferSize = ctx.sampleRate * 2; // 2 seconds of pink/white noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // Light pink noise filtering for chalk grain texture
    lastOut = (lastOut * 0.7) + (white * 0.3);
    data[i] = lastOut;
  }
  noiseBuffer = buffer;
  return noiseBuffer;
}

// Load sound preference from localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('porto_chalk_sound');
  isMuted = saved === 'false';
}

export function isSoundMuted(): boolean {
  return isMuted;
}

export function toggleSound(): boolean {
  isMuted = !isMuted;
  if (typeof window !== 'undefined') {
    localStorage.setItem('porto_chalk_sound', isMuted ? 'false' : 'true');
  }
  if (!isMuted) {
    playChalkTap(0.7);
  }
  return isMuted;
}

export function setSoundMuted(muted: boolean) {
  isMuted = muted;
  if (typeof window !== 'undefined') {
    localStorage.setItem('porto_chalk_sound', isMuted ? 'false' : 'true');
  }
}

/**
 * Play a short, crisp chalk tap on slate (e.g. for button click, item select)
 */
export function playChalkTap(volume = 0.5) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const noise = getNoiseBuffer(ctx);

    // Noise source for chalk grain
    const src = ctx.createBufferSource();
    src.buffer = noise;

    // Resonant bandpass filter (simulating slate chalk impact)
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(2400 + Math.random() * 600, now);
    bandpass.Q.setValueAtTime(4.5, now);

    // Highpass to eliminate boominess
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(1400, now);

    // Quick exponential decay envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045 + Math.random() * 0.02);

    src.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(ctx.destination);

    src.start(now, Math.random() * 1.5);
    src.stop(now + 0.07);
  } catch {
    // Audio policy blocked
  }
}

/**
 * Play a textured chalk stroke sound (e.g. for section zoom-in/out, nav link click)
 */
export function playChalkStroke(volume = 0.6) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const noise = getNoiseBuffer(ctx);

    // Granular noise source
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.playbackRate.setValueAtTime(0.9 + Math.random() * 0.25, now);

    // Chalk friction filter
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(2800, now);
    bandpass.frequency.linearRampToValueAtTime(2200 + Math.random() * 400, now + 0.16);
    bandpass.Q.setValueAtTime(3.2, now);

    // Stroke envelope: quick attack, textured body, decay
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18 + Math.random() * 0.04);

    src.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(ctx.destination);

    src.start(now, Math.random() * 1.0);
    src.stop(now + 0.25);
  } catch {
    // Graceful catch
  }
}

/**
 * Continuous chalk scratch sound when dragging/drawing on the chalkboard
 */
let lastDrawTime = 0;
export function playChalkDoodleScratch(speed = 1) {
  if (isMuted) return;
  const nowMs = performance.now();
  if (nowMs - lastDrawTime < 45) return; // throttle audio events to ~22 per sec
  lastDrawTime = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const noise = getNoiseBuffer(ctx);

    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.playbackRate.setValueAtTime(0.85 + Math.random() * 0.4, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2600 + Math.min(speed * 300, 1500), now);
    filter.Q.setValueAtTime(3.0, now);

    const gain = ctx.createGain();
    const vol = Math.min(0.35, 0.12 + speed * 0.08);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    src.start(now, Math.random() * 1.5);
    src.stop(now + 0.065);
  } catch {
    // Ignore
  }
}

/**
 * Play blackboard eraser wipe sound (muffled friction swoosh)
 */
export function playEraserWipe(volume = 0.65) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const noise = getNoiseBuffer(ctx);

    const src = ctx.createBufferSource();
    src.buffer = noise;

    // Lowpass filter for felt wool eraser texture
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(750, now);
    lowpass.frequency.exponentialRampToValueAtTime(320, now + 0.35);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    src.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(ctx.destination);

    src.start(now, Math.random() * 1.2);
    src.stop(now + 0.42);
  } catch {
    // Ignore
  }
}

/**
 * Play dramatic chalk dust explosion puff (burst of air and powdery scatter)
 */
export function playDustExplosion(volume = 0.7) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const noise = getNoiseBuffer(ctx);

    // 1. Initial puff impact
    const src1 = ctx.createBufferSource();
    src1.buffer = noise;

    const filter1 = ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(1100, now);
    filter1.frequency.exponentialRampToValueAtTime(450, now + 0.4);
    filter1.Q.setValueAtTime(2.0, now);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(volume * 0.6, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    src1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(ctx.destination);
    src1.start(now, Math.random() * 1.0);
    src1.stop(now + 0.5);

    // 2. Lingering airy dust billow
    const src2 = ctx.createBufferSource();
    src2.buffer = noise;

    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(800, now + 0.05);
    filter2.frequency.linearRampToValueAtTime(250, now + 0.6);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.linearRampToValueAtTime(volume * 0.35, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

    src2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(ctx.destination);
    src2.start(now + 0.02, Math.random() * 1.0);
    src2.stop(now + 0.7);
  } catch {
    // Ignore
  }
}
