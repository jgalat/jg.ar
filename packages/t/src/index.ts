import { HmacSHA1, enc } from "crypto-js";
import OAuth from "oauth-1.0a";

class Twitter {
	private oauth: OAuth;
	private token: { key: string; secret: string };
	constructor(env: Env) {
		this.oauth = new OAuth({
			consumer: {
				key: env.TWITTER_CONSUMER_KEY,
				secret: env.TWITTER_CONSUMER_SECRET,
			},
			signature_method: "HMAC-SHA1",
			hash_function: (baseString, key) =>
				HmacSHA1(baseString, key).toString(enc.Base64),
		});
		this.token = {
			key: env.TWITTER_ACCESS_TOKEN_KEY,
			secret: env.TWITTER_ACCESS_TOKEN_SECRET,
		};
	}

	async tweet(text: string) {
		const auth = {
			url: "https://api.twitter.com/2/tweets",
			method: "POST",
		};

		const request = new Request(auth.url, {
			method: auth.method,
			headers: {
				...this.oauth.toHeader(this.oauth.authorize(auth, this.token)),
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ text }),
		});

		const response = await fetch(request);
		if (!response.ok) {
			throw new Error("something went wrong");
		}

		return new Response(await response.json());
	}
}

export interface Env {
	TWITTER_CONSUMER_KEY: string;
	TWITTER_CONSUMER_SECRET: string;
	TWITTER_ACCESS_TOKEN_KEY: string;
	TWITTER_ACCESS_TOKEN_SECRET: string;
}

const worker: ExportedHandler<Env> = {
	async fetch() {
		return new Response("Feliz Jueves", { status: 200 });
	},
	async scheduled(controller, env, ctx) {
		const twitter = new Twitter(env);
		ctx.waitUntil(twitter.tweet("Feliz Jueves"));
	},
};

export default worker;
