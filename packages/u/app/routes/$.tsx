import { LoaderFunction, useLoaderData, redirect, json } from "remix";
import { StorageError, redirectShortUrl } from "storage";

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const key = url.pathname.replace("/", "");
    const shortUrl = await redirectShortUrl(key);
    return redirect(shortUrl.href, { status: 301 });
  } catch (e) {
    if (e instanceof StorageError) {
      return json({ error: e.message }, { status: 404 });
    }

    console.error(e);
    return json({ error: "internal server error" }, { status: 500 });
  }
};

export default function Redirect() {
  const data = useLoaderData<{ error?: string }>();
  if (data.error) {
    return <h1>{data.error}</h1>;
  }
  return <h1>Redirecting...</h1>;
}
