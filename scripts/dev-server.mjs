import http from 'node:http';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4174);
const pidPath = path.join(root, `.dev-server-${port}.pid`);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

function pidAlive(pid) {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readPidFile() {
  try {
    const n = Number(String(fs.readFileSync(pidPath, 'utf8')).trim());
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writePidFile() {
  fs.writeFileSync(pidPath, `${process.pid}\n`);
}

function clearPidFile() {
  try {
    const existing = readPidFile();
    if (existing == null || existing === process.pid) fs.unlinkSync(pidPath);
  } catch {
    /* ignore */
  }
}

function portOpen() {
  return new Promise((resolve) => {
    const sock = net.connect({ host: '127.0.0.1', port }, () => {
      sock.end();
      resolve(true);
    });
    sock.on('error', () => resolve(false));
  });
}

async function reuseOrExit() {
  const stored = readPidFile();
  if (stored && pidAlive(stored) && await portOpen()) {
    console.log(`http://127.0.0.1:${port}/ (reusing pid ${stored})`);
    process.exit(0);
  }
  if (await portOpen()) {
    const hint = stored && pidAlive(stored) ? stored : 'unknown';
    console.log(`http://127.0.0.1:${port}/ (port busy, pid ${hint})`);
    process.exit(0);
  }
  if (stored && !pidAlive(stored)) clearPidFile();
}

await reuseOrExit();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.resolve(root, `.${rel}`);
  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    const stored = readPidFile();
    console.log(`http://127.0.0.1:${port}/ (port busy, pid ${stored && pidAlive(stored) ? stored : 'unknown'})`);
    process.exit(0);
  }
  throw err;
});

for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => {
    clearPidFile();
    server.close(() => process.exit(0));
  });
}
process.on('exit', clearPidFile);

server.listen(port, '127.0.0.1', () => {
  writePidFile();
  console.log(`http://127.0.0.1:${port}/`);
});
