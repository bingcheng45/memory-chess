import { parentPort } from "node:worker_threads";
import { PGlite } from "@electric-sql/pglite";

// PGlite.create() takes about 600 ms. Loading the dump of a cluster that
// already ran initdb takes about 100 ms, which is what lets every test open
// its own database.
const template = await PGlite.create();
const freshCluster = await template.dumpDataDir("none");
await template.close();

const databases = new Map();

const handlers = {
  ready: async () => [],
  open: async ({ database }) => {
    databases.set(database, await PGlite.create({ loadDataDir: freshCluster }));
    return [];
  },
  run: async ({ database, sql }) => {
    const results = await databases.get(database).exec(sql);
    return results.at(-1)?.rows ?? [];
  },
  singleStatement: async ({ database, sql }) => (await databases.get(database).query(sql)).rows,
  closeAll: async () => {
    const open = [...databases.values()];
    databases.clear();
    await Promise.all(open.map((database) => database.close()));
    return [];
  },
};

parentPort.on("message", async ({ id, ...request }) => {
  try {
    const rows = await handlers[request.kind](request);
    parentPort.postMessage({ id, ok: true, rows });
  } catch (error) {
    parentPort.postMessage({ id, ok: false, code: error.code ?? null, message: error.message });
  }
});
