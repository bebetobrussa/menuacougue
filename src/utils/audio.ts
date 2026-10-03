// Native Web Audio API synth sound effect for price updates
export function playPriceUpdateSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    // Cheerful store chime (E5 -> G#5 -> B5)
    const now = ctx.currentTime;
    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc1.frequency.setValueAtTime(830.61, now + 0.08); // G#5
    osc1.frequency.setValueAtTime(987.77, now + 0.16); // B5

    osc2.frequency.setValueAtTime(329.63, now); // E4 harmonic
    osc2.frequency.setValueAtTime(493.88, now + 0.16);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.15, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch {
    // Ignore audio permission or autoplay restrictions silently
  }
}
