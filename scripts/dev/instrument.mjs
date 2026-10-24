// Loaded only by the local supervisor. No request bodies, cookies or query tokens in logs.
import { Server } from 'node:http';
const emit = Server.prototype.emit;
Server.prototype.emit = function (event, ...args) {
  if (event === 'request') {
    const [request, response] = args;
    const start = performance.now();
    response.once('finish', () => {
      const pathname = String(request.url || '/').split('?')[0];
      if (!pathname.startsWith('/_next/')) console.log(`${request.method} ${pathname} ${response.statusCode} ${Math.round(performance.now() - start)}ms`);
    });
  }
  return emit.call(this, event, ...args);
};
