// Moving scene layers for games 25-30 (back layer behind the players, front layer over them), drawn in code.
// Layers shift against the camera at different rates for a sense of depth. Pure functions of time: no state, no downloads.
const SCENES = (() => {
  const TAU = Math.PI * 2;
  const wave = (t, f, ph = 0) => Math.sin(t * f + ph);
  const loop = (t, speed, ph = 0) => ((t * speed + ph) % 1 + 1) % 1;
  function layer(depth, fn) {
    const c = race && race.cam; ctx.save();
    if (c) ctx.translate(-(c.x - 800) * (depth - 1) * .6, -(c.y - 450) * (depth - 1) * .6);
    fn(); ctx.restore();
  }
  function cloud(x, y, s, a = .85) {
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#ffffff';
    [[0, 0, 34], [36, -14, 40], [76, 0, 32], [38, 12, 34]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  function leaf(x, y, len, ang, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * .5, -len * .28, len, 0); ctx.quadraticCurveTo(len * .5, len * .28, 0, 0); ctx.fill(); ctx.restore();
  }
  function fern(x, y, t, dir, n, len, cols, ph = 0) {
    for (let i = 0; i < n; i++) leaf(x, y, len * (.75 + (i % 3) * .15), (dir > 0 ? -Math.PI * .1 - i * .22 : -Math.PI * .9 + i * .22) + wave(t, 1.3, ph + i) * .06, cols[i % cols.length]);
  }
  function butterfly(x, y, t, col) {
    const f = Math.abs(Math.sin(t * 14)) * .8 + .2;
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = col;
    [-1, 1].forEach(d => { ctx.save(); ctx.scale(d * f, 1); ctx.beginPath(); ctx.ellipse(8, -4, 9, 6, -.4, 0, TAU); ctx.ellipse(7, 5, 6, 4, .4, 0, TAU); ctx.fill(); ctx.restore(); });
    ctx.fillStyle = '#3b2a1a'; ctx.fillRect(-1.5, -7, 3, 14); ctx.restore();
  }
  function shaft(x, y, ang, len, w, color, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(0, 0, len, 0); g.addColorStop(0, color); g.addColorStop(1, color + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -w * .3); ctx.lineTo(len, -w); ctx.lineTo(len, w); ctx.lineTo(0, w * .3); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  const flicker = (t, i) => 1 + .08 * Math.sin(t * 11 + i * 3) + .05 * Math.sin(t * 23 + i * 7);
  function lamps(list, t, color, r = 46, a = .55) { list.forEach(([x, y], i) => FX.halo(x, y, r * flicker(t, i), color, a * flicker(t, i))); }
  function vignette(color, a) {
    const g = ctx.createRadialGradient(800, 450, 380, 800, 450, 980); g.addColorStop(0, color + '00'); g.addColorStop(1, color);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(-200, -200, 2000, 1300); ctx.restore();
  }

  function flyer(x, y, t, sc, col) {
    const f = Math.sin(t * 9) * .6;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-22, -8 * f); ctx.quadraticCurveTo(-10, -12 - 8 * f, 0, 0); ctx.quadraticCurveTo(10, -12 - 8 * f, 22, -8 * f); ctx.stroke(); ctx.restore();
  }

  return {
    g25: {
      back(t) { layer(.85, () => { for (let i = 0; i < 3; i++) cloud(loop(t, .008, i * .33) * 1900 - 200, 60 + i * 30, .8, .7); shaft(60, -20, .9, 760, 120, '#fff3b0', .14 + .04 * wave(t, .5)); }); },
      front(t) { layer(1.2, () => { for (let i = 0; i < 6; i++) { const k = loop(t, .05, i / 6); FX.halo(120 + i * 270 + wave(t, .7, i) * 30, 900 - k * 500, 6, ['#ff6f6f', '#ffd84a', '#7cff9b', '#7cd0ff', '#b48cff'][i % 5], .5 * Math.sin(k * Math.PI)); } }); }
    },
    g26: {
      back(t) { layer(.85, () => {
        ctx.save(); ctx.translate(800, 240); ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.rotate(t * .5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -150); ctx.stroke(); ctx.restore();
        for (let i = 0; i < 12; i++) { const a = t * .3 + i * TAU / 12; FX.halo(800 + Math.cos(a) * 240, 240 + Math.sin(a) * 240, 6, '#5df2ff', .5); } }); },
      front(t) { layer(1.2, () => { for (let i = 0; i < 8; i++) { const k = loop(t, .06, i / 8); FX.halo(100 + i * 200 + wave(t, .8, i) * 30, 900 - k * 600, 5, '#c27cff', .5 * Math.sin(k * Math.PI)); } vignette('#05061a', .3); }); }
    },
    g27: {
      back(t) { layer(.85, () => { for (let i = 0; i < 3; i++) cloud(loop(t, .008, i * .33) * 1900 - 200, 50 + i * 30, .8, .8);
        ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 3; for (let i = 0; i < 16; i++) { const y = 320 + (i * 97) % 500, x = ((i * 233 + t * 40) % 1400) + 90; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 20, y - 5, x + 40, y); ctx.stroke(); } ctx.restore(); }); },
      front(t) { layer(1.2, () => { for (let i = 0; i < 6; i++) { const k = loop(t, .25, i / 6); FX.halo(200 + (i * 211) % 1100, 330 + (i * 83) % 480, 4 + k * 10, '#ffffff', .5 * (1 - k)); } }); }
    },
    g28: {
      back(t) { layer(.85, () => { for (let i = 0; i < 4; i++) FX.halo(290 + i * 360, 150, 50 + 6 * wave(t, .8, i), '#b48cff', .25); for (let i = 0; i < 12; i++) FX.halo(230 + (i * 113) % 1300, 60 + (i * 47) % 220, 3, '#ffffff', .3 + .6 * Math.abs(wave(t, 1 + i * .3, i))); }); },
      front(t) { layer(1.2, () => { for (let i = 0; i < 10; i++) { const k = loop(t, .05, i / 10); FX.halo(80 + i * 160 + wave(t, .9, i) * 30, 900 - k * 700, 6, ['#c27cff', '#7cf7ff'][i % 2], .5 * Math.sin(k * Math.PI)); } vignette('#08040f', .3); }); }
    },
    g29: {
      back(t) { layer(.85, () => { FX.halo(800, 70, 180, '#ff6fae', .2 + .1 * wave(t, 3)); for (let i = 0; i < 14; i++) FX.halo(60 + i * 115, 140, 6, ['#ff6fae', '#7cf7ff', '#ffd84a'][i % 3], .3 + .6 * Math.abs(wave(t, 3, i))); }); },
      front(t) { layer(1.2, () => { for (let i = 0; i < 6; i++) { const k = loop(t, .05, i / 6); ctx.save(); ctx.translate(100 + i * 280, -20 + k * 940); ctx.rotate(t * 2 + i); ctx.fillStyle = ['#ff6fae', '#ffd84a', '#7cf7ff'][i % 3]; ctx.globalAlpha = .6; ctx.fillRect(-8, -3, 16, 6); ctx.restore(); } vignette('#0a0618', .3); }); }
    },
    g30: {
      back(t) { layer(.85, () => { for (let i = 0; i < 3; i++) cloud(loop(t, .008, i * .33) * 1900 - 200, 50 + i * 30, .8, .8); shaft(1550, -20, 2.3, 700, 120, '#fff3b0', .12 + .04 * wave(t, .5)); }); },
      front(t) { layer(1.2, () => {
        for (let i = 0; i < 2; i++) { const x = 300 + i * 700 + wave(t, .3, i) * 200, y = 260 + wave(t, .7, i) * 40, f = Math.abs(Math.sin(t * 14 + i)) * .8 + .2;
          ctx.save(); ctx.translate(x, y); ctx.fillStyle = i ? '#ffd34d' : '#ff8fb1'; [-1, 1].forEach(d => { ctx.save(); ctx.scale(d * f, 1); ctx.beginPath(); ctx.ellipse(8, -4, 9, 6, -.4, 0, TAU); ctx.ellipse(7, 5, 6, 4, .4, 0, TAU); ctx.fill(); ctx.restore(); }); ctx.restore(); } }); }
    }
  };
})();
