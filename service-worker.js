// ===============================
//  歩行解析アプリ PWA Service Worker
// ===============================

const CACHE_NAME = "gait-app-cache-v3";

// キャッシュするファイル一覧
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

// ===============================
//  インストール（初回 or 更新時）
// ===============================
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// ===============================
//  アクティベート（古いキャッシュ削除）
// ===============================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ===============================
//  fetch（キャッシュ優先）
// ===============================
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // キャッシュがあれば返す
      if (response) return response;

      // なければネットワークから取得
      return fetch(event.request).catch(() => {
        // オフライン時のフォールバック（必要なら追加可能）
        return caches.match("./index.html");
      });
    })
  );
});