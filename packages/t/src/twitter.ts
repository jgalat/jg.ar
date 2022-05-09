import { HmacSHA1, enc } from "crypto-js";
import OAuth from "oauth-1.0a";
import qs from "querystring";

import {
  TwitterRequestTokenResponse,
  TwitterAccessToken,
  TwitterTweetResponse,
} from "./types";

declare global {
  const TWITTER_CONSUMER_KEY: string;
  const TWITTER_CONSUMER_SECRET: string;
}

const oauth = new OAuth({
  consumer: {
    key: TWITTER_CONSUMER_KEY,
    secret: TWITTER_CONSUMER_SECRET,
  },
  signature_method: "HMAC-SHA1",
  hash_function: (baseString, key) =>
    HmacSHA1(baseString, key).toString(enc.Base64),
});

export async function requestToken(
  callback: string
): Promise<TwitterRequestTokenResponse> {
  const query = qs.encode({
    oauth_callback: callback,
  });
  const url = `https://api.twitter.com/oauth/request_token?${query}`;
  const authorization = oauth.toHeader(
    oauth.authorize({
      url,
      method: "POST",
    })
  );

  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...authorization,
    },
  });

  const text = await response.text();
  return qs.parse(text) as TwitterRequestTokenResponse;
}

export function authorizeURL(oauth_token: string): string {
  return `https://api.twitter.com/oauth/authorize?oauth_token=${oauth_token}`;
}

export async function accessToken(
  oauth_token: string,
  verifier: string
): Promise<TwitterAccessToken> {
  let url = "https://api.twitter.com/oauth/access_token";
  const authorization = oauth.toHeader(
    oauth.authorize({
      url,
      method: "POST",
    })
  );
  url = `${url}?oauth_verifier=${verifier}&oauth_token=${oauth_token}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...authorization,
    },
  });

  const text = await response.text();
  return qs.parse(text) as TwitterAccessToken;
}

export async function tweet(
  oauth_token: string,
  oauth_token_secret: string,
  text: string
) {
  const token = {
    key: oauth_token,
    secret: oauth_token_secret,
  };

  const url = `https://api.twitter.com/2/tweets`;
  const authorization = oauth.toHeader(
    oauth.authorize(
      {
        url,
        method: "POST",
      },
      token
    )
  );

  const response = await fetch(url, {
    body: JSON.stringify({ text }),
    method: "POST",
    headers: {
      ...authorization,
      "Content-Type": "application/json",
      accept: "application/json",
    },
  });

  const json = await response.json();
  return json as TwitterTweetResponse;
}
