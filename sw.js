// CasiClicker Service Worker
// v1.16.1 — Sprint 16 hotfix : push opt-in rescheduled (5min + 1h only, plus déclenché par coins)
// Bump la version à chaque déploiement pour forcer le refresh.
const CACHE_NAME = 'casiclicker-v1.16.1';

// Tous les assets statiques du jeu — pré-cachés à l'installation pour garantir l'offline.
const ASSETS = [
  './',
  './index.html',
  './img_data.js',
  './manifest.json',
  './sw.js',
  './icon-192.png',
  './icon-512.png'
];

// === INSTALL ===
// Pré-cache tout. `skipWaiting` pour activer la nouvelle version sans attendre la fermeture de tous les onglets.
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// === ACTIVATE ===
// Nettoie les caches des anciennes versions + prend le contrôle immédiat des clients ouverts.
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// === FETCH ===
// Stratégie :
// - Navigation (HTML) → network-first, fallback cache, fallback index.html (offline)
// - Assets same-origin → stale-while-revalidate (rapide + refresh background)
// - Tiers (Google Forms, fonts, analytics) → laisser passer (bypass du SW)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Bypass : requêtes tierces (Google Forms, fonts, analytics)
  const bypassHosts = ['google', 'doubleclick', 'fonts.g', 'gtag', 'posthog', 'sentry'];
  if (bypassHosts.some(h => url.hostname.includes(h))) return;

  // Détection de navigation (document HTML)
  const isNavigation =
    e.request.mode === 'navigate' ||
    (e.request.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    // Network-first pour les HTML → l'utilisateur reçoit toujours la dernière version quand online.
    e.respondWith(
      fetch(e.request)
        .then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(e.request).then(cached => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  // Stale-while-revalidate pour tous les autres assets same-origin
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const networkFetch = fetch(e.request).then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return response;
        }).catch(() => cached); // si le réseau échoue, on garde le cache
        return cached || networkFetch;
      })
    );
    return;
  }

  // Cross-origin non bypassé → passe réseau, sans cache.
});

// === MESSAGE ===
// Permet au jeu de déclencher un skipWaiting manuellement si on veut afficher un bouton "Nouvelle version dispo".
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
