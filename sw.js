const CACHE_NAME = 'gestor-trabajo-v1.0.8';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    
    // Si es una petición a nuestra propia ruta, forzar que pase por red sin caché de navegador
    const isLocal = event.request.url.startsWith(self.location.origin);
    let fetchRequest = event.request;
    
    if (isLocal) {
        // Añadir cache-busting parameter
        const url = new URL(event.request.url);
        url.searchParams.set('nocache', Date.now());
        fetchRequest = new Request(url, {
            mode: event.request.mode, 
            credentials: event.request.credentials,
            headers: event.request.headers
        });
    }

    event.respondWith(
        fetch(fetchRequest)
            .then((response) => {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Recordatorio de Trabajo';
    const options = {
        body: data.body || 'Tienes una tarea pendiente.',
        icon: 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 512 512%22%3E%3Crect width%3D%22512%22 height%3D%22512%22 rx%3D%22100%22 fill%3D%22%236366f1%22%2F%3E%3Cg transform%3D%22translate(102.4, 102.4) scale(0.6)%22%3E%3Cpath d%3D%22M256 120a110 110 0 0 0-110 110c0 100-30 130-30 130h280s-30-30-30-130a110 110 0 0 0-110-110z%22 fill%3D%22white%22%2F%3E%3Cpath d%3D%22M220 380a40 40 0 0 0 72 0%22 fill%3D%22white%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E',
        badge: 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 512 512%22%3E%3Crect width%3D%22512%22 height%3D%22512%22 rx%3D%22100%22 fill%3D%22%236366f1%22%2F%3E%3Cg transform%3D%22translate(102.4, 102.4) scale(0.6)%22%3E%3Cpath d%3D%22M256 120a110 110 0 0 0-110 110c0 100-30 130-30 130h280s-30-30-30-130a110 110 0 0 0-110-110z%22 fill%3D%22white%22%2F%3E%3Cpath d%3D%22M220 380a40 40 0 0 0 72 0%22 fill%3D%22white%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E',
        vibrate: [200, 100, 200]
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow('/');
        })
    );
});
