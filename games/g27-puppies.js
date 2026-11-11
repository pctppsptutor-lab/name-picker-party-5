// Game 27 — Puppy Pool Race
// Ten puppies paddle along a soft obstacle course of rings, floating bridges and water balls;
// the puppy that reaches the golden bone platform is picked.
// Twist: the leading puppy gets busy chasing its tail on a ring float; a float gate swings open and carries another puppy to the platform.
(() => {
  const X0 = 170, X1 = 1220, GOAL = [1440, 530];
  const laneY = (i, n) => 330 + (n > 1 ? i * 440 / (n - 1) : 220);
  const OBST = [[420, 'p7'], [700, 'p8'], [980, 'p9']];               // hurdle bars across all lanes
  const FLOATS = ['p1', 'p2', 'p3', 'p14', 'p29'];

  function progress(r, p, t) {
    const u = clamp((t - .8) / (r.TW - .8));
    let v = u * p.cap + .02 * Math.sin(t * (1.6 + p.seed * 2) + p.seed * 7);
    for (const f of r.fakes) if (f.p === p && t > f.at) v += .1 * clamp((t - f.at) / f.dur) * (1 - clamp((t - f.at - f.dur) / 1.5));
    return clamp(v, 0, .98);
  }

  GAME_IMPL.g27 = {
    id: 'g27', title: 'Puppy Pool Race', base: 'assets/g27/', titleY: 230, animals: true,
    assets: gAssets(['idle', 'ready', 'swim', 'bridge', 'tail', 'win'], ['p7', 'p8', 'p9', 'p10', 'p13', 'p22', 'p27', 'p30', ...FLOATS]),
    startBanner: '🐶 Splash! The puppies dive in!', mote: '#e8fbff', rayColor: '#fff2a8',

    setup(r) {
      const n = r.players.length, lanes = shuffle([...Array(n).keys()]);
      r.players.forEach((p, i) => { p.ly = laneY(lanes[i], n); p.cap = .35 + Math.random() * .45; });
      r.winner.cap = .8; if (r.decoy) r.decoy.cap = .9;
      r.fakes = makeFakes(r, 1.2);
    },
    pos(r, p, t) {
      const te = t - r.TW, D = r.decoy, Wn = r.winner, x0 = X0 + progress(r, p, Math.min(t, r.TW)) * (X1 - X0);
      if (te <= 0) return [x0, p.ly, 0];
      if (p === D && !r.plain) return [x0 + 20 + Math.cos(te * 6) * 30, p.ly + Math.sin(te * 6) * 14, te * 6];      // spinning on a ring
      if (p === D && r.plain) return [lerp(x0, GOAL[0] - 160, ease(clamp(te / 1))), lerp(p.ly, GOAL[1] - 70, ease(clamp(te / 1))), 0];
      if (p === Wn) { const from = r.plain ? 1.1 : 1.6, k = ease(clamp((te - from) / 1.3)); return [lerp(x0, GOAL[0] - 30, k), lerp(p.ly, GOAL[1] + 10, k) - Math.sin(k * Math.PI) * 30, 0]; }
      return [x0 + te * 10, p.ly, 0];
    },

    tick(r, t, te) {
      const D = r.decoy, Wn = r.winner;
      if (te < -.25 && t > 1.3) {
        const lead = r.players.reduce((a, b) => progress(r, b, t) > progress(r, a, t) ? b : a);
        if (lead !== r.leader && t - (r.leaderAt || 0) > .5) { r.leader = lead; r.leaderAt = t; r.banner = '🐶 In the lead: ' + lead.name; SFX.leader(); }
      }


      if (!r.plain) {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D); r.banner = '🐶 ' + D.name + ' is nearly at the bone…'; });
        if (te > .5) cue('b', () => { outcome('wrong_turn', D); SFX.wheee(); SFX.sadTrombone(); r.banner = '🌀 …but stops to chase its own tail!'; });
        if (te > 1.1) cue('c', () => { SFX.swoosh(); r.banner = '🚪 A float gate swings open…'; });
        if (te > 1.6) cue('d', () => { outcome('selected', Wn); SFX.splash(); r.banner = '🐕 …and ' + Wn.name + ' zooms through!'; });
      } else {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); r.banner = '🐶 ' + (D || Wn).name + ' paddles hard…'; });
        if (te > 1.1) cue('d', () => { outcome('selected', Wn); SFX.boing(); r.banner = '💨 …but ' + Wn.name + ' surfs past!'; });
      }
      if (te > 2.9) cue('in', () => { SFX.ding(); FX.splash(...GOAL, 20); });
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', D = r.decoy, Wn = r.winner;
      for (const [x, im] of OBST) for (let y = 330; y <= 770; y += 110) drawImg(im, x, y + 20, 90, { alpha: .9 });
      drawImg('p30', GOAL[0] - 40, GOAL[1] + 50, 200, { alpha: .6 });
      ctx.save(); ctx.fillStyle = '#ffd84a'; roundRect(ctx, GOAL[0] - 80, GOAL[1] - 10, 160, 50, 14); ctx.fill(); ctx.restore();
      drawImg('p22', GOAL[0], GOAL[1] - 10, 90, { anchor: 'bottom' });
      // the float gate swinging open in front of the winner
      if (!r.plain && te > 1.1 && !done) { const [x] = this.pos(r, Wn, r.TW + 1.6), k = ease(clamp((te - 1.1) / .5)); drawImg('p10', x + 60, Wn.ly + 10, 120, { rot: k * 1.2 }); }
      const order = [...r.players].sort((a, b) => a.ly - b.ly);
      for (const p of order) {
        if (done && p === Wn) continue;
        const [x, y, rot] = this.pos(r, p, rt); p.x = x; p.y = y - 40;
        let pose = rt < .8 ? 'ready' : 'swim';
        if (te < 0 && OBST.some(([ox]) => Math.abs(x - ox) < 40)) pose = 'bridge';
        if (p === D && te > 0) pose = !r.plain && te > .5 ? 'tail' : 'swim';
        if (p === Wn && te > 2.9) pose = 'idle';
        if (pose === 'swim') FX.every(r, 'w' + p.ly, .25, () => FX.splash(x - 40, y + 4, 1));
        charImg(p.av, pose, x, y + 6, 88, { rot: p === D && !r.plain && te > .5 ? Math.sin(rt * 10) * .12 : 0 });
        tagC(p.name, x - 100, y - 14, (r.leader === p && te < 0) || (p === Wn && te > 1.6));
      }
      // otter lifeguard patrols along the poolside
      drawImg(te > .5 && te < 1.6 && !r.plain ? 'p27' : 'p13', 1475 + Math.sin(rt * 1.6) * 35, 310 + Math.cos(rt * 1.3) * 70 - Math.abs(Math.sin(rt * 6)) * 14, 150, { anchor: 'bottom', flip: te > 1.6 || Math.cos(rt * 1.6) > 0 });
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        charImg(Wn.av, 'win', GOAL[0], GOAL[1] + 20, 190 * (.6 + .4 * ease(k)));
        tagC(Wn.name, GOAL[0], GOAL[1] + 44, true);
      }
    },

    idle(t) {
      for (const [x, im] of OBST) for (let y = 330; y <= 770; y += 110) drawImg(im, x, y + 20, 90, { alpha: .9 });
      ctx.save(); ctx.fillStyle = '#ffd84a'; roundRect(ctx, GOAL[0] - 80, GOAL[1] - 10, 160, 50, 14); ctx.fill(); ctx.restore();
      drawImg('p22', GOAL[0], GOAL[1] - 10, 90, { anchor: 'bottom' });
      for (let i = 0; i < 10; i++) charImg(i, 'swim', X0 + ((t * 40 + i * 97) % (X1 - X0)), laneY(i, 10) + 6, 88);
      drawImg('p13', 1475 + Math.sin(t * 1.5) * 35, 310 + Math.cos(t * 1.2) * 65 - Math.abs(Math.sin(t * 5.5)) * 12, 150, { anchor: 'bottom', flip: Math.cos(t * 1.5) > 0 });
    },
    onFinish() { FX.splash(GOAL[0], GOAL[1], 30); FX.sparkle(GOAL[0], GOAL[1] - 100, 30); },
    winBanner: r => '🦴 ' + r.winner.name + ' reaches the golden bone!',
    winPos: () => ({ x: GOAL[0], y: GOAL[1] - 80 })
  };
})();
