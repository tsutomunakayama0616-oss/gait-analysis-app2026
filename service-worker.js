// ===============================
//  歩行解析アプリ PWA Service Worker
// ===============================

const CACHE_NAME = "gait-app-cache-v3";

const urlsToCache = [
  "./",
  "./index.html",
  "./script.js",
  "./pdf-font.js",
  "./NotoSansJP-Regular.ttf",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-1024.png",
  "./icon-1024-maskable.png",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm/vision_wasm_internal.wasm",
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm/vision_wasm_internal.js"
];

// インストール
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// アクティベート（古いキャッシュ削除）
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// fetch（キャッシュ優先）
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;

      return fetch(event.request).catch(() => caches.match("./index.html"));
    })
  );
});