import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, watchFile, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPortfolio, makeCvData } from "./cv-data.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cache = join(root, "cv/.cache");
const output = join(root, "public/cv/akira-murakami-cv.pdf");
const manifest = join(root, "public/cv/build.json");
const inputs = [
  "lib/portfolio-data.ts", "cv/main.typ", "scripts/cv-data.mjs", "scripts/build-cv.mjs",
  "cv/fonts/Cochineal-Roman.otf", "cv/fonts/Cochineal-Bold.otf",
  "cv/fonts/Cochineal-Italic.otf", "cv/fonts/Cochineal-BoldItalic.otf",
  "cv/fonts/Cabin-Bold.otf", "cv/fonts/Inconsolatazi4-Regular.otf", "cv/fonts/NotoSerifJP.ttf",
  "cv/icons/mail.svg", "cv/icons/website.svg", "cv/icons/google-scholar.svg",
];
const args = new Set(process.argv.slice(2));
if ([...args].some((arg) => !["--watch", "--check"].includes(arg)) || (args.has("--watch") && args.has("--check"))) {
  console.error("Usage: npm run cv [-- --watch | --check]");
  process.exit(1);
}

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://a-uuu-a.github.io");
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "/portfolio").replace(/\/$/, "");
const website = new URL(`${basePath}/en/`, siteUrl).href;

function sourceHash() {
  const hash = createHash("sha256").update(website);
  for (const file of inputs) hash.update(file).update(readFileSync(join(root, file)));
  return hash.digest("hex");
}

function asOfDate() {
  const asOf = process.env.CV_DATE || new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf) || Number.isNaN(Date.parse(asOf)) || new Date(asOf).toISOString().slice(0, 10) !== asOf) {
    throw new Error("CV_DATE must be a valid date in YYYY-MM-DD format.");
  }
  return asOf;
}

async function build() {
  const asOf = asOfDate();
  const data = makeCvData(await loadPortfolio(join(root, "lib/portfolio-data.ts")), asOf, website);
  mkdirSync(cache, { recursive: true });
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(join(cache, "data.json"), `${JSON.stringify(data, null, 2)}\n`);
  const localTypst = join(cache, "bin/typst");
  const binary = process.env.TYPST_BIN || (existsSync(localTypst) ? localTypst : "typst");
  const temporary = join(cache, "cv.pdf");
  const result = spawnSync(binary, [
    "compile", "--root", root, "--font-path", join(root, "cv/fonts"), "--ignore-system-fonts",
    "--creation-timestamp", String(Date.parse(`${asOf}T00:00:00Z`) / 1000),
    join(root, "cv/main.typ"), temporary,
  ], { stdio: "inherit" });
  if (result.error?.code === "ENOENT") throw new Error("Typst was not found. Run npm run cv:setup first (or set TYPST_BIN).");
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error("Typst compilation failed; the existing published PDF was kept.");
  renameSync(temporary, output);
  writeFileSync(manifest, `${JSON.stringify({ updated: asOf, sourceHash: sourceHash() }, null, 2)}\n`);
  console.log(`CV generated: public/cv/akira-murakami-cv.pdf (updated ${asOf})`);
}

try {
  if (args.has("--check")) {
    if (!existsSync(output) || !existsSync(manifest) || JSON.parse(readFileSync(manifest, "utf8")).sourceHash !== sourceHash()) {
      throw new Error("The CV is missing or out of date. Run npm run cv and include public/cv/ in your changes.");
    }
    console.log("The checked-in CV matches its source data, template, and fonts.");
  } else {
    await build();
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

if (args.has("--watch")) {
  let timer;
  const paths = ["lib/portfolio-data.ts", "cv/main.typ", ...inputs.filter((file) => file.startsWith("cv/icons/"))];
  for (const file of paths) {
    // Polling also handles atomic editor saves and environments with low limits
    // on native filesystem watchers.
    watchFile(join(root, file), { interval: 750 }, (current, previous) => {
      if (current.mtimeMs === previous.mtimeMs && current.size === previous.size) return;
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try { await build(); process.exitCode = 0; }
        catch (error) { console.error(error.message); process.exitCode = 1; }
      }, 250);
    });
  }
  console.log("Watching CV data and template. Save a file to regenerate; Ctrl+C to stop.");
}
