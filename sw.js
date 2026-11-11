const CACHE_NAME = 'name-picker-vol5-shell-222146eb87c2ae34fd18';
const ASSET_CACHE_NAME = 'name-picker-vol5-assets-3ed2224eede0beefddb4';
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./assets/bgm/credits.html",
  "./assets/sfx/credits.html",
  "./games/dist/runtime.js",
];

self.addEventListener('install', e => {
  e.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)),
      caches.open(ASSET_CACHE_NAME).then(c => c.match('./assets/brand/edupia-tutor.webp').then(hit => hit || c.add('./assets/brand/edupia-tutor.webp')))
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k.startsWith('name-picker-vol5-') && k !== CACHE_NAME && k !== ASSET_CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Cache the complete small BGM once, then satisfy native media range requests offline.
async function bgmResponse(request) {
  const cache = await caches.open(ASSET_CACHE_NAME).catch(() => null);
  let full = await cache?.match(request.url).catch(() => undefined);
  if (!full) {
    const headers = new Headers(request.headers); headers.delete('range');
    full = await fetch(new Request(request, { headers }));
    if (full.status === 200 && cache) await cache.put(request.url, full.clone()).catch(() => {});
  }
  const range = request.headers.get('range');
  if (!range || full.status !== 200) return full;
  const bytes = await full.arrayBuffer(), size = bytes.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
  const invalid = () => new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
  if (!match || (!match[1] && !match[2])) return invalid();
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) return invalid();
  const headers = new Headers(full.headers); headers.delete('content-encoding');
  headers.set('Content-Range', 'bytes ' + start + '-' + end + '/' + size);
  headers.set('Content-Length', String(end - start + 1)); headers.set('Accept-Ranges', 'bytes');
  return new Response(bytes.slice(start, end + 1), { status: 206, headers });
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin === self.location.origin && /\/assets\/bgm\/g\d+\.mp3$/i.test(url.pathname)) {
    e.respondWith(bgmResponse(e.request).catch(() => Response.error())); return;
  }
  const asset = /\.(webp|png|wav|mp3|svg|woff2?)$/i.test(url.pathname) || url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com');
  const cache = caches.open(asset ? ASSET_CACHE_NAME : CACHE_NAME).catch(() => null);
  const cached = cache.then(c => c?.match(e.request)).catch(() => undefined);
  let write;
  const network = cached.then(hit => {
    if (asset && hit) return hit;
    return fetch(e.request).then(res => {
      if (res.status === 200) {
        const copy = res.clone();
        write = cache.then(c => c?.put(e.request, copy)).catch(() => {});
      }
      return res;
    }).catch(() => undefined);
  });
  e.waitUntil(network.then(() => write));
  const response = asset ? network : cached.then(hit => hit || network);
  e.respondWith(response.then(res => res || Response.error()));
});
