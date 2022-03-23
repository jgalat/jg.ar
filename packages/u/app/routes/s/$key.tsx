import { useLoaderData, json } from "remix";
import type { LoaderFunction } from "remix";

export const loader: LoaderFunction = async ({ params, request }) => {
  const url = new URL(request.url);
  const response = await fetch(`${url.origin}/api/${params.key}`);
  if (response.status === 404) {
    return json({ error: "not found" });
  }

  return json(await response.json());
};

export default function Stats() {
  const data = useLoaderData<{
    href?: string;
    key?: string;
    redirects?: number;
    error?: string;
  }>();

  if (data?.error) {
    return <h1>{data?.error}</h1>;
  }

  return (
    <>
      <h1>Stats for {`https://u.jg.ar/${data?.key}`}</h1>
      <ul>
        <li>
          Redirects to: <a href={data?.href}>{data?.href}</a>
        </li>
        <li>Redirects #: {data?.redirects}</li>
      </ul>
    </>
  );
}
