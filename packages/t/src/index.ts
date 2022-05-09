import router from "./router";
import { TwitterTokenStorage } from "./storage";
import { tweet } from "./twitter";

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(router.handle(event.request));
});

addEventListener("scheduled", (event) => {
  const thursday = async (): Promise<void> => {
    const token = await TwitterTokenStorage.get("1522315995439845377");
    if (!token) {
      return;
    }
    await tweet(token.oauth_token, token.oauth_token_secret, "Feliz Jueves");
  };

  event.waitUntil(thursday());
});
