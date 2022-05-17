import { Router } from "itty-router";

import { requestToken, authorizeURL, accessToken } from "./twitter";
import { TwitterTokenStorage } from "./storage";

const router = Router();

router.get("/", () => {
  return new Response("Feliz Jueves", { status: 200 });
});

router.get("/auth", async (request) => {
  try {
    const url = new URL(request.url);
    url.pathname = "/callback";

    const tokenResponse = await requestToken(url.href);
    if (!tokenResponse.oauth_callback_confirmed) {
      throw new Error("unable to request token");
    }
    return Response.redirect(authorizeURL(tokenResponse.oauth_token));
  } catch (err) {
    console.error(err);
    return new Response("authorization went wrong", { status: 500 });
  }
});

router.get("/callback", async (request) => {
  try {
    const { query } = request;
    const accessTokenResponse = await accessToken(
      query?.oauth_token!,
      query?.oauth_verifier!
    );

    await TwitterTokenStorage.put(
      accessTokenResponse.user_id,
      accessTokenResponse
    );

    return new Response("authorized", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("authorization went wrong", { status: 500 });
  }
});

router.all("*", () => new Response("not found", { status: 404 }));

export default router;
