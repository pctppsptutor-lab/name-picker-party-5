// Procedural canvas effects shared by all games: particles, light rays, shock rings, lightning, beams and floating motes.
// Everything is drawn with code, so it costs no download. Particles live on the current round (race.parts).
const FX = (() => {
  const TAU = Math.PI * 2, rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const MAX = 500;
  const parts = () => race ? (race.parts = race.parts || []) : null;

  // soft round glow, pre-rendered once per colour (hex colours only)
  const glowCache = {};
  function glow(color) {
    if (glowCache[color]) return glowCache[color];
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, color); gr.addColorStop(.3, color + 'cc'); gr.addColorStop(1, color + '00');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return glowCache[color] = c;
  }

  function emit(type, x, y, n, o = {}) {
    const P = parts(); if (!P) return;
    for (let i = 0; i < n && P.length < MAX; i++) {
      const a = (o.angle ?? -Math.PI / 2) + rnd(-1, 1) * (o.spread ?? Math.PI), sp = rnd(...(o.speed || [80, 260]));
      P.push({ type, x: x + rnd(-1, 1) * (o.jitter || 0), y: y + rnd(-1, 1) * (o.jitter || 0), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        age: 0, life: rnd(...(o.life || [.6, 1.1])), size: rnd(...(o.size || [6, 12])), color: pick(o.colors || ['#ffffff']),
        rot: rnd(0, TAU), vr: rnd(-8, 8), g: o.gravity ?? 0, drag: o.drag ?? .96, floor: o.floor, grow: o.grow || 0, x2: o.x2, y2: o.y2 });
    }
  }

  function star(c, s) {
    c.beginPath();
    for (let i = 0; i < 8; i++) { const r = i % 2 ? s * .32 : s, a = i * Math.PI / 4; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    c.closePath(); c.fill();
  }
  function bolt(c, x1, y1, x2, y2, color, width) {
    const n = 7, dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
    c.strokeStyle = color; c.lineWidth = width; c.lineJoin = 'round'; c.beginPath(); c.moveTo(x1, y1);
    for (let i = 1; i < n; i++) { const k = i / n, off = rnd(-1, 1) * len * .12; c.lineTo(x1 + dx * k + nx * off, y1 + dy * k + ny * off); }
    c.lineTo(x2, y2); c.stroke();
  }

  function draw(r, dt) {
    const P = r.parts; if (!P || !P.length) return;
    for (const p of P) {
      p.age += dt; p.vy += p.g * dt; p.vx *= p.drag; p.vy *= p.type === 'bubble' ? 1 : p.drag;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.type === 'bubble') p.x += Math.sin(p.age * 9 + p.rot) * 30 * dt;
      if (p.floor !== undefined && p.y > p.floor) { p.y = p.floor; p.vy *= -.45; p.vx *= .7; p.vr *= .6; }
    }
    for (let i = P.length - 1; i >= 0; i--) if (P[i].age >= P[i].life) P.splice(i, 1);
    for (const p of P) {
      const k = p.age / p.life, a = 1 - k;
      ctx.save(); ctx.translate(p.x, p.y);
      switch (p.type) {
        case 'spark':
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.rotate(p.rot);
          ctx.drawImage(glow(p.color), -p.size * 1.6, -p.size * 1.6, p.size * 3.2, p.size * 3.2);
          ctx.fillStyle = '#ffffff'; star(ctx, p.size * (1 - k * .5)); break;
        case 'glow':
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * .9; const gs = p.size * (1 + k);
          ctx.drawImage(glow(p.color), -gs, -gs, gs * 2, gs * 2); break;
        case 'smoke': {
          ctx.globalAlpha = a * .7; const s = p.size * (1 + k * (2 + p.grow));
          ctx.drawImage(glow(p.color), -s, -s, s * 2, s * 2); break;
        }
        case 'coin': {
          ctx.globalAlpha = Math.min(1, a * 3); const sx = Math.max(.15, Math.abs(Math.cos(p.rot)));
          ctx.scale(sx, 1); ctx.fillStyle = '#c98a00'; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, TAU); ctx.fill();
          ctx.fillStyle = '#ffd43b'; ctx.beginPath(); ctx.arc(0, 0, p.size * .78, 0, TAU); ctx.fill();
          ctx.fillStyle = '#fff3a8'; ctx.beginPath(); ctx.arc(-p.size * .25, -p.size * .25, p.size * .25, 0, TAU); ctx.fill(); break;
        }
        case 'shard':
          ctx.globalAlpha = Math.min(1, a * 2.5); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.strokeStyle = '#00000033'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(-p.size, -p.size * .5); ctx.lineTo(p.size * .9, -p.size * .7); ctx.lineTo(p.size * .3, p.size * .8); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
        case 'bubble': {
          const s = p.size * (k > .9 ? 1 + (k - .9) * 6 : 1);
          ctx.globalAlpha = k > .9 ? (1 - k) * 10 * .9 : .9; ctx.strokeStyle = p.color; ctx.lineWidth = 2;
          ctx.fillStyle = p.color + '33'; ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#ffffffcc'; ctx.beginPath(); ctx.arc(-s * .35, -s * .35, s * .22, 0, TAU); ctx.fill(); break;
        }
        case 'drop':
          ctx.globalAlpha = a; ctx.fillStyle = p.color; ctx.rotate(Math.atan2(p.vy, p.vx));
          ctx.beginPath(); ctx.ellipse(0, 0, p.size * 1.4, p.size * .7, 0, 0, TAU); ctx.fill(); break;
        case 'ring': {
          const e = 1 - Math.pow(1 - k, 3);
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.strokeStyle = p.color; ctx.lineWidth = 10 * a + 1;
          ctx.beginPath(); ctx.ellipse(0, 0, p.size * e, p.size * e * .55, 0, 0, TAU); ctx.stroke(); break;
        }
        case 'bolt':
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
          bolt(ctx, 0, 0, p.x2, p.y2, p.color + '88', 7); bolt(ctx, 0, 0, p.x2, p.y2, '#ffffff', 2); break;
      }
      ctx.restore();
    }
  }

  return {
    draw,
    // run fn at most once per `gap` seconds of round time
    every(r, key, gap, fn) { r.ticks = r.ticks || {}; if (!(r.now - (r.ticks[key] ?? -9) < gap)) { r.ticks[key] = r.now; fn(); } },
    sparkle: (x, y, n = 24, colors = ['#ffd84a', '#fff3a0', '#7cf7ff']) => emit('spark', x, y, n, { colors, speed: [120, 380], size: [5, 11], gravity: 160, life: [.6, 1.2] }),
    glitter: (x, y, n = 8, colors = ['#ffd84a', '#ffffff']) => emit('glow', x, y, n, { colors, speed: [10, 60], size: [6, 14], life: [.5, 1], jitter: 20 }),
    smoke: (x, y, n = 8, color = '#e8edf2') => emit('smoke', x, y, n, { colors: [color], speed: [20, 90], size: [16, 30], life: [.8, 1.4], jitter: 14, drag: .94, gravity: -20 }),
    coins: (x, y, n = 20, floor = y + 120) => emit('coin', x, y, n, { speed: [220, 520], size: [8, 13], gravity: 1100, life: [1.4, 2], floor, drag: .99 }),
    shards: (x, y, n = 16, colors = ['#fff6dc', '#f3e2b5', '#ffffff']) => emit('shard', x, y, n, { colors, speed: [180, 420], size: [7, 14], gravity: 1000, life: [.8, 1.2], drag: .98 }),
    bubbles: (x, y, n = 12, color = '#bff6ff') => emit('bubble', x, y, n, { colors: [color], angle: -Math.PI / 2, spread: .5, speed: [40, 140], size: [6, 16], life: [.9, 1.6], drag: .99, jitter: 20 }),
    splash: (x, y, n = 16) => emit('drop', x, y, n, { colors: ['#e6fbff', '#9fe6ff', '#ffffff'], angle: -Math.PI / 2, spread: 1.1, speed: [200, 460], size: [3, 6], gravity: 1200, life: [.5, .8], drag: .99 }),
    metal: (x, y, n = 18) => emit('spark', x, y, n, { colors: ['#ffb347', '#ffd84a'], speed: [200, 520], size: [3, 6], gravity: 900, life: [.35, .7], drag: .98 }),
    ring: (x, y, color = '#ffd84a', size = 160) => emit('ring', x, y, 1, { colors: [color], speed: [0, 0], size: [size, size], life: [.55, .55] }),
    bolts: (x, y, n = 4, radius = 110, color = '#7cf7ff') => {
      for (let i = 0; i < n; i++) { const a = rnd(0, TAU), d = rnd(.6, 1) * radius; emit('bolt', x, y, 1, { colors: [color], speed: [0, 0], life: [.12, .22], x2: Math.cos(a) * d, y2: Math.sin(a) * d * .7 }); }
    },
    // sparks spread along a line, e.g. a magic beam from a wand to a target
    line(x1, y1, x2, y2, n = 18, colors) { for (let i = 0; i <= n; i++) emit('spark', lerp(x1, x2, i / n), lerp(y1, y2, i / n), 1, { colors: colors || ['#b48cff', '#7cf7ff', '#ffffff'], speed: [10, 60], size: [4, 8], life: [.4, .8] }); },

    // ---- continuous drawings (no state) ----
    rays(x, y, radius, t, color = '#fff2a8', alpha = .5) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * .35); ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, radius); gr.addColorStop(0, color); gr.addColorStop(1, color + '00');
      ctx.fillStyle = gr; ctx.globalAlpha = alpha;
      for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, radius, i * TAU / 12, i * TAU / 12 + TAU / 30); ctx.closePath(); ctx.fill(); }
      ctx.globalAlpha = alpha * .8; ctx.drawImage(glow(color), -radius * .45, -radius * .45, radius * .9, radius * .9);
      ctx.restore();
    },
    motes(t, color = '#fff6c8', n = 26, area = [0, 120, 1600, 760]) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const img = glow(color);
      for (let i = 0; i < n; i++) {
        const sx = (i * 977) % 1000 / 1000, sy = (i * 571) % 1000 / 1000, sp = .02 + (i % 5) * .008;
        const x = area[0] + ((sx + t * sp * .3) % 1) * area[2], y = area[1] + ((sy - t * sp + 10) % 1) * area[3];
        const s = 5 + (i % 4) * 3; ctx.globalAlpha = .25 + .25 * Math.sin(t * 2 + i);
        ctx.drawImage(img, x - s, y - s, s * 2, s * 2);
      }
      ctx.restore();
    },
    // a scanner beam: translucent cone with a bright line sweeping up and down
    beam(x, top, bottom, w, t, color = '#5dff9a') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createLinearGradient(x - w, 0, x + w, 0); gr.addColorStop(0, color + '00'); gr.addColorStop(.5, color + '55'); gr.addColorStop(1, color + '00');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - w * .3, top); ctx.lineTo(x + w * .3, top); ctx.lineTo(x + w, bottom); ctx.lineTo(x - w, bottom); ctx.closePath(); ctx.fill();
      const y = lerp(top + 20, bottom, (Math.sin(t * 5) + 1) / 2), half = lerp(w * .3, w, (y - top) / (bottom - top));
      ctx.strokeStyle = '#eafff1'; ctx.lineWidth = 3; ctx.globalAlpha = .9; ctx.beginPath(); ctx.moveTo(x - half, y); ctx.lineTo(x + half, y); ctx.stroke();
      ctx.restore();
    },
    halo(x, y, radius, color = '#ffd84a', alpha = .6) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha; ctx.drawImage(glow(color), x - radius, y - radius, radius * 2, radius * 2); ctx.restore();
    }
  };
})();

// Camera for the play area: smooth zoom/follow, screen shake and short slow motion.
// The banner, timer and confetti are drawn after CAM.end(), so they never move.
const CAM = (() => {
  const SW = 1600, SH = 900;
  const cam = r => r.cam || (r.cam = { x: SW / 2, y: SH / 2, z: 1, tx: SW / 2, ty: SH / 2, tz: 1, shake: 0, follow: null });
  return {
    // call once per frame, right after the base canvas transform is set
    begin(r, dt) {
      if (!r) return;
      const c = cam(r);
      if (r.slowUntil && performance.now() < r.slowUntil) r.t0 += dt * 1000 * (1 - r.slowF);   // stretch round time
      if (c.follow) { c.tx = c.follow.x; c.ty = c.follow.y - 40; }
      else if (r.phase === 'run' && r.now > r.TW - 2.5) {        // gentle push-in during the final countdown
        const k = clamp((r.now - r.TW + 2.5) / 2.5); c.tx = SW / 2; c.ty = SH / 2 + 20; c.tz = 1 + .05 * k;
      }
      if (store.settings.calm) { c.tz = 1; c.shake = 0; }          // reduced motion: no zoom, no shake
      const e = 1 - Math.exp(-dt * 4.5);
      c.x += (c.tx - c.x) * e; c.y += (c.ty - c.y) * e; c.z += (c.tz - c.z) * e;
      c.shake *= Math.exp(-dt * 7);
      const hw = SW / 2 / c.z, hh = SH / 2 / c.z, cx = clamp(c.x, hw, SW - hw), cy = clamp(c.y, hh, SH - hh);
      const ox = (Math.random() * 2 - 1) * c.shake, oy = (Math.random() * 2 - 1) * c.shake;
      ctx.fillStyle = '#10223a'; ctx.fillRect(0, 0, SW, SH);
      ctx.translate(SW / 2 + ox, SH / 2 + oy); ctx.scale(c.z, c.z); ctx.translate(-cx, -cy);
    },
    end() { ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0); },
    // smoothly zoom towards something with x/y (it keeps following it as it moves)
    follow(r, obj, z = 1.25) { const c = cam(r); c.follow = obj; c.tz = z; },
    release(r) { const c = cam(r); c.follow = null; c.tx = SW / 2; c.ty = SH / 2; c.tz = 1; },
    shake(r, px = 10) { if (store.settings.calm) return; const c = cam(r); c.shake = Math.max(c.shake, px); },
    slow(r, seconds = .5, factor = .35) { r.slowUntil = performance.now() + seconds * 1000; r.slowF = factor; },
    // standard reactions for the shared outcome moments
    react(r, kind, who) {
      if (kind === 'almost_selected') this.follow(r, who, 1.12);
      else if (kind === 'wrong_turn') { this.shake(r, 11); this.release(r); }
      else if (kind === 'selected') { this.follow(r, who, 1.22); this.slow(r, .45, .35); this.shake(r, 5); }
    }
  };
})();
