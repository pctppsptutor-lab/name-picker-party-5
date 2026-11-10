const CACHE_NAME = 'name-picker-vol5-v27';
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
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

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const asset = /\.(webp|wav|svg|woff2?)$/i.test(url.pathname) || url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com');
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
