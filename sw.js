// StudyAbroad service worker — ทำให้แอปเปิดได้แม้ไม่มีเน็ต
// แก้ index.html หรือ countries.js แล้วให้เปลี่ยนเลขเวอร์ชันนี้ ผู้ใช้จะได้เวอร์ชันใหม่ตอนเปิดแอปครั้งถัดไป
const CACHE = 'studyabroad-v1.0.0';
const CORE = ['./', './index.html', './countries.js', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (/er-api\.com|exchangerate-api\.com/.test(url.hostname)) return; // เรทเงิน: แอปมีเรทสำรองในเครื่องเอง
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, {cache:'no-cache'}).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
      return r;
    }).catch(() => hit);
    return hit || net;
  }));
});
