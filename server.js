const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO after Next.js is ready
  // We'll import and initialize it dynamically to handle TypeScript
  import('./dist/socket-server.js').then(({ initializeSocketServer }) => {
    const io = initializeSocketServer(server);
    console.log('Socket.IO server initialized');
  }).catch(err => {
    console.error('Failed to initialize Socket.IO:', err);
    console.log('Running without Socket.IO support');
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});