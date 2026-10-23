import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { readAndoCollection } from "../scripts/build-ando-collection.mjs";

const metadata = { name: "建築 A", location: "茨木・大阪", country: "日本", coordinates: [34.8, 135.5] };
async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), "ando-collection-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}
async function building(root, name, info, photos) {
  const folder = path.join(root, name);
  await mkdir(folder);
  if (info) await writeFile(path.join(folder, "building.json"), JSON.stringify(info));
  for (const filename of photos) await writeFile(path.join(folder, filename), "image fixture");
}

test("scans photos in natural order and URL-encodes Japanese names and punctuation", async (t) => {
  const root = await fixture(t);
  await building(root, "光の教会", metadata, ["10.JPG", "2.jpg", "1 #?.webp", "notes.txt", "raw.HEIC"]);
  const collection = await readAndoCollection(root);
  const photos = collection.buildings[0].photos;
  assert.equal(photos.length, 3);
  assert.equal(photos[0].id, "光の教会/1 #?.webp");
  assert.equal(photos[1].id, "光の教会/2.jpg");
  assert.equal(photos[2].id, "光の教会/10.JPG");
  assert.equal(photos[0].src, `/photos/ando/${encodeURIComponent("光の教会")}/1%20%23%3F.webp`);
});

test("empty folders and templates never become visits", async (t) => {
  const root = await fixture(t);
  await building(root, "empty", metadata, []);
  await building(root, "_template", metadata, ["01.jpg"]);
  await building(root, ".hidden", metadata, ["01.jpg"]);
  assert.deepEqual(await readAndoCollection(root), { buildings: [] });
});

test("photos without building metadata report an actionable error", async (t) => {
  const root = await fixture(t);
  await building(root, "missing-metadata", null, ["01.jpg"]);
  await assert.rejects(readAndoCollection(root), /missing-metadata\/building.json.*_template/);
});

test("invalid coordinates fail the build instead of placing a false map point", async (t) => {
  const root = await fixture(t);
  await building(root, "invalid", { ...metadata, coordinates: [135, 34] }, ["01.png"]);
  await assert.rejects(readAndoCollection(root), /coordinates/);
});
