import type { V2_MetaFunction, LinksFunction } from "@remix-run/cloudflare";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
} from "@remix-run/react";

import tw from "./tailwind.css";

export const meta: V2_MetaFunction = () => {
  return [
    { charset: "utf-8" },
    { title: "Jorge Galat <jgalat>" },
    {
      name: "description",
      content:
        "Jorge Galat - I'm a full stack developer based in Rosario, Argentina",
    },
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1.0",
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
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <main>
          <h1>Not found :(</h1>
          <p>
            <Link to="/">Go back to home</Link>
          </p>
        </main>
      </body>
    </html>
  );
}
