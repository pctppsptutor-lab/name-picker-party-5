// Code-drawn base backgrounds for games 25-30 (the bottom layer, like the duck race's river).
// Each one is painted once into an offscreen 1600x900 canvas and reused every frame.
// Positions match the play spots in each game file (nests, chest slabs, belt, lift doors).
const BASES = (() => {
  const W = 1600, H = 900, TAU = Math.PI * 2;
  const cache = {};
  let g;                                             // the offscreen context being painted

  // ---------- drawing helpers ----------
  const lin = (x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const rad = (x, y, r0, r1, stops) => { const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function ell(x, y, rx, ry, fill, stroke, lw = 3) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
  function poly(pts, fill, stroke, lw = 3) { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
  function blob(x, y, r, n, fill, seed = 1) {      // a lumpy round shape (bush, gold pile, cloud)
    g.fillStyle = fill; g.beginPath();
    for (let i = 0; i < n; i++) { const a = i / n * TAU, rr2 = r * (.75 + .25 * Math.sin(i * 2.3 + seed)); g.moveTo(x, y); g.arc(x + Math.cos(a) * r * .5, y + Math.sin(a) * r * .32, rr2 * .6, 0, TAU); }
    g.fill();
  }
  function rock(x, y, s, col = '#9aa3ad', dark = '#6f7780') {
    poly([[x - 40 * s, y], [x - 30 * s, y - 28 * s], [x - 5 * s, y - 40 * s], [x + 28 * s, y - 30 * s], [x + 42 * s, y]], col);
    poly([[x - 5 * s, y - 40 * s], [x + 28 * s, y - 30 * s], [x + 42 * s, y], [x + 8 * s, y]], dark);
  }
  function leafG(x, y, len, ang, col) {
    g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * .5, -len * .3, len, 0); g.quadraticCurveTo(len * .5, len * .3, 0, 0); g.fill();
    g.strokeStyle = '#00000026'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(len * .92, 0); g.stroke(); g.restore();
  }
  function flower(x, y, s, petal, center) {
    for (let i = 0; i < 5; i++) { g.save(); g.translate(x, y); g.rotate(i * TAU / 5); ell(0, -16 * s, 11 * s, 18 * s, petal); g.restore(); }
    ell(x, y, 8 * s, 8 * s, center);
  }
  function palm(x, y, h, col = '#2f8f45') {
    g.strokeStyle = '#8a5a2f'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 18, y - h * .5, x + 6, y - h); g.stroke();
    for (let i = 0; i < 7; i++) leafG(x + 6, y - h, 90, -Math.PI + i * Math.PI / 6 + .1, i % 2 ? col : '#3fa557');
  }
  function lantern(x, y, chain = 40) {
    g.strokeStyle = '#4a3a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y - chain); g.lineTo(x, y - 22); g.stroke();
    ell(x, y + 4, 34, 34, rad(x, y + 4, 0, 34, [[0, '#ffdc8a99'], [1, '#ffdc8a00']]));
    rr(x - 14, y - 22, 28, 40, 6); g.fillStyle = '#ffd36b'; g.fill(); g.strokeStyle = '#6b4a24'; g.lineWidth = 3; g.stroke();
    poly([[x - 18, y - 22], [x + 18, y - 22], [x + 10, y - 32], [x - 10, y - 32]], '#6b4a24');
    rr(x - 10, y + 16, 20, 6, 2); g.fillStyle = '#6b4a24'; g.fill();
  }
  function crystal(x, y, s, col) {
    g.save(); g.translate(x, y); g.scale(s, s);
    [[-14, -6, .35], [0, 0, 0], [14, -4, -.35]].forEach(([dx, dy, a], i) => {
      g.save(); g.translate(dx, dy); g.rotate(a); const h = i === 1 ? 58 : 40;
      poly([[-9, 0], [-9, -h * .75], [0, -h], [9, -h * .75], [9, 0]], col); poly([[0, -h], [9, -h * .75], [9, 0], [0, 0]], '#ffffff44'); g.restore();
    });
    g.restore();
  }
  function vignetteBase(col, a) { g.save(); g.globalAlpha = a; g.fillStyle = rad(800, 450, 420, 1000, [[0, col + '00'], [1, col]]); g.fillRect(0, 0, W, H); g.restore(); }
  // stone floor tiles in perspective, vanishing at (vx, vy)
  function tiles(top, bottom, vx, vy, col, n = 18) {
    g.save(); g.strokeStyle = col; g.lineWidth = 2;
    for (let i = -n; i <= n; i++) { const x = vx + i * 120; g.beginPath(); g.moveTo(vx + (x - vx) * (top - vy) / (bottom - vy), top); g.lineTo(x, bottom); g.stroke(); }
    for (let k = 0; k < 7; k++) { const y = top + (bottom - top) * Math.pow(k / 6, 1.6); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.restore();
  }

  // ============ 25 weather lab ============
  function weatherLab() {
    g.fillStyle = lin(0, 0, 0, 900, [[0, '#8fd0ff'], [.55, '#d8f1ff'], [.56, '#bfe0c8'], [1, '#8fc7a0']]); g.fillRect(0, 0, W, H);
    [[200, 80], [700, 60], [1200, 90]].forEach(([x, y], i) => blob(x, y, 120, 6, '#ffffffcc', i));
    // lab wall panels and a big gauge board
    rr(1280, 120, 300, 300, 20); g.fillStyle = '#3d566e'; g.fill(); g.strokeStyle = '#ffd84a'; g.lineWidth = 6; g.stroke();
    [[1340, 190, '#ff6f6f'], [1430, 190, '#ffd84a'], [1520, 190, '#7cd0ff']].forEach(([x, y, c]) => { ell(x, y, 34, 34, '#ffffff'); g.strokeStyle = c; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20, y - 18); g.stroke(); });
    // grass floor with stepping stones
    g.fillStyle = lin(0, 490, 0, 900, [[0, '#9ad27a'], [1, '#6bb85c']]); g.fillRect(0, 495, W, 405);
    [[190, 500], [410, 500], [630, 500], [850, 500], [1070, 500], [190, 800], [410, 800], [630, 800], [850, 800], [1070, 800]].forEach(([x, y]) => ell(x, y + 6, 76, 18, '#c9c2b4', '#a59f92', 3));
    [[40, 860, '#ff6fae'], [1560, 860, '#ffd34d'], [1250, 870, '#b48cff']].forEach(([x, y, c]) => flower(x, y, 1.6, c, '#ffe27a'));
  }

  // ============ 26 time lab ============
  function timeLab() {
    g.fillStyle = lin(0, 0, 0, 900, [[0, '#1a1f4a'], [1, '#0e1230']]); g.fillRect(0, 0, W, H);
    for (let i = 0; i < 80; i++) ell((i * 211) % W, (i * 97) % 900, 1.5 + (i % 3), 1.5 + (i % 3), '#ffffff88');
    // giant clock face in the back
    ell(800, 240, 200, 200, '#2a2f6a', '#c9a24a', 10);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.fillStyle = '#c9a24a'; g.fillRect(800 + Math.cos(a) * 170 - 4, 240 + Math.sin(a) * 170 - 4, 8, 8); }
    g.strokeStyle = '#c9a24a'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(800, 240); g.lineTo(800, 130); g.moveTo(800, 240); g.lineTo(880, 280); g.stroke();
    // floor grid
    g.fillStyle = lin(0, 700, 0, 900, [[0, '#23285e'], [1, '#141838']]); g.fillRect(0, 700, W, 200);
    tiles(700, 900, 800, 400, '#5df2ff33');
    // portal pads
    [380, 560, 740, 920, 1100].forEach(x => [330, 590].forEach(y => ell(x, y + 70, 74, 18, '#5df2ff22', '#5df2ff66', 3)));
    // gears in the corners
    [[60, 120, 60], [1540, 820, 70], [120, 820, 50]].forEach(([x, y, R]) => { ell(x, y, R, R, '#a0703f'); ell(x, y, R * .4, R * .4, '#141838'); });
    vignetteBase('#05061a', .4);
  }

  // ============ 27 pool ============
  function pool() {
    g.fillStyle = lin(0, 0, 0, 280, [[0, '#8fdcff'], [1, '#e2f8ff']]); g.fillRect(0, 0, W, 290);
    [[300, 70], [900, 60], [1350, 90]].forEach(([x, y], i) => blob(x, y, 110, 6, '#ffffff', i));
    palm(80, 300, 200); palm(1560, 300, 200);
    // pool deck tiles and water
    g.fillStyle = '#f2e6cf'; g.fillRect(0, 270, W, 630);
    rr(80, 290, 1320, 550, 30); g.fillStyle = lin(0, 290, 0, 840, [[0, '#7fe0f5'], [1, '#2fa8d6']]); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 10; g.stroke();
    g.strokeStyle = '#ffffff33'; g.lineWidth = 3; for (let i = 0; i < 24; i++) { const y = 310 + (i * 61) % 510, x = 100 + (i * 173) % 1280; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 30, y - 6, x + 60, y); g.stroke(); }
    // lane ropes
    for (let i = 1; i < 10; i++) { const y = 330 + i * 49; for (let x = 100; x < 1380; x += 24) ell(x, y - 24, 8, 5, i % 2 ? '#ff6f6f' : '#ffffff'); }
    // finish deck
    rr(1380, 440, 200, 200, 16); g.fillStyle = '#c99561'; g.fill(); for (let y = 450; y < 640; y += 22) { g.fillStyle = '#a0703f'; g.fillRect(1380, y, 200, 3); }
    // lifeguard chair
    g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.beginPath(); g.moveTo(1460, 300); g.lineTo(1440, 160); g.moveTo(1540, 300); g.lineTo(1560, 160); g.stroke(); rr(1430, 150, 140, 20, 6); g.fillStyle = '#ff6f6f'; g.fill();
  }

  // ============ 28 wizard hall ============
  function wizardHall() {
    g.fillStyle = lin(0, 0, 0, 900, [[0, '#2a1846'], [1, '#160c28']]); g.fillRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) { const x = 220 + i * 360; g.fillStyle = lin(0, 40, 0, 300, [[0, '#1d2a6a'], [1, '#4a3aa0']]); g.beginPath(); g.moveTo(x, 300); g.lineTo(x, 110); g.arc(x + 70, 110, 70, Math.PI, 0); g.lineTo(x + 140, 300); g.closePath(); g.fill(); g.strokeStyle = '#c9a24a'; g.lineWidth = 6; g.stroke(); }
    for (let i = 0; i < 30; i++) ell(230 + (i * 113) % 1300, 60 + (i * 47) % 220, 2, 2, '#ffffffaa');
    // bookshelves at the sides
    [[0, 140], [1460, 140]].forEach(([x0, w]) => { rr(x0, 60, w, 420, 8); g.fillStyle = '#4a2e1e'; g.fill(); for (let s = 0; s < 4; s++) { const y = 80 + s * 100; for (let b = 0, x = x0 + 10; x < x0 + w - 20; b++) { const bw = 14 + (b * 7) % 10; g.fillStyle = ['#a33b3b', '#3b6aa3', '#3ba37a', '#c9a24a', '#7a3ba3'][b % 5]; g.fillRect(x, y + 80 - 60 - (b * 13) % 20, bw, 60 + (b * 13) % 20); x += bw + 3; } } });
    // stone floor and rug
    g.fillStyle = lin(0, 340, 0, 900, [[0, '#4a3a6a'], [1, '#2a1f44']]); g.fillRect(0, 340, W, 560);
    tiles(345, 900, 800, 200, '#ffffff14');
    ell(670, 650, 640, 220, '#5a2a86aa'); ell(670, 650, 600, 200, null, '#c9a24a66', 4);
    vignetteBase('#08040f', .4);
  }

  // ============ 29 arcade ============
  function arcade() {
    g.fillStyle = lin(0, 0, 0, 900, [[0, '#2a1f5a'], [1, '#1a1238']]); g.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 40) for (let y = 0; y < 760; y += 40) if ((x + y) % 80 === 0) { g.fillStyle = '#ffffff08'; g.fillRect(x, y, 40, 40); }
    // neon sign and tray shelf
    rr(560, 30, 480, 80, 30); g.strokeStyle = '#ff6fae'; g.lineWidth = 6; g.stroke(); ell(800, 70, 160, 14, '#ff6fae55');
    rr(1050, 110, 400, 700, 20); g.fillStyle = '#3a2f7a'; g.fill(); g.strokeStyle = '#7cf7ff'; g.lineWidth = 5; g.stroke();
    // the cut-away machine body behind the contraption
    rr(140, 150, 860, 380, 24); g.fillStyle = '#ffffff10'; g.fill(); g.strokeStyle = '#c9d2dc55'; g.lineWidth = 4; g.stroke();
    // carpet floor
    g.fillStyle = lin(0, 760, 0, 900, [[0, '#3a1f5a'], [1, '#22123a']]); g.fillRect(0, 760, W, 140);
    for (let i = 0; i < 40; i++) { g.fillStyle = ['#ff6fae55', '#7cf7ff55', '#ffd84a55'][i % 3]; g.fillRect((i * 97) % W, 770 + (i * 37) % 120, 16, 4); }
    rr(0, 752, W, 10, 4); g.fillStyle = '#7cf7ff'; g.fill();
  }

  // ============ 30 vegetable garden ============
  function veggie() {
    g.fillStyle = lin(0, 0, 0, 260, [[0, '#8fdcff'], [1, '#e2f8ff']]); g.fillRect(0, 0, W, 270);
    [[260, 60], [900, 50], [1350, 80]].forEach(([x, y], i) => blob(x, y, 110, 6, '#ffffff', i));
    for (let x = -40; x < W + 60; x += 60) blob(x, 250 + Math.sin(x * .05) * 8, 60, 5, x % 120 ? '#5fae4a' : '#4f9e3f', x);
    g.fillStyle = lin(0, 270, 0, 900, [[0, '#a8d67a'], [1, '#7cbf5a']]); g.fillRect(0, 270, W, 630);
    // soil rows between the bunny lanes, with veggies
    for (let i = 0; i < 11; i++) { const y = 296 + i * 53.3; rr(120, y, 1100, 14, 7); g.fillStyle = '#8a5a3a'; g.fill(); for (let x = 150; x < 1210; x += 70) { leafG(x, y + 4, 22, -Math.PI / 2 - .4, '#3fa34d'); leafG(x, y + 4, 22, -Math.PI / 2 + .4, '#4fb85a'); } }
    // fence and the basket area
    g.strokeStyle = '#c99561'; g.lineWidth = 8; for (let x = 1260; x < 1600; x += 50) { g.beginPath(); g.moveTo(x, 360); g.lineTo(x, 300); g.stroke(); } g.beginPath(); g.moveTo(1240, 320); g.lineTo(1600, 320); g.stroke();
    ell(1450, 600, 140, 40, '#c9e8a8');
    [[60, 860, '#ff6fae'], [1560, 860, '#ffd34d']].forEach(([x, y, c]) => flower(x, y, 1.6, c, '#ffe27a'));
  }

  const BUILD = { g25: weatherLab, g26: timeLab, g27: pool, g28: wizardHall, g29: arcade, g30: veggie };
  return {
    get(id) {
      if (cache[id] !== undefined) return cache[id];
      if (!BUILD[id]) return cache[id] = null;
      const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; g = c.getContext('2d'); g.scale(1920 / W, 1080 / H);   // paint at full canvas resolution
      BUILD[id](); g = null;
      return cache[id] = c;
    }
  };
})();
