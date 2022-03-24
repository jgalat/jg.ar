import { createEventHandler } from "@remix-run/cloudflare-workers";
import * as build from "@remix-run/dev/server-build";

// router.routes.push([
//   "GET",
//   /^\/(?<key>~{0,1}[0-9a-zA-Z-_]+)$/,
//   [
//     async ({ params }) => {
//       const { key } = params;
//       const raw = await URLS.get(key);
//       if (raw === null) {
//         throw new HTTPError("not found", 404);
//       }

//       const { redirects, href } = JSON.parse(raw);
//       await URLS.put(
//         key,
//         JSON.stringify({ href, key, redirects: redirects + 1 })
//       );

//       return Response.redirect(href, 301);
//     },
//   ],
// ]);

addEventListener(
  "fetch",
  createEventHandler({ build, mode: process.env.NODE_ENV })
);
