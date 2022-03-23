import { Form, useTransition, useActionData, json, Link } from "remix";
import type { ActionFunction } from "remix";

export const action: ActionFunction = async ({ request }) => {
  const url = new URL(request.url);
  const data = await request.formData();
  const body = { url: data.get("url"), slug: data.get("slug") || null };
  const response = await fetch(`${url.origin}/api`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  return json(await response.json());
};

export default function Index() {
  const transition = useTransition();
  const data = useActionData<{ href?: string; key?: string; error?: string }>();
  return (
    <>
      <h1>URL Shortener</h1>
      <p style={{ marginBottom: "1rem" }}>
        Reduce the size of URLs and monitor its traffic statistics.
      </p>
      <Form method="post">
        <fieldset disabled={transition.state === "submitting"}>
          <legend>
            Paste the URL to be shortened. Optionally, you can name the
            resulting link.
          </legend>
          <label htmlFor="url">URL</label>
          <input id="url" name="url" type="url" required />
          <label htmlFor="slug">Slug (only [a-zA-Z_-], max length: 30)</label>
          <input
            id="slug"
            name="slug"
            type="text"
            pattern="[0-9a-zA-Z_-]*"
            maxLength={30}
          />
          <button type="submit">
            {transition.state === "submitting" ? "Submitting..." : "Submit"}
          </button>

          {data && (
            <div style={{ marginTop: "1.5rem" }}>
              {data?.error ? (
                <p className="error">{data?.error}</p>
              ) : (
                <p>
                  {`https://u.jg.ar/${data?.key}`}
                  {" - "}
                  <Link to={`/s/${data?.key}`}>Stats</Link>
                </p>
              )}
            </div>
          )}
        </fieldset>
      </Form>
    </>
  );
}
