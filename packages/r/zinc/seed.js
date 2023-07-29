import fs from "fs";
import csv from "csv-parser";

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

const url = new URL(process.env.ZINC_URL);

const bulk = async (data) => {
  const rows = data.flatMap((doc) => [
    { index: { _index: "torrents", _id: doc.id } },
    doc,
  ]);

  const body = rows.map((row) => JSON.stringify(row)).join("\n");

  const request = new Request(
    `${url.protocol}//${url.host}${url.pathname}es/_bulk`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(url.username + ":" + url.password),
      },
      body,
    }
  );

  const response = await fetch(request);

  console.log(response.ok ? "OK" : "ERROR", response.status);
};

const data = [];
const chunkSize = 10000;

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
