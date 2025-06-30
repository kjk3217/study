const CACHE_NAME = 'bible-app-v2';
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
  console.log('Service Worker 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('캐시 생성 및 파일 캐싱 중...');
      return cache.addAll([
        ...APP_SHELL,
        ...IMAGE_FILES,
        ...DATA_FILES
      ]);
    }).catch(err => {
      console.error('캐시 생성 실패:', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker 활성화 중...');
  event.waitUntil(
    caches.keys().then(keys => {
      console.log('이전 캐시 정리 중...');
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('이전 캐시 삭제:', k);
          return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // GET 요청이고 정적 파일들만 캐시 처리
  if (
    event.request.method === 'GET' &&
    (url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.jpeg') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.txt') ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('/'))
  ) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) {
          console.log('캐시에서 반환:', url.pathname);
          return cached;
        }

        console.log('네트워크에서 가져오는 중:', url.pathname);
        return fetch(event.request).then(resp => {
          // 성공적인 응답인 경우만 캐시에 저장
          if (resp && resp.status === 200 && resp.type === 'basic') {
            const respClone = resp.clone();
            caches.open(CACHE_NAME).then(cache => {
              console.log('캐시에 저장:', url.pathname);
              cache.put(event.request, respClone);
            });
          }
          return resp;
        }).catch(err => {
          console.error('네트워크 요청 실패:', url.pathname, err);
          // 네트워크 실패시 캐시에서 다시 시도
          return caches.match(event.request);
        });
      })
    );
  }
});

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('백그라운드 동기화 실행');
    // 필요한 경우 백그라운드 작업 수행
  }
});

// 푸시 알림 (선택사항)
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
    
    event.waitUntil(
      self.registration.showNotification('계시록 공부', options)
    );
  }
});

// 알림 클릭 처리 (선택사항)
self.addEventListener('notificationclick', event => {
  console.log('알림 클릭:', event.notification.tag);
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
