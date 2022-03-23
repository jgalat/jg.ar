import {
  createRequestHandler,
  handleAsset,
} from "@remix-run/cloudflare-workers";
import * as build from "@remix-run/dev/server-build";
import { Router } from "itty-router";
import { customAlphabet } from "nanoid";

class HTTPError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const remixHandleRequest = createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
});

const remixHandler = async (event) => {
  let response = await handleAsset(event, build);

  if (!response) {
    response = await remixHandleRequest(event);
  }

  return response;
};

const router = Router();

router.routes.push([
  "GET",
  /^\/(?<key>~{0,1}[0-9a-zA-Z-_]+)$/,
  [
    async ({ params }) => {
      const { key } = params;
      const raw = await URLS.get(key);
      if (raw === null) {
        throw new HTTPError("not found", 404);
      }

      const { redirects, href } = JSON.parse(raw);
      await URLS.put(
        key,
        JSON.stringify({ href, key, redirects: redirects + 1 })
      );

      return Response.redirect(href, 301);
    },
  ],
]);

router.post("/api", async (request) => {
  const uid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 5);
  const { url: rawUrl, slug } = await request.json();
  const url = new URL(rawUrl);

  let key;
  if (slug !== null) {
    key = `~${slug}`;
    const stored = await URLS.get(key);
    if (stored != null) {
      throw new HTTPError("slug already taken", 400);
    }
  } else {
    do {
      key = uid();
    } while ((await URLS.get(key)) !== null);
  }

  const store = JSON.stringify({ href: url.href, key, redirects: 0 });
  await URLS.put(key, store);
  return new Response(store, {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});

router.get("/api/:key", async ({ params }) => {
  const { key } = params;
  const raw = await URLS.get(key);
  return new Response(raw, {
    headers: { "Content-Type": "application/json" },
    status: raw === null ? 404 : 200,
  });
});

router.all("*", async (_, event) => {
  return await remixHandler(event);
});

addEventListener("fetch", (event) =>
  event.respondWith(
    router.handle(event.request, event).catch(
      (error) =>
        new Response(
          JSON.stringify({ error: error.message || "internal server error" }),
          {
            status: error.status || 500,
          }
        )
    )
  )
);
