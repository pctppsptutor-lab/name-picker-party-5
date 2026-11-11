// Game 29 — Give Me My Snack! (chain reaction)
// Students set off a cut-away vending machine: a coin turns a coil, pushes a capsule down a chute, over a seesaw and a lever,
// and it drops into one of ten trays.
// Twist: the first capsule gets stuck on the seesaw and sends a false signal; a can with legs kicks a spare lever and the real capsule drops.
(() => {
  const MACH = [260, 440];
  const PATH = [[300, 200], [420, 220], [520, 300], [600, 300], [700, 360], [800, 360], [880, 420], [960, 470]];   // coil → chute → seesaw → lever
  const SEESAW = [650, 330], LEVER = [880, 440];
  const TRAYS = [...Array(10).keys()].map(i => [1110 + (i % 2) * 190, 150 + Math.floor(i / 2) * 140]);
  const KIDS = [...Array(10).keys()].map(i => [130 + i * 120, 860]);
  const CAPS = ['p8', 'p9', 'p10', 'p11'];

  function along(pts, k) {
    let L = 0; const seg = [];
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
    let d = clamp(k) * L;
    for (let i = 0; i < seg.length; i++) { if (d <= seg[i]) { const u = d / seg[i]; return [lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u)]; } d -= seg[i]; }
    return pts[pts.length - 1];
  }
  const toTray = c => [...PATH, [TRAYS[c][0] - 60, TRAYS[c][1] - 10], TRAYS[c]];
  function contraption(t, tilt, pull) {
    ctx.save(); ctx.strokeStyle = '#7f8c99'; ctx.lineWidth = 5;                             // coil
    ctx.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40; ctx.lineTo(300 + u * 120 + Math.sin(u * Math.PI * 10 + t * 4) * 0, 200 + Math.sin(u * Math.PI * 10 + t * 6) * 14); } ctx.stroke();
    ctx.strokeStyle = '#c9d2dc'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(420, 230); ctx.lineTo(560, 300); ctx.stroke();   // chute
    ctx.translate(...SEESAW); ctx.rotate(tilt); ctx.fillStyle = '#ffb347'; ctx.fillRect(-80, -6, 160, 12); ctx.restore();
    ctx.save(); ctx.fillStyle = '#7f8c99'; ctx.beginPath(); ctx.moveTo(SEESAW[0] - 16, SEESAW[1] + 30); ctx.lineTo(SEESAW[0] + 16, SEESAW[1] + 30); ctx.lineTo(SEESAW[0], SEESAW[1] + 4); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(...LEVER); ctx.rotate(-.5 + pull); ctx.fillStyle = '#ff6f6f'; ctx.fillRect(-4, -60, 8, 60); ctx.beginPath(); ctx.arc(0, -64, 12, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  function can(x, y, t, legs) {
    if (legs) { ctx.save(); ctx.strokeStyle = '#3d566e'; ctx.lineWidth = 5; ctx.lineCap = 'round'; [-10, 10].forEach((dx, i) => { const s = Math.sin(t * 20 + i * Math.PI) * 10; ctx.beginPath(); ctx.moveTo(x + dx, y + 26); ctx.lineTo(x + dx + s, y + 50); ctx.stroke(); }); ctx.restore(); }
    drawImg('p27', x, y, 60);
  }

  GAME_IMPL.g29 = {
    id: 'g29', title: 'Give Me My Snack!', base: 'assets/g29/', titleY: 640,
    assets: gAssets(['coin', 'coil', 'slide', 'lever', 'stuck', 'kick', 'win'], [...CAPS, 'p0', 'p1', 'p12', 'p27']),
    startBanner: '🪙 Coin in — let\'s see what drops!', mote: '#f0e6ff', rayColor: '#fff2a8',

    setup(r) {
      const trays = shuffle([...Array(10).keys()]);
      r.players.forEach((p, i) => { p.tray = trays[i]; [p.kx, p.ky] = KIDS[i]; p.x = p.kx; p.y = p.ky - 80; });
      r.fakes = makeFakes(r, 1.6);
      r.runs = r.fakes.map((f, j) => ({ cap: CAPS[j % 4], to: f.p.tray, p: f.p, at: f.at - 1.4, dur: 1.7 }));
      r.goldAt = r.TW - 2;
    },

    tick(r, t, te) {
      const D = r.decoy, Wn = r.winner;
      for (const run of r.runs) {
        if (t > run.at) cue('c' + run.at, () => { SFX.tone(1800, .08, { type: 'triangle', vol: .08 }); SFX.tone(1400, .1, { type: 'triangle', vol: .06, delay: .06 }); });
        if (t > run.at + run.dur) cue('in' + run.at, () => { SFX.boing(); r.banner = '🎁 A capsule lands in ' + run.p.name + "'s tray… and bounces out!"; });
      }
      if (t > r.goldAt) cue('gold', () => { SFX.sparkle(); r.banner = '✨ The golden capsule starts rolling!'; });

      if (!r.plain) {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D); r.banner = '🎁 Heading for ' + D.name + "'s tray…"; });
        if (te > .4) cue('b', () => { outcome('wrong_turn', D); SFX.sadTrombone(); [0, .25].forEach(d => SFX.tone(660, .2, { type: 'square', vol: .07, delay: d })); r.banner = '😤 Stuck on the seesaw! False signal!'; });
        if (te > 1) cue('c', () => { CAM.shake(r, 8); SFX.boing(); r.banner = '🥫 A can with legs kicks the spare lever!'; });
        if (te > 1.4) cue('d', () => { outcome('selected', Wn); SFX.wheee(); r.banner = '🎁 The capsule drops towards ' + Wn.name + '!'; });
      } else {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); r.banner = '🎁 Will it be ' + (D || Wn).name + '?'; });
        if (te > 1) cue('d', () => { outcome('selected', Wn); SFX.boing(); r.banner = '⚙️ The lever flips it another way!'; });
      }
      if (te > 2.9) cue('drop', () => { SFX.ding(); FX.sparkle(...TRAYS[Wn.tray], 26); });
    },

    ball(r, t) {
      const te = t - r.TW, D = r.decoy || r.winner, Wn = r.winner;
      if (t < r.goldAt) return null;
      if (te < 0) return along(PATH.slice(0, 4), (t - r.goldAt) / (r.TW - r.goldAt));
      if (!r.plain) {
        if (te < 1.4) return [SEESAW[0] + 30 + Math.sin(te * 30) * 2, SEESAW[1] - 18];
        return along([[SEESAW[0] + 30, SEESAW[1] - 18], ...PATH.slice(4), [TRAYS[Wn.tray][0] - 60, TRAYS[Wn.tray][1] - 10], TRAYS[Wn.tray]], ease(clamp((te - 1.4) / 1.5)));
      }
      if (te < 1) return along(PATH.slice(3), te);
      return along([PATH[PATH.length - 1], TRAYS[Wn.tray]], ease(clamp((te - 1) / 1.9)));
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', D = r.decoy, Wn = r.winner;
      const stuck = !r.plain && te > .4 && te < 1.4;
      const mHop = Math.abs(Math.sin(rt * 9)) * 10;
      drawImg(done ? 'p0' : te > .4 && te < 1.4 && !r.plain ? 'p1' : 'p0', MACH[0] + Math.sin(rt * 3) * 12, MACH[1] + 120 - mHop, 260, { rot: Math.sin(rt * 14) * .025 });
      contraption(rt, stuck ? Math.sin(rt * 20) * .05 : Math.sin(rt * 2) * .15, !r.plain && te > 1 ? Math.min(1, (te - 1) * 3) : 0);
      for (const p of r.players) {
        const [x, y] = TRAYS[p.tray], lit = (p === Wn && te > 2.9) || done;
        if (lit) FX.halo(x, y, 70, '#ffd84a', .6);
        ctx.save(); ctx.fillStyle = '#3d566e'; roundRect(ctx, x - 60, y + 10, 120, 24, 8); ctx.fill(); ctx.restore();
        if (lit) drawImg('p12', x, y + 12, 70, { anchor: 'bottom' });
        tagC(p.name, x + 100, y + 20, lit || (stuck && p === D));
      }
      for (const run of r.runs) { const k = (rt - run.at) / run.dur; if (k >= 0 && k <= 1) drawImg(run.cap, ...along(toTray(run.to), k), 36); }
      const b = !done && this.ball(r, rt);
      if (b) { FX.halo(b[0], b[1], 30, '#ffd84a', .6); drawImg('p10', b[0], b[1], 44); }
      if (!r.plain && te > .7 && te < 1.6 && !done) { const k = ease(clamp((te - .7) / .3)); can(lerp(1020, LEVER[0] + 50, k), LEVER[1] + 10, rt, true); }
      else if (!done) can(980 + Math.sin(rt * 2) * 55, LEVER[1] + 10, rt, true);
      for (const p of r.players) {
        if (done && p === Wn) continue;
        let pose = 'coin';
        if (r.runs.some(run => run.p === p && rt > run.at && rt < run.at + run.dur)) pose = 'slide';
        if (rt > r.goldAt && te < 0) pose = 'coil';
        if (p === D && te > 0) pose = !r.plain && te > .4 ? 'stuck' : 'lever';
        if (p === Wn && te > (r.plain ? 1 : 1.4)) pose = 'kick';
        charImg(p.av, pose, p.kx, p.ky, 120);
        tagC(p.name, p.kx, p.ky + 20, p === Wn && te > 1.4);
      }
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        charImg(Wn.av, 'win', 800, 820, 230 * (.6 + .4 * ease(k)));
        tagC(Wn.name, 800, 844, true);
      }
      Wn.x = b ? b[0] : TRAYS[Wn.tray][0]; Wn.y = b ? b[1] : TRAYS[Wn.tray][1];
    },

    idle(t) {
      drawImg('p0', MACH[0] + Math.sin(t * 2.5) * 10, MACH[1] + 120 - Math.abs(Math.sin(t * 8)) * 8, 260, { rot: Math.sin(t * 12) * .02 });
      contraption(t, Math.sin(t * 2) * .15, 0);
      can(980 + Math.sin(t * 2) * 55, LEVER[1] + 10, t, true);
      TRAYS.forEach(([x, y]) => { ctx.save(); ctx.fillStyle = '#3d566e'; roundRect(ctx, x - 60, y + 10, 120, 24, 8); ctx.fill(); ctx.restore(); });
      const k = (t * .4) % 1; drawImg(CAPS[Math.floor(t * .4) % 4], ...along(toTray(Math.floor(t * .4) % 10), k), 36);
      KIDS.forEach(([x, y], i) => charImg(i, 'coin', x, y, 120));
    },
    onFinish(r) { FX.sparkle(...TRAYS[r.winner.tray], 40, ['#ffd84a', '#ff9fc4', '#7cf7ff']); },
    winBanner: r => '🎉 The prize drops for ' + r.winner.name + '!',
    winPos: () => ({ x: 800, y: 700 })
  };
})();
