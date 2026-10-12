const C='roadster-v28b';const F=["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
// the page itself is network-first so a new version always shows when online; everything else is cache-first
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.pathname.endsWith('cloud.json'))return;const page=e.request.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('index.html');
 if(page){e.respondWith(fetch(e.request).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp));}return res;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));return;}
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{if(res.ok&&u.origin===location.origin){const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp));}return res;})));});
