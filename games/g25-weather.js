// Game 25 — The Weather Machine Has a Cold
// Ten students stand under ten little clouds. The weather machine runs through sun, rain and snow,
// then makes a rainbow over the one who is picked.
// Twist: the first rainbow sneezes and turns into a scarf; a sunbeam bounces off a mirror onto the real winner.
(() => {
  const XS = [190, 410, 630, 850, 1070];
  const SPOTS = [...XS.map(x => [x, 500]), ...XS.map(x => [x, 800])];
  const MACH = [1420, 520], MIRROR = [1420, 200];
  const cloudAt = p => [p.sx, p.sy - 220];

  function scarf(x, y, k, t) {                                   // a striped scarf, drawn in code
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 3) * .1); ctx.globalAlpha = k;
    const cols = ['#ff6f6f', '#ffd84a', '#7cff9b', '#7cd0ff', '#b48cff'];
    for (let i = 0; i < 10; i++) { ctx.fillStyle = cols[i % 5]; ctx.fillRect(-90 + i * 18, -10 + Math.sin(i + t * 4) * 4, 18, 20); }
    ctx.fillStyle = cols[0]; ctx.fillRect(80, 0, 16, 60); ctx.restore();
  }

  GAME_IMPL.g25 = {
    id: 'g25', title: 'Cloud Goes Achoo!', base: 'assets/g25/', titleY: 380,
    assets: gAssets(['idle', 'ready', 'action', 'almost', 'fake', 'twist', 'win'], ['p0', 'p1', 'p2', 'p10', 'p12', 'p13', 'p14', 'p16', 'p22', 'p26', 'p33', 'p39']),
    startBanner: '🌦️ The weather machine sputters to life…', mote: '#eaf6ff', rayColor: '#fff2a8',

    setup(r) {
      const slots = spread(r.players.length);
      r.players.forEach((p, i) => { [p.sx, p.sy] = SPOTS[slots[i]]; p.x = p.sx; p.y = p.sy - 90; });
      r.ph = [r.TW * .3, r.TW * .6];                               // sun → rain → snow
      r.fakes = makeFakes(r, 1.2);
    },
    weather: (r, t) => t < r.ph[0] ? 'sun' : t < r.ph[1] ? 'rain' : 'snow',

    tick(r, t, te) {
      const f = activeFake(r, t), D = r.decoy, Wn = r.winner, w = this.weather(r, t);
      if (te < 0) cue('w' + w, () => { SFX.swoosh(); r.banner = { sun: '☀️ Sunshine for everyone!', rain: '🌧️ Uh-oh, here comes the rain…', snow: '❄️ Brrr — snow!' }[w]; });
      if (f && te < 0) cue('fk' + f.at, () => { SFX.leader(); r.banner = '🌈 A rainbow peeks over ' + f.p.name + '…'; });
      if (!r.plain) {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D); SFX.sparkle(); r.banner = '🌈 A rainbow over ' + D.name + '!'; });
        if (te > .6) cue('b', () => { outcome('wrong_turn', D); CAM.shake(r, 10); r.banner = '🤧 ACHOO! The rainbow turns into a scarf!'; });
        if (te > 1.2) cue('c', () => { SFX.tone(1400, .4, { vol: .08, to: 2000 }); r.banner = '☀️ A sunbeam bounces off the mirror…'; });
        if (te > 1.8) cue('d', () => { outcome('selected', Wn); SFX.sparkle(); r.banner = '🌈 …and lands on ' + Wn.name + '!'; });
      } else {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); r.banner = '🌈 Is the rainbow for ' + (D || Wn).name + '?'; });
        if (te > 1.2) cue('d', () => { outcome('selected', Wn); SFX.boing(); r.banner = '🌈 …it floats over to ' + Wn.name + '!'; });
      }
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', f = activeFake(r, rt), D = r.decoy, Wn = r.winner, w = this.weather(r, rt);
      // the machine chugs and its sneezy cloud mascot floats across the sky
      let mp = 'p12';
      if (te < 0) mp = w === 'sun' ? 'p12' : w === 'rain' ? 'p13' : 'p14';
      if (done) mp = 'p16';
      const mx = MACH[0] + Math.sin(rt * 3) * 18, my = MACH[1] - Math.abs(Math.sin(rt * 8)) * 10;
      drawImg(mp, mx, my, 220, { rot: Math.sin(rt * 10) * .025 });
      let cp = 'p1';
      if (!r.plain && te > .3 && te < 1.2) cp = 'p2';
      if (done) cp = 'p10'; else if (te < 0 && w === 'snow') cp = 'p0';
      drawImg(cp, MACH[0] - 80 + Math.sin(rt * 1.5) * 140, MACH[1] - 190 + Math.sin(rt * 3.5) * 18, 150, { flip: Math.cos(rt * 1.5) > 0 });
      drawImg('p39', ...MIRROR, 70, { alpha: !r.plain && te > 1.2 && te < 2.4 ? 1 : .5 });
      for (const p of r.players) {
        const [cx, cy] = cloudAt(p);
        // each student's little cloud with this phase's weather
        drawImg(w === 'sun' && te < 0 ? 'p22' : 'p26', cx, cy, 90, { alpha: .95 });
        if (te < 0 && w === 'rain') FX.every(r, 'rn' + p.sx + p.sy, .12, () => FX.splash(cx + (Math.random() - .5) * 50, cy + 30, 1));
        if (te < 0 && w === 'snow') FX.every(r, 'sn' + p.sx + p.sy, .2, () => FX.glitter(cx + (Math.random() - .5) * 60, cy + 40, 1, ['#ffffff']));
        if (done && p === Wn) continue;
        let pose = rt < .8 ? 'ready' : 'idle';
        if (te < 0 && w !== 'sun') pose = 'action';
        if (f && f.p === p && te < 0) pose = 'almost';
        if (p === D && te > 0) pose = !r.plain && te > .6 ? 'twist' : 'fake';
        if (p === Wn && te > (r.plain ? 1.2 : 1.8)) pose = 'almost';
        charImg(p.av, pose, p.sx, p.sy, 150);
        tagC(p.name, p.sx, p.sy + 22, (f && f.p === p && te < 0) || (p === Wn && te > 1.8));
      }
      // rainbows: teasing, decoy, winner
      if (f && te < 0) { const [cx, cy] = cloudAt(f.p); drawImg('p33', cx, cy + 40, 140, { alpha: Math.sin(clamp((rt - f.at) / f.dur) * Math.PI) }); }
      if (D && te > 0 && te < (r.plain ? 1.4 : .6)) { const [cx, cy] = cloudAt(D); drawImg('p33', cx, cy + 40, 150); }
      if (!r.plain && D && te > .6 && !done) { const [cx, cy] = cloudAt(D); scarf(cx, cy + 60 + clamp(te - .6) * 60, clamp((te - .6) / .3), rt); }
      if (!r.plain && te > 1.2 && te < 2.4 && !done) {                       // the sunbeam: machine → mirror → winner
        const k = clamp((te - 1.2) / .6), [wx, wy] = cloudAt(Wn);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#fff3a0'; ctx.lineWidth = 10; ctx.globalAlpha = .7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(MACH[0], MACH[1] - 120); ctx.lineTo(...MIRROR);
        if (k > .4) { const k2 = (k - .4) / .6; ctx.lineTo(lerp(MIRROR[0], wx, k2), lerp(MIRROR[1], wy, k2)); } ctx.stroke(); ctx.restore();
      }
      if (te > (r.plain ? 1.2 : 1.8) && !done) { const [cx, cy] = cloudAt(Wn); drawImg('p33', cx, cy + 40, 170 * clamp((te - 1.8) / .4 + .2)); FX.halo(Wn.sx, Wn.sy - 80, 90, '#fff3a0', .5); }
      Wn.x = Wn.sx; Wn.y = Wn.sy - 90;
      if (done) {
        const k = clamp((rt - r.doneAt) / .4), [cx, cy] = cloudAt(Wn);
        drawImg('p33', cx, cy + 30, 230);
        charImg(Wn.av, 'win', Wn.sx, Wn.sy, 220 * (.6 + .4 * ease(k)));
        tagC(Wn.name, Wn.sx, Wn.sy + 24, true);
      }
    },

    idle(t) {
      drawImg('p12', MACH[0] + Math.sin(t * 2.5) * 16, MACH[1] - Math.abs(Math.sin(t * 7)) * 8, 220, { rot: Math.sin(t * 8) * .02 });
      drawImg('p1', MACH[0] - 80 + Math.sin(t * 1.4) * 140, MACH[1] - 190 + Math.sin(t * 3.2) * 16, 150, { flip: Math.cos(t * 1.4) > 0 });
      SPOTS.forEach(([x, y], i) => { drawImg(i % 3 ? 'p26' : 'p22', x, y - 220, 90); charImg(i, 'idle', x, y, 150); });
    },
    onFinish(r) { FX.sparkle(r.winner.sx, r.winner.sy - 180, 40, ['#ff6f6f', '#ffd84a', '#7cff9b', '#7cd0ff', '#b48cff']); },
    winBanner: r => '🌈 The rainbow belongs to ' + r.winner.name + '!',
    winPos: r => ({ x: r.winner.sx, y: r.winner.sy - 130 })
  };
})();
