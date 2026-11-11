// Game 26 — Oops, Wrong Year! (matching paths & puzzles)
// Ten time portals each show a colour and an era symbol, then swap places. Matching the right portal pair brings
// the picked student back to class.
// Twist: the first portal pair sends someone home with a cooking pot on their head instead of a crown;
// the baby-dino robot spins the time ring and opens the real winning pair.
(() => {
  const COLS = [380, 560, 740, 920, 1100];
  const SLOTS = [...COLS.map(x => [x, 330]), ...COLS.map(x => [x, 590])];
  const ICONS = ['q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q27', 'q0'];
  const MACH = [1440, 470], SWAP = .5;

  function portal(x, y, open, icon, glow, t, purple, winner = false) {
    if (glow) FX.halo(x, y, 110, purple ? '#c27cff' : '#5df2ff', .55 + .2 * Math.sin(t * 9));
    drawImg(purple ? 'q21' : 'q20', x, y, 130, { rot: store.settings.calm ? 0 : t * (purple ? -1.5 : 1.5) });
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = winner ? '#ffe27a' : purple ? '#dcc5ff' : '#a6f1ff';
    ctx.lineWidth = winner ? 6 : 3;
    ctx.beginPath();
    if (purple) {
      ctx.moveTo(0, -67); ctx.lineTo(67, 0); ctx.lineTo(0, 67); ctx.lineTo(-67, 0); ctx.closePath();
    } else ctx.arc(0, 0, 62, 0, Math.PI * 2);
    ctx.stroke();
    if (open > 0) {
      ctx.fillStyle = '#14243cdd'; ctx.beginPath(); ctx.arc(0, 0, 43 * open, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    if (open > 0 && icon) drawImg(icon, x, y, 72 * open);
  }
  function layout(r, t) {
    const slot = r.players.map(p => p.slot0), out = new Map(); let moving = null;
    for (const s of r.swaps) { if (t >= s.at + SWAP) { const a = slot[s.a]; slot[s.a] = slot[s.b]; slot[s.b] = a; } else if (t >= s.at) moving = s; }
    r.players.forEach((p, i) => {
      let [x, y] = SLOTS[slot[i]];
      if (moving && (i === moving.a || i === moving.b)) { const o = i === moving.a ? moving.b : moving.a, k = ease((t - moving.at) / SWAP), [x2, y2] = SLOTS[slot[o]]; x = lerp(x, x2, k); y = lerp(y, y2, k) - Math.sin(k * Math.PI) * (i === moving.a ? 70 : -40); }
      out.set(p, { x, y });
    });
    return out;
  }

  GAME_IMPL.g26 = {
    id: 'g26', title: 'Oops, Wrong Year!', base: 'assets/g26/', titleY: 820,
    assets: gAssets(['choose', 'crown', 'dino', 'win'], [...ICONS, 'q1', 'q20', 'q21']),
    startBanner: '⏳ Remember each portal\'s symbol!', mote: '#d6f4ff', rayColor: '#d6f4ff',

    setup(r) {
      const slots = spread(r.players.length), icons = shuffle([...ICONS]);
      r.players.forEach((p, i) => { p.slot0 = slots[i]; p.icon = icons[i]; p.purple = i % 2 === 1; [p.x, p.y] = SLOTS[slots[i]]; });
      r.M = clamp(r.TW * .28, 1.6, 3.5);
      r.swaps = []; const n = r.players.length;
      if (n > 1) for (let at = .6 + r.M + .4; at < r.TW - 1.6; at += .62) { const a = randInt(n); let b = randInt(n - 1); if (b >= a) b++; r.swaps.push({ at, a, b }); }
      r.fakes = makeFakes(r, Math.max(.6 + r.M + .4, r.TW - 1.6 - Math.min(r.TW * .3, 4)));
      r.final = layout(r, r.TW);
    },

    tick(r, t, te) {
      const f = activeFake(r, t), D = r.decoy, Wn = r.winner;
      if (t > .6) cue('open', () => { SFX.swoosh(); r.banner = '🌀 The portals open — remember the eras!'; });
      if (t > .6 + r.M) cue('close', () => { SFX.tone(220, .3, { type: 'triangle', vol: .12 }); r.banner = '⏳ The portals swap places…'; });
      for (const s of r.swaps) if (t > s.at) cue('sw' + s.at, () => SFX.noise(.2, { vol: .1, f: 2200, to: 800, q: .8 }));
      if (f && te < 0 && t > r.swaps.reduce((m, s) => Math.max(m, s.at), 0)) cue('fk' + f.at, () => { SFX.leader(); r.banner = '🤖 The robot checks ' + f.p.name + "'s portal…"; });
      if (!r.plain) {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D); SFX.swoosh(); r.banner = '🌀 ' + D.name + ' steps through…'; });
        if (te > .6) cue('b', () => { outcome('wrong_turn', D); SFX.sadTrombone(); r.banner = '🍲 Back with a cooking POT instead of a crown!'; });
        if (te > 1.1) cue('c', () => { CAM.shake(r, 8); SFX.wheee(); r.banner = '🦖 The dino robot spins the time ring…'; });
        if (te > 1.8) cue('d', () => { outcome('selected', Wn); SFX.sparkle(); r.banner = '👑 …and opens ' + Wn.name + "'s portal!"; });
      } else {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); r.banner = '🌀 Is it ' + (D || Wn).name + "'s portal?"; });
        if (te > 1.2) cue('d', () => { outcome('selected', Wn); SFX.boing(); r.banner = '👑 No — this one! Welcome back, ' + Wn.name + '!'; });
      }
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', f = activeFake(r, rt), D = r.decoy, Wn = r.winner;
      const lay = te < 0 ? layout(r, rt) : r.final, memOpen = clamp((rt - .6) / .3) * (1 - clamp((rt - .6 - r.M) / .3));
      drawImg('q0', MACH[0] + Math.sin(rt * 2.4) * 16, MACH[1] - Math.abs(Math.sin(rt * 6)) * 10, 200, { rot: Math.sin(rt * 8) * .02 });
      for (const p of r.players) {
        const { x, y } = lay.get(p); p.x = x; p.y = y;
        let open = memOpen, glow = false;
        if (f && f.p === p && te < 0 && memOpen === 0) glow = true;
        if (p === D && te > 0 && !done) { open = 1; glow = !r.plain || te < 1.2; }
        if (p === Wn && te > (r.plain ? 1.2 : 1.8)) { open = 1; glow = true; }
        portal(x, y, open, p.icon, glow, rt, p.purple, p === Wn && te > (r.plain ? 1.2 : 1.8));
        tagC(p.name, x, y + 84, glow);
      }
      // students pop out of portals during the reveal
      if (D && te > .3 && te < (r.plain ? 1.6 : 2.4) && !done) { const o = r.final.get(D); charImg(D.av, !r.plain && te > .6 ? 'crown' : 'choose', o.x, o.y + 60, 150, { alpha: clamp((te - .3) / .3) }); }
      const reveal = r.plain ? 1.2 : 1.8;
      if (te > reveal && !done) {
        const o = r.final.get(Wn);
        charImg(Wn.av, 'dino', o.x, o.y + 60, 160, { alpha: store.settings.calm ? 1 : clamp((te - reveal) / .3 + .3) });
      }
      // the flying robot
      let rx = 800 + Math.sin(rt * .7) * 420, ry = 160 + Math.sin(rt * 2) * 10;
      if (!r.plain && te > 1.1 && !done) { const o = r.final.get(Wn), k = ease(clamp((te - 1.1) / .6)); rx = lerp(rx, o.x, k); ry = lerp(ry, o.y - 130, k); }
      drawImg('q1', rx, ry, 120, { rot: !r.plain && te > 1.1 && te < 1.8 ? (te - 1.1) * 10 : 0 });
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        charImg(Wn.av, 'win', 800, 820, 220 * (.6 + .4 * ease(k)));
        tagC(Wn.name, 800, 844, true);
      }
    },

    idle(t) {
      drawImg('q0', MACH[0], MACH[1], 200);
      SLOTS.forEach(([x, y], i) => portal(x, y, clamp(Math.sin(t * .8 + i * .6) * 2 - .5), ICONS[i], false, t, i % 2 === 1));
      drawImg('q1', 800 + Math.sin(t * .7) * 420, 160 + Math.sin(t * 2) * 10, 120);
    },
    onFinish() { FX.sparkle(800, 650, 40, ['#5df2ff', '#c27cff', '#ffd84a']); },
    winBanner: r => '🏫 ' + r.winner.name + ' is back in class!',
    winPos: () => ({ x: 800, y: 680 })
  };
})();
