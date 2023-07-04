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

export default {
  async fetch(
    request: Request,
    env: {
      __STATIC_CONTENT: Fetcher;
      ELASTICSEARCH_URL: string;
    },
    ctx: ExecutionContext
  ): Promise<Response> {
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

    const index = new Index(env.ELASTICSEARCH_URL);

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
