import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import type { AppLoadContext } from "@remix-run/cloudflare";
import { createRequestHandler, logDevReady } from "@remix-run/cloudflare";
import * as build from "@remix-run/dev/server-build";

import __STATIC_CONTENT_MANIFEST from "__STATIC_CONTENT_MANIFEST";
import Index from "~/index.server";

declare module "@remix-run/cloudflare" {
  export interface AppLoadContext {
    index: Index;
  }
}

const MANIFEST = JSON.parse(__STATIC_CONTENT_MANIFEST);
const handleRemixRequest = createRequestHandler(build, process.env.NODE_ENV);

if (build.dev) {
  logDevReady(build);
}

function auth(request: Request, authToken: string): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return false;
  const [type, token] = authHeader.split(" ");
  if (type !== "Basic") return false;
  return token === authToken;
}

export default {
  async fetch(
    request: Request,
    env: {
      __STATIC_CONTENT: Fetcher;
      ZINC_URL: string;
      TOKEN: string;
    },
    ctx: ExecutionContext
  ): Promise<Response> {
    if (process.env.NODE_ENV === "production" && !auth(request, env.TOKEN)) {
      return new Response("nope", {
        status: 401,
        headers: {
          "WWW-Authenticate": `Basic realm="SEARCH"`,
        },
      });
    }

    try {
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

    const index = new Index(env.ZINC_URL);

    try {
      const loadContext: AppLoadContext = {
        env,
        index,
      };
      return await handleRemixRequest(request, loadContext);
    } catch (error) {
      console.log(error);
      return new Response("An unexpected error occurred", { status: 500 });
    }
  },
};
