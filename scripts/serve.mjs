#!/usr/bin/env node
// Yerel test sunucusu: `node scripts/serve.mjs [port] [base]`
// base verilirse (örn. /iyireklam) site o alt yolda yayınlanıyormuş gibi sunulur (GitHub Pages benzetimi).
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
};

export function startServer(port = 4173, base = '') {
  const server = http.createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (base) {
        if (!p.startsWith(base)) { res.writeHead(404); res.end('not found'); return; }
        p = p.slice(base.length) || '/';
      }
      let file = path.join(ROOT, p);
      if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      let st = await stat(file).catch(() => null);
      if (st && st.isDirectory()) {
        if (!p.endsWith('/')) { res.writeHead(301, { Location: (base + p) + '/' }); res.end(); return; }
        file = path.join(file, 'index.html');
        st = await stat(file).catch(() => null);
      }
      if (!st) {
        const nf = await readFile(path.join(ROOT, '404.html')).catch(() => Buffer.from('404'));
        res.writeHead(404, { 'Content-Type': MIME['.html'] });
        res.end(nf);
        return;
      }
      const buf = await readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(buf);
    } catch (e) {
      res.writeHead(500); res.end(String(e));
    }
  });
  // 0.0.0.0: aynı Wi-Fi ağındaki telefonlar da bağlanabilsin
  return new Promise((resolve) => server.listen(port, '0.0.0.0', () => resolve(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2]) || 4173;
  const base = process.argv[3] || '';
  await startServer(port, base);
  console.log(`\nBilgisayarda:  http://localhost:${port}${base}/`);
  const lan = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal);
  for (const i of lan) console.log(`Telefonda:     http://${i.address}:${port}${base}/   (telefon ve bilgisayar aynı Wi-Fi ağında olmalı)`);
  if (!lan.length) console.log('Telefonda:     (ağ adresi bulunamadı; bilgisayarın Wi-Fi/Ethernet bağlantısını kontrol edin)');
  console.log('Durdurmak için Ctrl+C\n');
}
