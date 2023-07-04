import { Client } from "@elastic/elasticsearch";
import fs from "fs";
import csv from "csv-parser";

const client = new Client({
  node: process.env.ELASTICSEARCH_URL,
});

const doc = (row) => ({
  id: row.id,
  hash: row.hash,
  title: row.title,
  dt: row.dt,
  cat: row.cat,
  size: parseInt(row.size),
  ext_id: row.ext_id,
  imdb: row.imdb,
});

const bulk = async (data) => {
  const body = data.flatMap((doc) => [
    { index: { _index: "torrents", _id: doc.id } },
    doc,
  ]);

  const { body: bulkResponse } = await client.bulk({ refresh: true, body });

  if (bulkResponse.errors) {
    console.error("Encountered errors during bulk indexing");
  }
};

const data = [];
const chunkSize = 5000;

fs.createReadStream(process.argv[2])
  .pipe(csv())
  .on("data", (row) => {
    data.push(doc(row));
  })
  .on("end", async () => {
    console.log("Data size: ", data.length);
    const steps = Math.ceil(data.length / chunkSize);
    for (let i = 0; i <= steps; i++) {
      const chunk = data.slice(i * chunkSize, i * chunkSize + chunkSize);
      console.log(i, chunk.length);
      try {
        await bulk(chunk);
      } catch (error) {
        console.error("Error during bulk indexing:", error);
      }
    }
  });
