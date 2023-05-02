import {
  createRequestHandler,
  handleAsset,
} from "@remix-run/cloudflare-workers";
import * as build from "@remix-run/dev/server-build";

const text = `
Jorge Galat

I'm a full stack developer based in Rosario, Argentina

- https://github.com/jgalat
- https://linkedin.com/in/jgalat
- https://twitter.com/_jgalat

`;

const remixHandleRequest = createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
});

const remixHandler = async (event: FetchEvent) => {
  let response = await handleAsset(event, build);

  if (!response) {
    response = await remixHandleRequest(event);
  }

  return response;
};

const handleEvent = async (event: FetchEvent) => {
  const userAgent = event.request.headers.get("user-agent") || "";

  if (
    event.request.method === "GET" &&
    userAgent.match(/(curl|libcurl|HTTPie)\//i)
  ) {
    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return remixHandler(event);
};

addEventListener("fetch", (event: FetchEvent) =>
  event.respondWith(handleEvent(event))
);
