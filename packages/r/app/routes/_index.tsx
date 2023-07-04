import { type LoaderArgs, json } from "@remix-run/cloudflare";
import { Form, useLoaderData, useSearchParams } from "@remix-run/react";

import Link from "~/components/link";
import Table from "~/components/table";
import pagination from "~/utils/pagination";

const PAGE_SIZE = 20;
const VISIBLE = 7;

export async function loader({ request, context: { index } }: LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const page = url.searchParams.get("page");
  if (!q) {
    return json(null, 200);
  }

  const p = Number.isNaN(Number(page)) ? 0 : Math.max(Number(page), 0);
  const response = await index.search({ q, page: p, size: PAGE_SIZE });
  if (response.timed_out) {
    throw new Error("Request timed out");
  }

  return json(response, {
    status: 200,
    headers: {
      "Cache-Control":
        "public, max-age=86400, s-maxage=604800, stale-while-revalidate=31540000000",
    },
  });
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const [sp] = useSearchParams();

  const pages = Math.floor((data?.hits.total.value ?? 0) / PAGE_SIZE);
  const page = Number(sp.get("page") ?? "0");
  const current = Number.isNaN(page) ? 0 : Math.min(Math.max(page, 0), pages);

  const url = (p: number) => {
    const s = new URLSearchParams(sp);
    s.set("page", String(p));
    return "?" + s;
  };

  return (
    <>
      <h1 className="font-serif text-center text-6xl font-bold uppercase text-shadow-3d">
        Search
      </h1>
      <Form className="mt-8" action="/">
        <label className="sr-only">Search for a torrent</label>
        <input
          defaultValue={sp.get("q") || ""}
          name="q"
          type="text"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          className="w-full p-3 text-black border-2 border-black focus-visible:outline outline-2 outline-pink-500"
        />
      </Form>
      {data !== null && (
        <div className="mt-8">
          {data.hits.total.value === 0 ? (
            <p className="text-center">No results found</p>
          ) : (
            <>
              <Table hits={data.hits.hits} />
              <nav aria-label="pagination" className="mt-8 mb-4">
                <ul className="flex justify-between">
                  <li>
                    {current === 0 ? (
                      <span aria-hidden="true">{"<<"}</span>
                    ) : (
                      <Link to={url(current - 1)} aria-label="Previous page">
                        {"<<"}
                      </Link>
                    )}
                  </li>
                  {pagination(VISIBLE, current, pages).map((p) => (
                    <li key={p < 0 ? `ellipsis${p}` : p}>
                      {p >= 0 ? (
                        <Link
                          to={url(p)}
                          aria-current={p === current}
                          className={p === current ? "no-underline" : undefined}
                        >
                          <span className="sr-only">Page</span>
                          {p}
                        </Link>
                      ) : (
                        <span aria-hidden="true">…</span>
                      )}
                    </li>
                  ))}

                  <li>
                    {current === pages ? (
                      <span aria-hidden="true">{">>"}</span>
                    ) : (
                      <Link to={url(current + 1)} aria-label="Next page">
                        {">>"}
                      </Link>
                    )}
                  </li>
                </ul>
              </nav>
            </>
          )}
        </div>
      )}
    </>
  );
}
