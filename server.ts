import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';
import { attachRealtime } from './lib/realtime';

async function main() {
  const port = Number(process.env.PORT || 3000);
  const dev = process.env.NODE_ENV !== 'production';
  const app = next({ dev, webpack: true });
  await app.prepare();
  const handler = app.getRequestHandler();
  const server = createServer((req, res) => handler(req, res));
  const io = new Server(server, {
    maxHttpBufferSize: 16_384,
    allowRequest: (req, done) => {
      const origin = req.headers.origin;
      // Browsers provide Origin on cross-origin connections; no wildcard CORS.
      try { done(null, !origin || new URL(origin).host === req.headers.host); } catch { done(null, false); }
    },
  });
  const realtime = attachRealtime(io);
  server.listen(port, '0.0.0.0', () => console.log(`Promptopia: http://localhost:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => { realtime.stop(); io.close(); server.close(); process.exit(0); });
}
main().catch(error => { console.error(error); process.exit(1); });
