const CACHE_NAME = 'alertiq-cache-v1';

// List all essential assets for offline access, including all module imagery and map data.
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  // Static data for maps
  'data/tectonic-plates.json',
  'data/ring-of-fire.json',
  'data/volcanoes.json',
  // Module Thumbnails & Content Images
  'https://wallpaperaccess.com/full/2142495.jpg',
  'https://www.washingtonpost.com/resizer/g6qrtMHTZ6exloEIC7vT0fvEry8=/arc-anglerfish-washpost-prod-washpost/public/BX2IH7HQOYI6ZLAWR67XDFGNPA.jpg',
  'https://png.pngtree.com/png-vector/20231106/ourlarge/pngtree-house-fire-png-image_10495889.png',
  'https://i.dailymail.co.uk/1s/2019/03/19/11/11177026-6825753-image-a-35_1552994830189.jpg',
  'https://www.washingtonpost.com/resizer/m5_Fw0k-YJLnwzjnajNg_WYz92g=/arc-anglerfish-washpost-prod-washpost/public/27LGMTEA4UI6XPRCGLJTDWDVGA.jpg',
  'https://tse1.mm.bing.net/th/id/OIP.RD78cSStXm6gkbE-CFBU6gAAAA?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
  'https://tse2.mm.bing.net/th/id/OIP.lgE6XbrjXFmZg-Aes6zHzAAAAA?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
  'https://image1.slideserve.com/3132244/p-waves-vs-s-waves-l.jpg',
  'https://thumbs.dreamstime.com/z/earthquake-safety-rules-instruction-case-emergency-outline-diagram-earthquake-safety-rules-instruction-case-246612835.jpg',
  'https://hsseworld.com/wp-content/uploads/2021/01/Fire-Emergency.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching app shell and essential assets.');
      // Use individual requests to handle potential CORS issues gracefully for external assets.
      const promises = ASSETS_TO_CACHE.map(url => {
        // For external URLs, use 'no-cors' mode.
        const request = url.startsWith('http') ? new Request(url, { mode: 'no-cors' }) : url;
        return cache.add(request).catch(err => {
          console.warn(`Failed to cache ${url}:`, err);
        });
      });
      return Promise.all(promises);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of uncontrolled clients as soon as the SW is activated.
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // For API requests, always fetch from the network.
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For all other requests, use a cache-first strategy.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If a response is found in the cache, return it.
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, fetch from the network.
      return fetch(event.request).then((networkResponse) => {
        // Cache the new response for future use.
        return caches.open(CACHE_NAME).then((cache) => {
          // Clone the response because it's a stream that can only be consumed once.
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(error => {
          console.log('Fetch failed; user is likely offline.', error);
          // In a real-world app, you might want to return a custom offline page here.
      });
    })
  );
});

// This allows the web app to trigger skipWaiting.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
