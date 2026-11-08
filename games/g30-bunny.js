// Game 30 â€” Golden Carrot Bunny Dash
// Ten bunnies race through a vegetable-garden maze to find the golden carrot; the bunny that brings it back to the basket is picked.
// Twist: the first golden carrot is a balloon and floats out of the garden; a mole pushes the real golden carrot up in front of another bunny.
(() => {
  const BASKET = [1450, 560];
  const ROWS = [330, 430, 530, 630, 730, 830];
  const laneY = (i, n) => 320 + (n > 1 ? i * 480 / (n - 1) : 240);
  const X0 = 150, X1 = 1180;

  function progress(r, p, t) {
    const u = clamp((t - .8) / (r.TW - .8));
    let v = u * p.cap + .02 * Math.sin(t * (2 + p.seed * 2) + p.seed * 7);
    for (const f of r.fakes) if (f.p === p && t > f.at) v += .1 * clamp((t - f.at) / f.dur) * (1 - clamp((t - f.at - f.dur) / 1.5));
    return clamp(v, 0, .98);
  }
  function balloon(x, y, t) {
    ctx.save(); ctx.strokeStyle = '#7a8a9a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.sin(t * 3) * 10, y + 40, x, y + 80); ctx.stroke(); ctx.restore();
    drawImg('p26', x, y - 20, 60, { rot: Math.sin(t * 2) * .2 });
  }

  GAME_IMPL.g30 = {
    id: 'g30', title: 'Golden Carrot Bunny Dash', base: 'assets/g30/', titleY: 230, animals: true, paintedOk: false,
    assets: gAssets(['idle', 'ready', 'bound', 'patch', 'balloon', 'mole', 'win'], ['p0', 'p3', 'p5', 'p6', 'p8', 'p9', 'p10', 'p11', 'p16', 'p17', 'p25', 'p26', 'p48']),
    startBanner: 'ðŸ° Ready, set â€” hop for the golden carrot!', mote: '#fff6c8', rayColor: '#fff2a8',

    setup(r) {
      const n = r.players.length, lanes = shuffle([...Array(n).keys()]);
      r.players.forEach((p, i) => { p.ly = laneY(lanes[i], n); p.cap = .35 + Math.random() * .45; });
      r.winner.cap = .78; if (r.decoy) r.decoy.cap = .9;
      r.fakes = makeFakes(r, 1.2);
    },
    pos(r, p, t) {
      const te = t - r.TW, D = r.decoy, Wn = r.winner, x0 = X0 + progress(r, p, Math.min(t, r.TW)) * (X1 - X0);
      const hop = Math.abs(Math.sin(t * 8 + p.seed * 9)) * 18;
      if (te <= 0) return [x0, p.ly - hop];
      if (p === D) { const k = ease(clamp(te / .6)); return [x0 + k * 60, p.ly]; }
      if (p === Wn) {
        const from = r.plain ? 1.1 : 1.8, k = ease(clamp((te - from) / 1.2));
        return [lerp(x0, BASKET[0] - 60, k), lerp(p.ly, BASKET[1] + 30, k) - Math.abs(Math.sin(k * Math.PI * 3)) * 30];
      }
      return [x0, p.ly];
    },

    tick(r, t, te) {
      const D = r.decoy, Wn = r.winner;
      if (te < -.25 && t > 1.3) {
        const lead = r.players.reduce((a, b) => progress(r, b, t) > progress(r, a, t) ? b : a);
        if (lead !== r.leader && t - (r.leaderAt || 0) > .5) { r.leader = lead; r.leaderAt = t; r.banner = 'ðŸ° Out in front: ' + lead.name; SFX.leader(); }
      }
      if (te < 0 && Math.random() < .05) SFX.tone(600 + Math.random() * 300, .05, { type: 'triangle', vol: .03, to: 900 });
      if (!r.plain) {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D); SFX.sparkle(); r.banner = 'ðŸ¥• ' + D.name + ' grabs a golden carrot!'; });
        if (te > .6) cue('b', () => { outcome('wrong_turn', D); SFX.wheee(); SFX.sadTrombone(); r.banner = 'ðŸŽˆ It\'s a BALLOON â€” and it floats away!'; });
        if (te > 1.1) cue('c', () => { SFX.noise(.4, { vol: .15, f: 300, to: 900 }); r.banner = 'ðŸ•³ï¸ A mole pops upâ€¦'; });
        if (te > 1.6) cue('d', () => { outcome('selected', Wn); SFX.pop(); r.banner = 'ðŸ¥• â€¦and pushes the real golden carrot to ' + Wn.name + '!'; });
      } else {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); r.banner = 'ðŸ¥• ' + (D || Wn).name + ' is diggingâ€¦'; });
        if (te > 1.1) cue('d', () => { outcome('selected', Wn); SFX.pop(); r.banner = 'ðŸ¥• â€¦but ' + Wn.name + ' finds the golden carrot!'; });
      }
      if (te > 2.9) cue('bk', () => { SFX.ding(); FX.sparkle(...BASKET, 26); });
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', D = r.decoy, Wn = r.winner;
      drawImg(done || te > 2.9 ? 'p17' : 'p16', BASKET[0], BASKET[1] + 40, 140, { anchor: 'bottom' });
      // balloon carrot drifting up and the mole
      if (!r.plain && D && te > .1 && !done) {
        const [dx] = this.pos(r, D, rt), k = clamp((te - .6) / 2);
        if (te < .6) drawImg('p25', dx + 40, D.ly - 60, 60); else balloon(dx + 40 + k * 120, D.ly - 60 - k * 700, rt);
      }
      if (te > (r.plain ? .8 : 1.1) && !done) {
        const [wx] = this.pos(r, Wn, r.TW + (r.plain ? 1.1 : 1.8)), k = clamp((te - 1.1) / .3);
        drawImg(['p11', 'p8', 'p9', 'p10'][Math.min(3, Math.floor(k * 4))], wx + 50, Wn.ly + 10, 90, { anchor: 'bottom' });
        if (te > 1.5 && te < (r.plain ? 1.1 : 1.8) + .1) drawImg('p25', wx + 40, Wn.ly - 60 - (te - 1.5) * 20, 70);
      }
      const order = [...r.players].sort((a, b) => a.ly - b.ly);
      for (const p of order) {
        if (done && p === Wn) continue;
        const [x, y] = this.pos(r, p, rt); p.x = x; p.y = y - 40;
        let pose = rt < .8 ? 'ready' : 'bound';
        if (r.leader === p && te < 0) pose = 'patch';
        if (p === D && te > 0) pose = !r.plain && te > .6 ? 'balloon' : 'patch';
        if (p === Wn && te > (r.plain ? 1.1 : 1.8)) pose = 'mole';
        charImg(p.av, pose, x, y + 8, 92);
        if (p === Wn && te > (r.plain ? 1.1 : 1.8)) drawImg('p25', x + 34, y - 50, 54);
        tagC(p.name, x - 100, y - 14, (r.leader === p && te < 0) || (p === Wn && te > 1.6));
      }
      // king bunny referee
      let kp = 'p0';
      if (rt < 1) kp = 'p3'; else if (!r.plain && te > .6 && te < 1.6) kp = 'p6'; else if (done) kp = 'p5';
      drawImg(kp, 1500, 300, 130, { anchor: 'bottom' });
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        drawImg('p48', BASKET[0] - 60, BASKET[1] - 80, 260, { alpha: .7 });
        charImg(Wn.av, 'win', BASKET[0] - 60, BASKET[1] + 40, 190 * (.6 + .4 * ease(k)));
        tagC(Wn.name, BASKET[0] - 60, BASKET[1] + 64, true);
      }
    },

    idle(t) {
      drawImg('p16', BASKET[0], BASKET[1] + 40, 140, { anchor: 'bottom' });
      for (let i = 0; i < 10; i++) charImg(i, 'bound', X0 + ((t * 45 + i * 101) % (X1 - X0)), laneY(i, 10) - Math.abs(Math.sin(t * 8 + i)) * 18 + 8, 92);
      drawImg('p0', 1500, 300, 130, { anchor: 'bottom' });
    },
    onFinish() { FX.sparkle(BASKET[0] - 60, BASKET[1] - 100, 36, ['#ffd84a', '#ff9f43', '#ffffff']); },
    winBanner: r => 'ðŸ¥• ' + r.winner.name + ' brings home the golden carrot!',
    winPos: () => ({ x: BASKET[0] - 60, y: BASKET[1] - 60 })
  };
})();
