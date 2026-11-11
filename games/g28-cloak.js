// Game 28 — Peekaboo, Wizard! (following clues)
// Ten students hide under invisibility cloaks. A scanner shows footprints, then a shadow, then something moving;
// follow the chain of clues to find the one who is picked.
// Twist: the first footprints lead to a potted plant wearing shoes; a hiccup makes the real cloak shimmer and its shadow points to the winner.
(() => {
  const XS = [210, 440, 670, 900, 1130];
  const SPOTS = [...XS.map(x => [x, 500]), ...XS.map(x => [x, 790])];
  const START = [800, 880], MASCOT = [1450, 520];

  // glowing footprints from START to a student
  function prints(to, k, alpha = 1) {
    const n = 12;
    ctx.save(); ctx.fillStyle = '#ffd84a'; ctx.shadowColor = '#ffd84a'; ctx.shadowBlur = 10;
    for (let i = 1; i <= Math.floor(n * k); i++) {
      const u = i / n, x = lerp(START[0], to[0], u), y = lerp(START[1], to[1] + 20, u) - Math.sin(u * Math.PI) * 60;
      const a = Math.atan2(to[1] - START[1], to[0] - START[0]), side = i % 2 ? 1 : -1;
      ctx.globalAlpha = alpha * (.4 + .6 * u);
      ctx.save(); ctx.translate(x + Math.cos(a + Math.PI / 2) * 9 * side, y + Math.sin(a + Math.PI / 2) * 9 * side); ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(10, 0, 4, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }
  function plant(x, y) {                                        // a potted plant in sneakers, drawn in code
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#c96a4a'; ctx.beginPath(); ctx.moveTo(-30, -60); ctx.lineTo(30, -60); ctx.lineTo(22, -10); ctx.lineTo(-22, -10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3fa34d'; [[-20, -100], [0, -120], [20, -100], [-8, -84], [12, -84]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.ellipse(dx, dy, 14, 24, dx * .02, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#ff6f6f'; ctx.lineWidth = 3;
    [-16, 16].forEach(dx => { ctx.beginPath(); ctx.ellipse(dx, -2, 16, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
    ctx.restore();
  }

  GAME_IMPL.g28 = {
    id: 'g28', title: 'Peekaboo, Wizard!', base: 'assets/g28/', titleY: 260,
    assets: gAssets(['ready', 'gone', 'foot', 'shadow', 'hiccup', 'win'], ['p0', 'p10', 'p19']),
    startBanner: '🫥 Everyone vanishes under their cloaks…', mote: '#e6d6ff', rayColor: '#e6ccff',

    setup(r) {
      const slots = spread(r.players.length);
      r.players.forEach((p, i) => { [p.sx, p.sy] = SPOTS[slots[i]]; p.x = p.sx; p.y = p.sy - 90; });
      r.fakes = makeFakes(r, 1.8);
    },

    tick(r, t, te) {
      const f = activeFake(r, t), D = r.decoy, Wn = r.winner;
      if (t > .9) cue('van', () => { SFX.sparkle(); r.banner = '✨ Poof! Everyone is invisible…'; });
      if (f && te < 0) cue('fk' + f.at, () => { SFX.tone(1100, .15, { type: 'square', vol: .04, to: 1500 }); r.banner = ['👣 Footprints lead to ', '🌑 A shadow moves near ', '🔍 Something wiggles by '][Math.floor(f.at) % 3] + f.p.name + '…'; });
      if (!r.plain) {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D); r.banner = '👣 The footprints stop at ' + D.name + '…'; });
        if (te > .6) cue('b', () => { outcome('wrong_turn', D); SFX.sadTrombone(); r.banner = '🪴 It\'s a potted plant wearing shoes!'; });
        if (te > 1.1) cue('c', () => { CAM.shake(r, 9); SFX.tone(400, .15, { type: 'square', vol: .1, to: 900 }); r.banner = '😮 *HIC!* A cloak shimmers…'; });
        if (te > 1.7) cue('d', () => { outcome('selected', Wn); SFX.sparkle(); r.banner = '🌑 …its shadow points to ' + Wn.name + '!'; });
      } else {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); r.banner = '👣 Do the footprints end at ' + (D || Wn).name + '?'; });
        if (te > 1.2) cue('d', () => { outcome('selected', Wn); SFX.boing(); r.banner = '👣 …no, they keep going to ' + Wn.name + '!'; });
      }
      if (te > 2.5) cue('rev', () => { SFX.ding(); FX.sparkle(Wn.sx, Wn.sy - 100, 26, ['#c27cff', '#7cf7ff']); });
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', f = activeFake(r, rt), D = r.decoy, Wn = r.winner;
      const hidden = clamp((rt - .7) / .6);                                   // 0 = visible, 1 = invisible
      for (const p of r.players) {
        if (done && p === Wn) continue;
        let pose = hidden < 1 ? 'ready' : 'gone', a = 1 - hidden * .85;
        if (f && f.p === p && te < 0) { pose = ['foot', 'shadow', 'foot'][Math.floor(f.at) % 3]; a = .5; }
        if (p === D && te > .6 && !r.plain) { plant(p.sx, p.sy); tagC(p.name, p.sx, p.sy + 22, true); continue; }
        if (p === Wn && te > (r.plain ? 1.2 : 1.1)) { pose = te > 1.7 ? 'hiccup' : 'shadow'; a = clamp(.4 + (te - 1.1)); }
        ctx.save(); ctx.globalAlpha = .25 * (1 - a); ctx.fillStyle = '#c27cff'; ctx.beginPath(); ctx.ellipse(p.sx, p.sy - 70, 40 + Math.sin(rt * 3 + p.seed * 9) * 4, 70, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        charImg(p.av, pose, p.sx, p.sy, 150, { alpha: Math.max(.12, a) });
        tagC(p.name, p.sx, p.sy + 22, (f && f.p === p && te < 0) || (p === Wn && te > 1.7));
      }
      // clue trails
      if (f && te < 0) prints([f.p.sx, f.p.sy], clamp((rt - f.at) / (f.dur * .7)), 1 - clamp((rt - f.at - f.dur * .7) / (f.dur * .3)));
      if (te > 0 && te < (r.plain ? 1.5 : 1.3) && !done) prints([(D || Wn).sx, (D || Wn).sy], clamp(te / .5));
      if (!r.plain && te > 1.7 && !done) {
        ctx.save(); ctx.globalAlpha = .45; ctx.fillStyle = '#1c1238';
        const k = ease(clamp((te - 1.7) / .5)); ctx.beginPath(); ctx.moveTo(Wn.sx - 30, Wn.sy); ctx.lineTo(Wn.sx + 30, Wn.sy); ctx.lineTo(lerp(Wn.sx, START[0], k * .5) + 20, lerp(Wn.sy, START[1], k * .5)); ctx.lineTo(lerp(Wn.sx, START[0], k * .5) - 20, lerp(Wn.sy, START[1], k * .5)); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      if (r.plain && te > 1.2 && !done) prints([Wn.sx, Wn.sy], clamp((te - 1.2) / .6));
      // chameleon wizard patrols with his scanner orb
      const mx = MASCOT[0] - 35 + Math.sin(rt * 1.4) * 55, my = MASCOT[1] + Math.cos(rt * 1.8) * 75 - Math.abs(Math.sin(rt * 5.5)) * 12;
      drawImg('p19', mx, my, 200, { flip: Math.cos(rt * 1.4) > 0 });
      drawImg('p10', mx - 70, my - 160 + Math.sin(rt * 4) * 10, 80, { alpha: .7 + .3 * Math.sin(rt * 5) });
      Wn.x = Wn.sx; Wn.y = Wn.sy - 90;
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        drawImg('p0', Wn.sx, Wn.sy - 90, 240, { alpha: .7 });
        charImg(Wn.av, 'win', Wn.sx, Wn.sy, 220 * (.6 + .4 * ease(k)));
        tagC(Wn.name, Wn.sx, Wn.sy + 24, true);
      }
    },

    idle(t) {
      SPOTS.forEach(([x, y], i) => charImg(i, Math.sin(t + i) > 0 ? 'ready' : 'gone', x, y, 150, { alpha: .4 + .6 * Math.abs(Math.sin(t * .6 + i)) }));
      const mx = MASCOT[0] - 35 + Math.sin(t * 1.3) * 55, my = MASCOT[1] + Math.cos(t * 1.7) * 70 - Math.abs(Math.sin(t * 5)) * 10;
      drawImg('p19', mx, my, 200, { flip: Math.cos(t * 1.3) > 0 });
      drawImg('p10', mx - 70, my - 160 + Math.sin(t * 4) * 10, 80, { alpha: .8 });
    },
    onFinish(r) { FX.sparkle(r.winner.sx, r.winner.sy - 150, 40, ['#c27cff', '#7cf7ff', '#ffd84a']); },
    winBanner: r => '🫥 Found you, ' + r.winner.name + '!',
    winPos: r => ({ x: r.winner.sx, y: r.winner.sy - 130 })
  };
})();
