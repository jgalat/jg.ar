import { createRequestHandler } from '@remix-run/cloudflare-workers';
import * as build from '@remix-run/dev/server-build';

const remixHandler = createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
});

const curlResponse = `
  Jorge Galat

  I'm a full stack developer based in Rosario, Argentina

  - https://github.com/jgalat
  - https://linkedin.com/in/jgalat
  - https://twitter.com/_jgalat

`;

const handleEvent = async event => {
  const userAgent = event.request.headers.get('user-agent') || '';
  if (
    event.request.method === 'GET' &&
    userAgent.match(/(curl|libcurl|HTTPie)\//i)
  ) {
    return new Response(curlResponse, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return await remixHandler(event);
};

addEventListener('fetch', event => {
  event.respondWith(handleEvent(event));
});
