import type { MetaFunction, LinksFunction } from "@remix-run/cloudflare";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
} from "@remix-run/react";
import styles from "styles/lib/global.css";

export const meta: MetaFunction = () => {
  return {
    title: "Jorge Galat <jgalat>",
    description: `Jorge Galat - I'm a full stack developer based in Rosario, Argentina`,
    charset: "utf-8",
    viewport: "width=device-width,initial-scale=1",
  };
};

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: styles }];
};

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function CatchBoundary() {
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
