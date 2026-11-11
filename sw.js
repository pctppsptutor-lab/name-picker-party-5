const CACHE_NAME = 'name-picker-vol5-v36';
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./assets/brand/edupia-tutor.png",
  "./assets/bgm/credits.html",
  "./assets/sfx/credits.html",
  "./games/bgm.js",
  "./games/sfx.js",
  "./games/i18n.js",
  "./games/fx.js",
  "./games/decor.js",
  "./games/bases.js",
  "./games/scenes.js",
  "./games/g25-weather.js",
  "./games/g26-time.js",
  "./games/g27-puppies.js",
  "./games/g28-cloak.js",
  "./games/g29-vending.js",
  "./games/g30-bunny.js"
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k.startsWith('name-picker-vol5-') && k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Cache the complete small BGM once, then satisfy native media range requests offline.
async function bgmResponse(request) {
  const cache = await caches.open(CACHE_NAME).catch(() => null);
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
  const asset = /\.(webp|wav|mp3|svg|woff2?)$/i.test(url.pathname) || url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com');
  const cache = caches.open(CACHE_NAME).catch(() => null);
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
