import { LoaderFunction, useLoaderData, redirect, json, Link } from "remix";
import { StorageError, redirectShortUrl, getShortURL } from "storage.server";
import type { ShortURL } from "storage.server";

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const key = url.pathname.replace("/", "");

    if (url.searchParams.has("stats")) {
      const shortUrl = await getShortURL(key);
      return json({ value: shortUrl });
    }

    const shortUrl = await redirectShortUrl(key);
    return redirect(shortUrl.href, { status: 302 });
  } catch (e) {
    if (e instanceof StorageError) {
      return json({ error: e.message }, { status: 404 });
    }

    console.error(e);
    return json({ error: "internal server error" }, { status: 500 });
  }
};

export default function Redirect() {
  const data = useLoaderData<{ value?: ShortURL; error?: string }>();

  if (data?.error) {
    return (
      <>
        <h1>{data?.error}</h1>
        <p>
          <Link to="/">Go back to home</Link>
        </p>
      </>
    );
  }

  const { key, href, stats } = data?.value!;

  return (
    <>
      <h1>Stats for {`https://u.jg.ar/${key}`}</h1>
      <ul>
        <li>
          Redirects to: <a href={href}>{href}</a>
        </li>
        <li>Redirects #: {stats?.redirects}</li>
      </ul>
    </>
  );
}
