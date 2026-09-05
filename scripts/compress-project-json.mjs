import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const target = process.argv[2] ?? "public/content/project.json";
const maxDimension = Number(process.argv[3] ?? 2200);
const quality = process.argv[4] ?? "82";
const project = JSON.parse(readFileSync(target, "utf8"));
const tmp = mkdtempSync(join(tmpdir(), "pardo-content-"));

let optimized = 0;

function extensionFromDataUrl(src) {
  if (src.startsWith("data:image/png")) return "png";
  if (src.startsWith("data:image/jpeg")) return "jpg";
  return "";
}

function compressDataUrl(src, index) {
  if (typeof src !== "string" || !src.startsWith("data:image/") || src.startsWith("data:image/svg+xml")) return src;
  if (src.length < 1_200_000) return src;
  const extension = extensionFromDataUrl(src);
  if (!extension) return src;
  const [, data = ""] = src.split(",");
  const input = join(tmp, `input-${index}.${extension}`);
  const output = join(tmp, `output-${index}.jpg`);
  writeFileSync(input, Buffer.from(data, "base64"));
  try {
    execFileSync("sips", ["-Z", String(maxDimension), "-s", "format", "jpeg", "-s", "formatOptions", quality, input, "--out", output], { stdio: "ignore" });
    const compressed = readFileSync(output);
    const next = `data:image/jpeg;base64,${compressed.toString("base64")}`;
    if (next.length < src.length) {
      optimized += 1;
      return next;
    }
  } catch {
    return src;
  }
  return src;
}

let counter = 0;

function walk(value) {
  if (typeof value === "string") {
    counter += 1;
    return compressDataUrl(value, counter);
  }
  if (Array.isArray(value)) return value.map(walk);
  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      if (key === "lastPublishedSnapshot") {
        delete value[key];
      } else {
        value[key] = walk(value[key]);
      }
    }
  }
  return value;
}

walk(project);
writeFileSync(target, `${JSON.stringify(project, null, 2)}\n`);
rmSync(tmp, { recursive: true, force: true });

console.log(`Optimized ${optimized} images in ${target}`);
