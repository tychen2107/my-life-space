'use strict';

const shellPrefix = 'my-life-space-shell-';
const shell = shellPrefix + 'v1.23.41';
const sdkCache = 'my-life-space-firebase-v11.10.0';
const entry = new URL('index.html', self.registration.scope).href;
const localFiles = [
  entry, 'manifest.webmanifest', 'pwa.js', 'icon-192-dual-currency.png', 'icon-512-dual-currency.png',
  'icon-maskable-512-dual-currency.png', 'apple-touch-icon-dual-currency.png', 'fx-banknote-coins.webp'
].map(path => new URL(path, self.registration.scope).href);
const localAssets = new Set(localFiles.filter(url => url !== entry));
const sdkPath = /^\/firebasejs\/11\.10\.0\/[a-z0-9.-]+\.js$/;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(shell);
    const requests = localFiles.map(url => new Request(url, {cache: 'reload'}));
    await cache.addAll(requests);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(shellPrefix) && key !== shell).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function openApp(request) {
  try {
    const response = await fetch(request);
    if (response.ok) return response;
  } catch {
    // The cached entry can start the app while the network is unavailable.
  }
  const cache = await caches.open(shell);
  return (await cache.match(entry)) || Response.error();
}

async function loadAsset(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && !response.redirected) {
    try { await cache.put(request, response.clone()); }
    catch (error) { console.warn('MY LIFE SPACE asset cache:', error); }
  }
  return response;
}

self.addEventListener('fetch', event => {
  const {request} = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  const appPath = url.pathname === scope.pathname || url.pathname === new URL(entry).pathname;
  if (request.mode === 'navigate' && url.origin === scope.origin && appPath) {
    event.respondWith(openApp(request));
  } else if (localAssets.has(url.href)) {
    event.respondWith(loadAsset(request, shell));
  } else if (url.origin === 'https://www.gstatic.com' && sdkPath.test(url.pathname) && !url.search) {
    event.respondWith(loadAsset(request, sdkCache));
  }
});
