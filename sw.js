/* Kevinvariant service worker: makes the site installable and keeps what you have opened available offline.
   Pages: network first, so new papers appear at once; the cached copy is used only when offline.
   Versioned files (?v=...), PDFs, images and diagrams: cache first, since a new version gets a new URL.
   MathJax and fonts from their CDNs: served from cache and refreshed in the background.
   Anything else on another origin (accounts, sync, telemetry) is never touched. */
var VERSION = 'kv-2';
var CORE = 'core-' + VERSION, PAGES = 'pages-' + VERSION, FILES = 'files-' + VERSION, CDN = 'cdn-' + VERSION;
var PRECACHE = ['/offline.html', '/favicon.svg?v=4', '/icon-192.png?v=4'];
var CDN_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CORE).then(function (c) { return c.addAll(PRECACHE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  var keep = [CORE, PAGES, FILES, CDN];
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return keep.indexOf(k) < 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function trim(name, max) {
  caches.open(name).then(function (c) { c.keys().then(function (ks) { if (ks.length > max) c.delete(ks[0]).then(function () { trim(name, max); }); }); });
}
function put(name, req, res, max) {
  if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
    var copy = res.clone(); caches.open(name).then(function (c) { c.put(req, copy); if (max) trim(name, max); });
  }
  return res;
}
function networkFirst(req) {
  return fetch(req).then(function (res) { return put(PAGES, req, res, 120); }).catch(function () {
    return caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(function (hit) {
      return hit || (req.mode === 'navigate' ? caches.match('/offline.html') : Response.error());
    });
  });
}
function cacheFirst(req, name, max) {
  return caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (res) { return put(name, req, res, max); });
  });
}
function staleWhileRevalidate(req) {
  return caches.match(req).then(function (hit) {
    var net = fetch(req).then(function (res) { return put(CDN, req, res, 60); }).catch(function () { return hit; });
    return hit || net;
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    if (CDN_HOSTS.indexOf(url.hostname) >= 0) e.respondWith(staleWhileRevalidate(req));
    return;
  }
  if (url.pathname === '/sw.js') return;
  if (req.mode === 'navigate' || /\.html?$/.test(url.pathname) || url.pathname.endsWith('/')) { e.respondWith(networkFirst(req)); return; }
  if (/\.pdf$/i.test(url.pathname)) { e.respondWith(url.search.indexOf('v=') >= 0 ? cacheFirst(req, FILES, 40) : networkFirst(req)); return; }
  if (url.search.indexOf('v=') >= 0 || /\.(svg|png|ico|jpg|jpeg|webp|woff2?)$/i.test(url.pathname)) { e.respondWith(cacheFirst(req, FILES, 400)); return; }
  e.respondWith(networkFirst(req));
});

/* First visit: the page that registered this worker loaded before it was in control, so the page sends its own URL and resources to be saved. */
self.addEventListener('message', function (e) {
  var d = e.data || {};
  if (d.type !== 'cache-page' || !Array.isArray(d.urls)) return;
  e.waitUntil(Promise.all(d.urls.slice(0, 80).map(function (u) {
    var url; try { url = new URL(u, self.location.origin); } catch (err) { return null; }
    var same = url.origin === self.location.origin, cdn = CDN_HOSTS.indexOf(url.hostname) >= 0;
    if (!same && !cdn) return null;
    var name = !same ? CDN : (/\.html?$/.test(url.pathname) || url.pathname.endsWith('/')) ? PAGES : FILES;
    return caches.match(url.href).then(function (hit) {
      if (hit) return null;
      return fetch(url.href, same ? {} : { mode: 'cors', credentials: 'omit' }).then(function (res) { return put(name, url.href, res); }).catch(function () {});
    });
  })));
});
