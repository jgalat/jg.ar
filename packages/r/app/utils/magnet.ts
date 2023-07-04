import type { Index } from "~/index.server";

export function link({
  title,
  hash,
}: Pick<Index.Source, "title" | "hash">): string {
  return `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(
    title
  )}&tr=udp%3A%2F%2F93.158.213.92%3A1337%2Fannounce&tr=udp%3A%2F%2F102.223.180.235%3A6969%2Fannounce&tr=udp%3A%2F%2F45.154.253.7%3A6969%2Fannounce&tr=http%3A%2F%2F45.154.253.7%3A80%2Fannounce&tr=udp%3A%2F%2F185.44.82.25%3A1337%2Fannounce&tr=udp%3A%2F%2F185.181.60.155%3A80%2Fannounce&tr=udp%3A%2F%2F91.216.110.52%3A451%2Fannounce&tr=udp%3A%2F%2F107.189.11.58%3A6969%2Fannounce&tr=udp%3A%2F%2F156.234.201.18%3A80%2Fannounce&tr=udp%3A%2F%2F176.56.4.238%3A6969%2Fannounce&tr=udp%3A%2F%2F178.170.48.154%3A1337%2Fannounce&tr=udp%3A%2F%2F185.230.4.150%3A1337%2Fannounce&tr=udp%3A%2F%2F198.100.149.66%3A6969%2Fannounce&tr=udp%3A%2F%2F94.103.87.87%3A6969%2Fannounce&tr=udp%3A%2F%2F185.102.219.163%3A6969%2Fannounce&tr=udp%3A%2F%2F163.172.29.130%3A80%2Fannounce`;
}
