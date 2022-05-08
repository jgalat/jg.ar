export type TwitterRequestTokenResponse =
  | {
      oauth_token: string;
      oauth_token_secret: string;
      oauth_callback_confirmed: true;
    }
  | {
      oauth_callback_confirmed: false;
    };

export type TwitterAccessToken = {
  oauth_token: string;
  oauth_token_secret: string;
  user_id: string;
  screen_name: string;
};

export type TwitterTweetResponse = {
  data: {
    id: string;
    text: string;
  };
};
