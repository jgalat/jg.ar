export namespace Index {
  export type Params = {
    q: string;
    size: number;
    page: number;
  };

  export type Response =
    | {
        timed_out: true;
      }
    | {
        took: number;
        timed_out: false;
        hits: Hits;
      };

  export type Hits = {
    total: Total;
    max_score: number;
    hits: Hit[];
  };

  export type Hit = {
    _index: Index;
    _id: string;
    _score: number;
    _source: Source;
  };

  export type Source = {
    id: string;
    hash: string;
    title: string;
    cat: string;
    size: number | null;
    ext_id: string | null;
    imdb: string | null;
    dt: string;
  };

  export type Total = {
    value: number;
    relation: string;
  };
}

export default class Index {
  private URL: URL;
  private cats = [
    "movies",
    "movies_bd_full",
    "movies_bd_remux",
    "movies_x264",
    "movies_x264_3d",
    "movies_x264_4k",
    "movies_x264_720",
    "movies_x265",
    "movies_x265_4k",
    "movies_x265_4k_hdr",
    "movies_xvid",
    "movies_xvid_720",
    "tv",
    "tv_sd",
    "tv_uhd",
  ];

  constructor(url: string) {
    this.URL = new URL(url);
  }

  private request(path: string, body?: BodyInit | null): Request {
    return new Request(
      `${this.URL.protocol}//${this.URL.host}${this.URL.pathname}${path}`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " + btoa(this.URL.username + ":" + this.URL.password),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body,
      }
    );
  }

  async search(params: Index.Params): Promise<Index.Response> {
    const request = this.request(
      "/es/torrents/_search",
      JSON.stringify({
        query: {
          bool: {
            must: params.q
              .trim()
              .split(" ")
              .map((tok) => ({ match: { title: tok } })),
            filter: [
              {
                terms: {
                  cat: this.cats,
                },
              },
            ],
          },
        },
        size: params.size,
        from: params.page * params.size,
      })
    );

    const response = await fetch(request);

    if (!response.ok) {
      throw new Error(response.status + " " + response.statusText);
    }

    return (await response.json()) as Index.Response;
  }
}
