import { createEventHandler } from '@remix-run/cloudflare-workers';
import * as build from '@remix-run/dev/server-build';

const curlResponse = `
  Jorge Galat

  I'm a full stack developer based in Rosario, Argentina

  - https://github.com/jgalat
  - https://linkedin.com/in/jgalat
  - https://twitter.com/_jgalat

`;

const handleEvent = event => {
  const userAgent = event.request.headers.get('user-agent') || '';
  if (
    event.request.method === 'GET' &&
    userAgent.match(/(curl|libcurl|HTTPie)\//i)
  ) {
    const headers = new Headers([['Content-Type', 'text/plain']]);
    const response = new Response(curlResponse, { status: 200, headers });
    return event.respondWith(response);
  }

  const remixHandler = createEventHandler({
    build,
    mode: process.env.NODE_ENV,
  });

  return remixHandler(event);
};

addEventListener('fetch', handleEvent);
