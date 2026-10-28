#!/usr/bin/env node
// Minimal static server for offline boot tests.
// Usage: node tools/serve.mjs [port] [root]
// Binds 127.0.0.1 only. Directory index, honest 404, path-traversal guard,
// request logging to stdout. No dependencies.
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";

const port = Number(process.argv[2] || 8080);
const root = resolve(process.argv[3] || join(import.meta.dirname, ".."));

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".gz": "application/gzip",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".bin": "application/octet-stream",
  ".dat": "application/octet-stream",
  ".hdr": "application/octet-stream",
  ".ktx2": "image/ktx2",
  ".webmanifest": "application/manifest+json",
  ".ico": "image/x-icon",
};

const server = createServer((req, res) => {
  let status = 200;
  const log = (msg) => console.log(msg);
  try {
    const url = new URL(req.url, "http://127.0.0.1");
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith("/")) rel += "index.html";
    const abs = normalize(join(root, rel));
    if (abs !== root && !abs.startsWith(root + sep)) {
      status = 403;
      res.writeHead(403, { "content-type": "text/plain" });
      res.end("forbidden");
      return log(`${req.method} ${req.url} 403`);
    }
    let file = abs;
    let st;
    try {
      st = statSync(file);
      if (st.isDirectory()) {
        file = join(file, "index.html");
        st = statSync(file);
      }
    } catch {
      status = 404;
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
      return log(`${req.method} ${req.url} 404`);
    }
    const type = TYPES[extname(file).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "content-type": type,
      "content-length": st.size,
      "cache-control": "no-store",
    });
    if (req.method === "HEAD") return res.end(), log(`${req.method} ${req.url} 200`);
    createReadStream(file).pipe(res);
  } catch (err) {
    status = 500;
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("server error");
    log(`${req.method} ${req.url} 500 ${err.message}`);
    return;
  }
  log(`${req.method} ${req.url} ${status}`);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`serve.mjs: http://127.0.0.1:${port}/ root=${root}`);
});
