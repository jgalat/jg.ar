import {
  createRequestHandler,
  handleAsset,
} from '@remix-run/cloudflare-workers';
import * as build from '@remix-run/dev/server-build';
import { compile } from 'html-to-text';

const htmlToText = compile({
  wordwrap: 80,
  selectors: [
    { selector: 'h1', options: { uppercase: false } },
    { selector: 'ul', options: { itemPrefix: '- ' } },
    { selector: 'a', options: { ignoreHref: true } },
  ],
});

const remixHandleRequest = createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
});

const remixHandler = async event => {
  let response = await handleAsset(event, build);

  if (!response) {
    response = await remixHandleRequest(event);
  }

  return response;
};

const handleEvent = async event => {
  const userAgent = event.request.headers.get('user-agent') || '';
  if (
    event.request.method === 'GET' &&
    userAgent.match(/(curl|libcurl|HTTPie)\//i)
  ) {
    const response = await fetch(event.request.url);
    const html = await response.text();
    return new Response(`\n${htmlToText(html)}\n\n`, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return await remixHandler(event);
};

addEventListener('fetch', event => {
  event.respondWith(handleEvent(event));
});
