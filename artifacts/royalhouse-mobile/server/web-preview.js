const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const staticRoot = path.resolve(__dirname, '..', 'dist');
const basePath = (process.env.BASE_PATH || '/').replace(/\/+$/, '');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD' });
    res.end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
  } catch {
    res.writeHead(400);
    res.end('Invalid URL');
    return;
  }

  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length) || '/';
  }

  let filePath = path.resolve(staticRoot, `.${pathname}`);
  if (filePath !== staticRoot && !filePath.startsWith(`${staticRoot}${path.sep}`)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath) && !path.extname(pathname)) {
    filePath = path.join(staticRoot, 'index.html');
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  res.writeHead(200, {
    'cache-control': 'no-cache',
    'content-type':
      contentTypes[path.extname(filePath).toLowerCase()] ||
      'application/octet-stream',
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  fs.createReadStream(filePath).pipe(res);
});

const port = Number.parseInt(process.env.PORT || '3000', 10);
server.listen(port, '0.0.0.0', () => {
  console.log(`Serving Expo web preview on port ${port}`);
});
