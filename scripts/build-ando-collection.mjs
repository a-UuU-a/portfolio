import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
export const photoExtension = /\.(jpe?g|png|webp|avif)$/i;

function requiredText(value, key, folder) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${folder}/building.json: ${key} に文字列を指定してください。`);
  return value.trim();
}

export async function readAndoCollection(root) {
  const buildings = [];
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }))) {
    if (!entry.isDirectory() || /^[._]/.test(entry.name)) continue;
    const folder = path.join(root, entry.name);
    const files = (await readdir(folder, { withFileTypes: true }))
      .filter((file) => file.isFile() && photoExtension.test(file.name) && !file.name.startsWith("."))
      .map((file) => file.name)
      .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
    if (!files.length) continue;
    let metadata;
    try {
      metadata = JSON.parse(await readFile(path.join(folder, "building.json"), "utf8"));
    } catch (error) {
      throw new Error(`${entry.name}/building.json を読み込めません。_template/building.json をコピーし、建築の情報を記入してください。`, { cause: error });
    }
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) throw new Error(`${entry.name}/building.json: JSON オブジェクトを指定してください。`);
    const name = requiredText(metadata.name, "name", entry.name);
    const location = requiredText(metadata.location, "location", entry.name);
    const country = requiredText(metadata.country, "country", entry.name);
    const coordinates = metadata.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length !== 2 || !coordinates.every(Number.isFinite) || Math.abs(coordinates[0]) > 90 || Math.abs(coordinates[1]) > 180) {
      throw new Error(`${entry.name}/building.json: coordinates は [緯度 (-90〜90), 経度 (-180〜180)] で指定してください。`);
    }
    const optional = {};
    for (const key of ["nameEn", "note"]) {
      if (metadata[key] !== undefined && metadata[key] !== "") optional[key] = requiredText(metadata[key], key, entry.name);
    }
    buildings.push({
      id: entry.name, name, location, country, coordinates, ...optional,
      photos: files.map((filename, index) => ({
        id: `${entry.name}/${filename}`,
        src: `/photos/ando/${encodeURIComponent(entry.name)}/${encodeURIComponent(filename)}`,
        alt: `${name} — ${path.parse(filename).name}（${index + 1}）`,
      })),
    });
  }
  return { buildings };
}

async function main() {
  const collection = await readAndoCollection(path.join(projectRoot, "public/photos/ando"));
  const destination = path.join(projectRoot, "public/data/ando-collection.json");
  await mkdir(path.dirname(destination), { recursive: true });
  const output = `${JSON.stringify(collection, null, 2)}\n`;
  let previous;
  try { previous = await readFile(destination, "utf8"); } catch { /* First build. */ }
  if (previous !== output) await writeFile(destination, output);
  const count = collection.buildings.reduce((sum, building) => sum + building.photos.length, 0);
  console.log(`Ando archive: ${collection.buildings.length} buildings, ${count} photos.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
