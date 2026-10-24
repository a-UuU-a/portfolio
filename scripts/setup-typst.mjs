import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Official, pinned Typst release. Digests come from its GitHub release assets.
const version = "0.15.1";
const targets = {
  "darwin-arm64": ["aarch64-apple-darwin", "48f62ed034aa3a7978309579ac6ca00045e2ef0da73114e8af27cfd8e74dc05a"],
  "darwin-x64": ["x86_64-apple-darwin", "7f9fdd9584866245de9a79e0add8f9236fae6f40a8a45e2c4771ccc14db4e0fa"],
  "linux-arm64": ["aarch64-unknown-linux-musl", "5aa8d74a3d906e60ea12a66ac2f37f8eef1b14cbad7182a745e393a10c23dcee"],
  "linux-x64": ["x86_64-unknown-linux-musl", "a6d077d0a95eed5a2eba715b2dae06be954f624ccbf85758a03f389ded33118c"],
};
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = targets[`${process.platform}-${process.arch}`];

if (!target) {
  console.error("Install the Typst CLI from https://github.com/typst/typst/releases and put it on PATH (or set TYPST_BIN).");
  process.exitCode = 1;
} else {
  const [triple, digest] = target;
  const temporary = mkdtempSync(join(tmpdir(), "portfolio-typst-"));
  try {
    console.log(`Downloading official Typst ${version} for ${triple}…`);
    const response = await fetch(`https://github.com/typst/typst/releases/download/v${version}/typst-${triple}.tar.xz`, {
      signal: AbortSignal.timeout(90_000),
    });
    if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
    const archive = Buffer.from(await response.arrayBuffer());
    if (createHash("sha256").update(archive).digest("hex") !== digest) {
      throw new Error("The Typst download did not match the official SHA-256 digest.");
    }
    const archivePath = join(temporary, "typst.tar.xz");
    writeFileSync(archivePath, archive);
    execFileSync("tar", ["-xJf", archivePath, "-C", temporary, `typst-${triple}/typst`]);
    const destination = join(root, "cv/.cache/bin/typst");
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(temporary, `typst-${triple}/typst`), destination);
    chmodSync(destination, 0o755);
    console.log(execFileSync(destination, ["--version"], { encoding: "utf8" }).trim());
    console.log("Installed only in cv/.cache/bin. Run npm run cv to generate the PDF.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}
