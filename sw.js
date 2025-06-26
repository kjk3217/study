const CACHE_NAME = 'bible-app-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/images/main-logo.png',
  '/icon-192.png',
  '/icon-512.png'
];
const IMAGE_FILES = [
  '/images/main-logo.png'
];
const DATA_FILES = Array.from({length:22}, (_,i)=>`/data/chapter${i+1}.txt`);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll([
        ...APP_SHELL,
        ...IMAGE_FILES,
        ...DATA_FILES
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (
    event.request.method === 'GET' &&
    (url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.txt') ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('/'))
  ) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached ||
        fetch(event.request).then(resp => {
          if (resp && resp.status === 200) {
            const respClone = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
          }
          return resp;
        }).catch(() =>
          caches.match(event.request)
        )
      )
    );
  }
});
