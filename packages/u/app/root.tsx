import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "remix";
import type { LinksFunction, MetaFunction } from "remix";
import styles from "styles/lib/global.css";

export const meta: MetaFunction = () => ({
  title: "URL Shortener",
  description: "Shorten URLs to share them and monitor traffic statistics",
  charset: "utf-8",
  viewport: "width=device-width,initial-scale=1",
});

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
        <main>
          <Outlet />
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </main>
      </body>
    </html>
  );
}
