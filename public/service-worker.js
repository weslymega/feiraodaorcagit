const CACHE_NAME = 'orca-pwa-v1';
const ALLOWED_ASSETS = [
    '/icon.svg',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Pré-cache MÍNIMO apenas da casca essencial
            return cache.addAll(ALLOWED_ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. REGRAS DE BLOQUEIO DE CACHE (Network Only)
    // Nunca cachear Supabase, API, Auth, Realtime
    if (
        url.hostname.includes('supabase.co') ||
        url.pathname.startsWith('/auth') ||
        url.pathname.startsWith('/rest') ||
        url.pathname.startsWith('/realtime') ||
        event.request.method !== 'GET'
    ) {
        return; // Deixa o navegador fazer o fetch padrão (Network Only)
    }

    // 2. Assets Estáticos (JS/CSS/Imagens) -> Cache First
    if (
        url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/)
    ) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request).then((networkResponse) => {
                    // Clone e Cache
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return networkResponse;
                });
            })
        );
        return;
    }

    // 3. Documento HTML (Navegação) -> Network First
    // Garante que o usuário sempre veja a versão mais recente do app
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('/index.html'); // Fallback apenas se offline REAL (opcional)
            })
        );
        return;
    }
});
