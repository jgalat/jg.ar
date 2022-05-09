import { TwitterAccessToken } from "./types";

declare global {
  const TWITTER_TOKENS: KVNamespace;
}

class Storage<T> {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  async put(key: string, token: T) {
    await this.kv.put(key, JSON.stringify(token));
  }

  async get(key: string): Promise<T | null> {
    const raw = await this.kv.get(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  }
}

export const TwitterTokenStorage = new Storage<TwitterAccessToken>(TWITTER_TOKENS);
