// Offline cache. Bump VERSION after changing any file.
const VERSION = 'kinlevel-v3';
const FILES = ['./','index.html','style.css','sprites.js','i18n.js','app.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png',
  'fonts/pixelify-cyr.woff2','fonts/pixelify-lat.woff2','fonts/press-cyr.woff2','fonts/press-lat.woff2'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
// network-first, fallback to cache
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(fetch(e.request).then(r=>{ const cp=r.clone(); caches.open(VERSION).then(c=>c.put(e.request,cp)); return r; }).catch(()=>caches.match(e.request)));
});
