import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import type { AppLoadContext } from "@remix-run/cloudflare";
import { createRequestHandler, logDevReady } from "@remix-run/cloudflare";
import * as build from "@remix-run/dev/server-build";
import __STATIC_CONTENT_MANIFEST from "__STATIC_CONTENT_MANIFEST";

const MANIFEST = JSON.parse(__STATIC_CONTENT_MANIFEST);
const handleRemixRequest = createRequestHandler(build, process.env.NODE_ENV);

if (build.dev) {
  logDevReady(build);
}

const text = `
Jorge Galat

I'm a full stack developer based in Rosario, Argentina

- https://github.com/jgalat
- https://linkedin.com/in/jgalat
- https://twitter.com/_jgalat

`;

export default {
  async fetch(
    request: Request,
    env: {
      __STATIC_CONTENT: Fetcher;
    },
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      const userAgent = request.headers.get("user-agent") || "";
      if (
        request.method === "GET" &&
        userAgent.match(/(curl|libcurl|HTTPie)\//i)
      ) {
        return new Response(text, {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });
      }

      const url = new URL(request.url);
      const ttl = url.pathname.startsWith("/build/") ? 31_536_000 : 300;
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        } as FetchEvent,
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: MANIFEST,
          cacheControl: {
            browserTTL: ttl,
            edgeTTL: ttl,
          },
        }
      );
    } catch (error) {}

    try {
      const loadContext: AppLoadContext = {
        env,
      };
      return await handleRemixRequest(request, loadContext);
    } catch (error) {
      console.log(error);
      return new Response("An unexpected error occurred", { status: 500 });
    }
  },
};
