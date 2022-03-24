import { useLoaderData, json } from "remix";
import type { LoaderFunction } from "remix";
import { StorageError, ShortURL, getShortURL } from "storage";

export const loader: LoaderFunction = async ({ params }) => {
  try {
    const key: string = params.key!;
    const shortUrl = await getShortURL(key);
    return json({ value: shortUrl });
  } catch (e) {
    if (e instanceof StorageError) {
      return json({ error: e.message }, { status: 404 });
    }

    console.error(e);
    return json({ error: "internal server error" }, { status: 500 });
  }
};

export default function Stats() {
  const data = useLoaderData<{ value?: ShortURL; error?: string }>();

  if (data?.error) {
    return <h1>{data?.error}</h1>;
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

export function ErrorBoundary({ error }: { error: any }) {
  console.log(error);
  return <h1>{error}</h1>;
}
