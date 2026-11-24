import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/** commerce-core. The same variable is read by the pages rendered on this server (api-base-url.token.ts). */
const commerceApi = (process.env['COMMERCE_API_URL'] || 'http://localhost:8180').replace(/\/$/, '');

/** Headers that belong to one hop and must not be passed on. */
const HOP_HEADERS = new Set(['host', 'connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'content-length',
  'proxy-authorization', 'te', 'trailer']);

/**
 * The browser calls the API on this site's own origin (`/web/...`), as with `ng serve`'s proxy, so no CORS is needed.
 * Outside development this server forwards those calls to commerce-core.
 */
app.use('/web', express.raw({ type: () => true, limit: '1mb' }), async (req, res, next) => {
  try {
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (value !== undefined && !HOP_HEADERS.has(name)) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    }
    const forwardedFor = req.headers['x-forwarded-for'];
    headers.set('x-forwarded-for', [forwardedFor, req.socket.remoteAddress].filter(Boolean).join(', '));
    const hasBody = !['GET', 'HEAD'].includes(req.method) && Buffer.isBuffer(req.body) && req.body.length > 0;
    const upstream = await fetch(commerceApi + req.originalUrl, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      redirect: 'manual',
    });
    res.status(upstream.status);
    upstream.headers.forEach((value, name) => {
      // fetch has already decoded the body, so its length and encoding no longer apply
      if (!HOP_HEADERS.has(name) && name !== 'content-encoding') res.setHeader(name, value);
    });
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    if (res.headersSent) return next(error);
    res.status(502).type('application/problem+json')
      .send(JSON.stringify({ status: 502, title: 'Bad Gateway', code: 'upstream_unavailable' }));
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
