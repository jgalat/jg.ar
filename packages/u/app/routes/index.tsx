import { Form, useTransition, useActionData, json, Link } from "remix";
import type { ActionFunction } from "remix";
import { StorageError, putShortURL } from "storage.server";
import type { ShortURL } from "storage.server"

export const action: ActionFunction = async ({ request }) => {
  const data = Object.fromEntries(await request.formData());

  if (!data.url || typeof data.url !== "string") {
    return json({ error: "url is required" }, { status: 400 });
  }

  try {
    new URL(data.url);
  } catch (e) {
    return json({ error: "invalid url" }, { status: 400 });
  }

  if (data.slug) {
    if (typeof data.slug !== "string") {
      return json({ error: "slug needs to be string" }, { status: 400 });
    }
    if (!/[0-9a-zA-Z_-]*/.test(data.slug)) {
      return json({ error: "slug has incorrect pattern" }, { status: 400 });
    }

    if (data.slug.length > 30) {
      return json({ error: "slug is too long" }, { status: 400 });
    }
  }


  try {
    const shortUrl = await putShortURL(data.url, data.slug);
    return json({ value: shortUrl });
  } catch (e) {
    if (e instanceof StorageError) {
      return json({ error: e.message }, { status: 400 });
    }

    console.error(e);
    return json({ error: "internal server error" }, { status: 500 });
  }
};

export default function Index() {
  const transition = useTransition();
  const data = useActionData<{ value?: ShortURL; error?: string }>();

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
                  {`https://u.jg.ar/${data?.value?.key}`}
                  {" - "}
                  <Link to={`/s/${data?.value?.key}`}>Stats</Link>
                </p>
              )}
            </div>
          )}
        </fieldset>
      </Form>
    </>
  );
}
