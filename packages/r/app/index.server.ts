export namespace Index {
  export type Params = {
    q: string;
    size?: number;
    page?: number;
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

  private init(path: string): Request {
    return new Request(
      `${this.URL.protocol}//${this.URL.host}${this.URL.pathname}${path}`,
      {
        method: "GET",
        headers: {
          Authorization:
            "Basic " + btoa(this.URL.username + ":" + this.URL.password),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
  }

  private query({ q, size = 20, page = 0 }: Index.Params): URLSearchParams {
    const query = q
      .split(" ")
      .map((s) => s.trim())
      .join(" AND ");
    const categories = this.cats.map((c) => "cat:" + c).join(" OR ");

    const sp = new URLSearchParams();
    sp.append("q", `title:(${query}) AND (${categories})`);
    sp.append("size", String(size));
    sp.append("from", String(page * size));

    return sp;
  }

  async search(params: Index.Params): Promise<Index.Response> {
    const init = this.init("/torrents/_search");
    const query = this.query(params);

    const request = new Request(init.url + "?" + query, init);
    const response = await fetch(request);

    if (!response.ok) {
      throw new Error(response.status + " " + response.statusText);
    }

    return (await response.json()) as Index.Response;
  }
}
