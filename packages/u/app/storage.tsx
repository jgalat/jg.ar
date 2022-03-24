import { customAlphabet } from "nanoid";

declare global {
  const URLS: KVNamespace;
}

interface Stats {
  redirects: number;
}

export interface ShortURL {
  key: string;
  href: string;
  stats: Stats;
}

export class ShortURL {
  constructor(key: string, href: string) {
    return { key, href, stats: { redirects: 0 } };
  }

  static parse(raw: string): ShortURL {
    return JSON.parse(raw) as ShortURL;
  }
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export async function getShortURL(key: string): Promise<ShortURL> {
  const raw = await URLS.get(key);
  if (!raw) {
    return Promise.reject(new StorageError("not found"));
  }
  return ShortURL.parse(raw);
}

const uid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 5);

export async function putShortURL(
  href: string,
  slug?: string
): Promise<ShortURL> {
  const url = new URL(href);

  let key;
  if (slug) {
    key = `~${slug}`;
    const shortUrl = await URLS.get(key);
    if (shortUrl) {
      return Promise.reject(new StorageError("slug already taken"));
    }
  } else {
    do {
      key = uid();
    } while ((await URLS.get(key)) !== null);
  }

  const shortUrl: ShortURL = new ShortURL(key, url.href);
  await URLS.put(key, JSON.stringify(shortUrl));
  return shortUrl;
}

export async function redirectShortUrl(key: string): Promise<ShortURL> {
  const shortUrl = await getShortURL(key);
  shortUrl.stats.redirects += 1;
  await URLS.put(key, JSON.stringify(shortUrl));
  return shortUrl;
}
