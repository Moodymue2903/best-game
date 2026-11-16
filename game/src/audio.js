// Sound, synthesised with WebAudio — no audio assets, no network.
// A sizzle while skewers cook, a chime on a serve, a bright arpeggio on a perfect,
// a low sting on a walkaway, a pop on a fan. Mute toggles everything off.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let sizzle = null;

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gain, when) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t = ac.currentTime + (when || 0);
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain || 0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(dur, gain, filterFreq) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq || 4000;
    const g = ac.createGain();
    g.gain.value = gain || 0.08;
    src.connect(filter);
    filter.connect(g);
    g.connect(ac.destination);
    src.start();
  }

  return {
    setMuted(value) {
      muted = value;
      if (muted) this.stopSizzle();
    },
    isMuted() {
      return muted;
    },
    /** A soft looping sizzle while any skewer is on the grill. */
    startSizzle() {
      if (muted || sizzle) return;
      const ac = ensure();
      if (!ac) return;
      const len = Math.floor(ac.sampleRate * 0.5);
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * 0.5;
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = ac.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3000;
      const g = ac.createGain();
      g.gain.value = 0.02;
      src.connect(filter);
      filter.connect(g);
      g.connect(ac.destination);
      src.start();
      sizzle = { src, g };
    },
    stopSizzle() {
      if (!sizzle) return;
      try { sizzle.src.stop(); } catch { /* already stopped */ }
      sizzle = null;
    },
    serve() {
      tone(660, 0.12, 'sine', 0.12);
      tone(880, 0.18, 'sine', 0.12, 0.08);
    },
    perfect() {
      tone(523, 0.1, 'triangle', 0.12);
      tone(659, 0.1, 'triangle', 0.12, 0.07);
      tone(784, 0.16, 'triangle', 0.12, 0.14);
      tone(1047, 0.22, 'triangle', 0.1, 0.21);
    },
    walkaway() {
      tone(220, 0.25, 'sawtooth', 0.08);
      tone(165, 0.35, 'sawtooth', 0.08, 0.12);
    },
    burnt() {
      noise(0.2, 0.1, 1200);
      tone(140, 0.2, 'square', 0.06);
    },
    fan() {
      noise(0.25, 0.12, 900);
    },
    click() {
      tone(1200, 0.05, 'sine', 0.06);
    },
    night() {
      tone(392, 0.15, 'triangle', 0.1);
      tone(523, 0.2, 'triangle', 0.1, 0.12);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.12, i * 0.13));
    },
    lose() {
      [392, 330, 262].forEach((f, i) => tone(f, 0.3, 'triangle', 0.1, i * 0.16));
    },
  };
}
