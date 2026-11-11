const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const app = path.resolve(__dirname, '..');
let requests = 0, starts = 0, fail = false, hidden = false;
const nodes = [];
const audio = {
  currentTime: 1,
  decodeAudioData: async () => ({ duration: .5 }),
  createGain: () => ({ gain: { value: 0 }, connect(destination) { return destination; }, disconnect() {} }),
  createBufferSource: () => {
    const n = { connect(destination) { return destination; }, disconnect() {}, start() { starts++; }, stop() { this.onended?.(); } };
    nodes.push(n); return n;
  }
};
const sandbox = {
  fetch: async url => { requests++; return { ok: !fail, status: fail ? 404 : 200, arrayBuffer: async () => new ArrayBuffer(8) }; },
  document: { get hidden() { return hidden; }, addEventListener() {} },
  store: { settings: { sound: true } }, AUD: { ctx: audio, sfx: {}, get: () => audio }, curGame: () => id
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(app, 'games/sfx.js'), 'utf8') + '\nglobalThis.sound = GameSound; globalThis.profiles = GAME_SOUNDS;', sandbox);
const sound = sandbox.sound, id = Object.keys(sandbox.profiles)[0];
(async () => {
  for (const game of Object.keys(sandbox.profiles)) {
    for (const name of sound.names(game)) assert.ok(fs.existsSync(path.join(app, 'assets/sfx', name + '.mp3')), game + '/' + name);
  }
  await sound.prepare(id, true);
  const count = requests;
  await sound.prepare(id, true);
  assert.equal(requests, count, 'cached audio must not refetch');
  const names = sound.names(id), first = names[0];
  assert.ok(sound.play(first));
  assert.ok(sound.play(first));
  assert.equal(starts, 1, 'repeat throttling');
  sound.stop();
  const before = starts;
  names.slice(0, 8).forEach(n => sound.play(n));
  assert.ok(starts - before <= 4, 'at most four overlapping sample voices');
  sound.stop(); assert.equal(sound.playing.size, 0);
  const mutedStarts = starts;
  sandbox.store.settings.sound = false;
  assert.equal(sound.play(first), false);
  await sound.prepare(id, true);
  assert.equal(starts, mutedStarts); assert.equal(requests, count);
  sandbox.store.settings.sound = true; hidden = true;
  assert.equal(sound.play(first), false); hidden = false;
  sound.files.delete(first); sound.buffers.delete(first); fail = true;
  await sound.prepare(id, true);
  assert.equal(sound.files.has(first), false, '404 must allow a retry');
  fail = false; await sound.prepare(id, true);
  assert.ok(sound.buffers.has(first), 'retry must restore the sample');
  const realPlay = sound.play;
  function events(dt) {
    const log = []; sound.play = n => log.push(n);
    const r = { game: { id }, TW: 3.8, now: 0 };
    for (let t = 0; t < 3.8 - 1e-6; t += dt) { r.now = t; sound.tick(r, dt); }
    return log.length;
  }
  assert.equal(events(.01), events(.02), 'texture count must not depend on frame rate');
  sound.play = realPlay;
  console.log('PASS: assets, cache, repeat limit, voice cap, stop, mute, hidden tab, failed request retry, frame-rate independent timing');
})().catch(e => { console.error(e); process.exitCode = 1; });

