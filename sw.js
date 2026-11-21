/* Service Worker - PPG Well (GitHub Pages)
   שנו את VERSION בכל פעם שמעלים גרסה חדשה של index.html, כדי שהמטמון יתעדכן. */
const VERSION = "ppgwell-v3.0.2";
const CACHE = VERSION;
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // כל קובץ בנפרד: קובץ חסר (למשל אייקון) לא מפיל את ההתקנה כולה
      Promise.all(ASSETS.map((url) => cache.add(url).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // לא נוגעים בבקשות חיצוניות

  // דפים: קודם רשת (כדי לקבל גרסה עדכנית), ואם אין חיבור - מהמטמון
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put("./index.html", copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  // שאר הקבצים: קודם מטמון, ואם אין - רשת ושמירה
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
