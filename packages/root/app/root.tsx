import type { V2_MetaFunction, LinksFunction } from "@remix-run/cloudflare";
import {
  Links,
  Link,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";

import tw from "./tailwind.css";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Jorge Galat <jgalat>" },
    {
      name: "description",
      content:
        "Jorge Galat - I'm a full stack developer based in Rosario, Argentina",
    },
  ];
};

export const links: LinksFunction = () => {
  return [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossOrigin: "anonymous",
    },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Sans+Pro&display=swap",
    },
    { rel: "stylesheet", href: tw },
  ];
};

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-white text-black dark:bg-black dark:text-white max-w-xl m-auto">
        <main className="p-6">
          <Outlet />
        </main>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-white text-black">
        <main className="flex flex-col justify-center items-center min-h-screen">
          <h1 className="font-bold text-3xl mb-4">
            {isRouteErrorResponse(error)
              ? `${error.status} ${error.statusText}`
              : error instanceof Error
              ? error.message
              : "Unknown error"}
          </h1>

          <Link
            className="underline underline-offset-4 focus:outline outline-1 outline-offset-8 outline-black"
            to="/"
          >
            Go back home
          </Link>
        </main>
      </body>
    </html>
  );
}
