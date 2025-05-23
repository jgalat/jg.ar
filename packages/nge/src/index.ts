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

	async tweet(text: string, media_ids: string[]) {
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
			body: JSON.stringify({ text, media: { media_ids } }),
		});

		const response = await fetch(request);
		if (!response.ok) {
			throw new Error("something went wrong");
		}

		return response.json();
	}

	async upload(file: ArrayBuffer): Promise<{ media_id_string: string }> {
		const auth = {
			url: "https://upload.twitter.com/1.1/media/upload.json",
			method: "POST",
		};

		const data = new FormData();

		data.append("media", new Blob([file]), "frame.jpg");

		const request = new Request(auth.url, {
			method: auth.method,
			headers: {
				...this.oauth.toHeader(this.oauth.authorize(auth, this.token)),
			},
			body: data,
		});

		const response = await fetch(request);
		if (!response.ok) {
			throw new Error("something went wrong");
		}

		return response.json();
	}
}

export interface Env {
	frames: R2Bucket;
	db: D1Database;

	TWITTER_CONSUMER_KEY: string;
	TWITTER_CONSUMER_SECRET: string;
	TWITTER_ACCESS_TOKEN_KEY: string;
	TWITTER_ACCESS_TOKEN_SECRET: string;
}

async function post(env: Env) {
	const client = new Twitter(env);

	const sync = await env.db
		.prepare("select * from sync limit 1")
		.first<{ episode: number; frame: number }>();

	if (sync == null) {
		return;
	}

	const episode = await env.db
		.prepare("select * from episodes where id = ?")
		.bind(sync.episode)
		.first<{ id: number; frames: number }>();

	if (episode == null) {
		return;
	}

	const key = `Neon_Genesis_Evangelion_EP_(${String(sync.episode).padStart(
		2,
		"0"
	)})_frame_${String(sync.frame).padStart(4, "0")}.jpg`;

	const file = await env.frames.get(key);

	if (file == null) {
		return;
	}

	const buf = await file.arrayBuffer();
	const media = await client.upload(buf);

	const text = [
		"NEON GENESIS EVANGELION",
		`EPISODE:${sync.episode}`,
		`Frame ${sync.frame} / ${episode.frames}`,
	].join("\n");

	await client.tweet(text, [media.media_id_string]);

	const nextEpisode =
		sync.frame === episode.frames ? sync.episode + 1 : sync.episode;
	const nextFrame = sync.frame === episode.frames ? 1 : sync.frame + 1;

	await env.db
		.prepare("update sync set episode = ?, frame = ? limit 1")
		.bind(nextEpisode, nextFrame)
		.run();
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname === "/__trigger") {
			ctx.waitUntil(post(env));
		}
		return new Response(
			"I post Neon Genesis Evangelion frames every 30 minutes @nge_frames"
		);
	},

	async scheduled(
		controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext
	) {
		ctx.waitUntil(post(env));
	},
};
