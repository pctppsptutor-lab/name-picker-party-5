// Theme-specific recorded instruments and effects; only the selected game is fetched.
const MUSIC_SAMPLES = {
  "mallet": {
    "file": "music-marimba",
    "note": 72,
    "length": 0.32
  },
  "pluck": {
    "file": "music-harp",
    "note": 72,
    "length": 0.32
  },
  "bell": {
    "file": "music-glock",
    "note": 79,
    "length": 0.42
  },
  "glass": {
    "file": "music-vibes",
    "note": 60,
    "length": 0.38
  },
  "chip": {
    "file": "music-xylo",
    "note": 72,
    "length": 0.22
  },
  "piano": {
    "file": "music-piano",
    "note": 72,
    "length": 0.32
  }
};
const GAME_SOUNDS = {
  "g25": {
    "textures": [],
    "events": {
      "wrain": "rain",
      "b": "sneeze"
    }
  },
  "g26": {
    "textures": [],
    "events": {
      "open": "motor1",
      "close": "clank1",
      "sw*": "motor3",
      "c": "motor2"
    }
  },
  "g27": {
    "textures": [
      [
        "paddle paddle2",
        0.7,
        1.05,
        0.2
      ],
      [
        "dog1 dog3 dog2 dog4",
        1,
        2,
        0.4
      ]
    ],
    "events": {
      "c": "creak",
      "d": "splash1 splash2 splash3",
      "in": "dog2"
    },
    "water": true
  },
  "g28": {
    "textures": [],
    "events": {
      "van": "bell",
      "rev": "bell"
    }
  },
  "g29": {
    "textures": [
      [
        "motor3",
        1,
        2,
        0.17
      ]
    ],
    "events": {
      "c*": "coin",
      "in*": "clank1",
      "gold": "clank2",
      "drop": "pot"
    }
  },
  "g30": {
    "textures": [
      [
        "knock1 knock2",
        0.8,
        1.5,
        0.13
      ]
    ],
    "events": {
      "c": "pop1",
      "bk": "crunch"
    }
  }
};
const GameSound = {
  files: new Map(), buffers: new Map(), loading: new Map(), playing: new Set(), last: new Map(), takes: new Map(),
  names(id) {
    const p = GAME_SOUNDS[id];
    return p ? [...new Set([...p.textures.map(x => x[0]), ...Object.values(p.events), ...(p.water ? ['splash1 splash2 splash3 paddle paddle2 bubble1 bubble2 bubble3'] : []), ...this.musicNames(id)].join(' ').split(' ').filter(Boolean))] : [];
  },
  musicNames(id) { const recording = MUSIC_SAMPLES[GAME_AUDIO[id]?.instrument]; return recording ? [recording.file, 'music-shaker', 'music-bongo'] : []; },
  fetch(name) {
    if (!this.files.has(name)) {
      const task = fetch('assets/sfx/' + name + '.mp3', { priority: 'low' })
        .then(r => { if (!r.ok) throw Error(r.status); return r.arrayBuffer(); })
        .catch(() => { this.files.delete(name); return null; });
      this.files.set(name, task);
    }
    return this.files.get(name);
  },
  prepare(id, decode = false) {
    if (!store.settings.sound && !store.settings.music) return Promise.resolve();
    const c = decode ? AUD.get() : AUD.ctx;
    return Promise.all(this.names(id).map(name => {
      const bytes = this.fetch(name);
      if (!c || this.buffers.has(name)) return bytes;
      if (!this.loading.has(name)) {
        const task = bytes.then(b => b && c.decodeAudioData(b.slice(0)))
          .then(b => { if (b) this.buffers.set(name, b); })
          .catch(() => { this.files.delete(name); })
          .finally(() => this.loading.delete(name));
        this.loading.set(name, task);
      }
      return this.loading.get(name);
    }));
  },
  play(choices, { gain = .35, gap = .3, delay = 0, priority = false } = {}) {
    if (!store.settings.sound || document.hidden) return false;
    const c = AUD.get(); if (!c) return false;
    const names = choices.split(' '), take = this.takes.get(choices) || 0;
    const buffer = this.buffers.get(names[take % names.length]);
    if (!buffer) { this.prepare(curGame(), true); return false; }
    const at = c.currentTime + delay;
    if (at - (this.last.get(choices) ?? -Infinity) < gap) return true;
    if (this.playing.size >= 4) {
      if (!priority) return true;
      const victim = [...this.playing].find(node => !node.priority) || this.playing.values().next().value;
      victim.level.gain.setTargetAtTime(.0001, c.currentTime, .006);
      victim.stop(c.currentTime + .025); this.playing.delete(victim);
    }
    this.last.set(choices, at); this.takes.set(choices, take + 1);
    const node = c.createBufferSource(), level = c.createGain();
    node.buffer = buffer; node.level = level; node.priority = priority; level.gain.value = gain;
    if (priority) AUD.duckMusic?.(Math.min(.4, buffer.duration), .58);
    node.connect(level).connect(AUD.sfx); this.playing.add(node);
    node.onended = () => { this.playing.delete(node); node.disconnect(); level.disconnect(); };
    node.start(at); return true;
  },
  cue(key) {
    const events = GAME_SOUNDS[curGame()]?.events; if (!events) return;
    const sound = events[key] || Object.entries(events).find(([k]) => k.endsWith('*') && key.startsWith(k.slice(0, -1)))?.[1];
    if (sound) this.play(sound, { priority: true });
  },
  tick(r, dt) {
    r.soundTime = (r.soundTime || 0) + dt;
    if (r.now >= r.TW) return;
    const textures = GAME_SOUNDS[r.game?.id || 'g1']?.textures || [];
    r.soundNext ||= [];
    textures.forEach(([sound, first, interval, gain], i) => {
      if (r.soundTime < (r.soundNext[i] ?? first)) return;
      r.soundNext[i] = r.soundTime + interval;
      this.play(sound, { gain, gap: interval * .8 });
    });
  },
  stop() {
    for (const node of this.playing) { try { node.stop(); } catch (_) {} }
    this.playing.clear(); this.last.clear(); this.takes.clear();
    if (AUD.duck && AUD.ctx) { AUD.duck.gain.cancelScheduledValues(AUD.ctx.currentTime); AUD.duck.gain.setTargetAtTime(1, AUD.ctx.currentTime, .05); }
  }
};
// The envelope bounds sampled notes; synthesized voices remain the loading/error fallback.
function sampleVoice(c, bus, name, t, gain, rate = 1, duration = null) {
  const buffer = GameSound.buffers.get(name); if (!buffer) return false;
  const source = c.createBufferSource(), level = c.createGain();
  source.buffer = buffer; source.playbackRate.value = rate;
  const length = Math.max(.02, Math.min(duration ?? buffer.duration / rate, buffer.duration / rate));
  level.gain.setValueAtTime(.0001, t);
  level.gain.exponentialRampToValueAtTime(gain, t + .004);
  level.gain.setValueAtTime(gain, t + Math.max(.005, length - .04));
  level.gain.exponentialRampToValueAtTime(.0001, t + length);
  source.connect(level).connect(bus);
  source.onended = () => { source.disconnect(); level.disconnect(); };
  source.start(t); source.stop(t + length + .01); return true;
}

document.addEventListener('visibilitychange', () => { if (document.hidden && GameSound.playing.size) GameSound.stop(); });
