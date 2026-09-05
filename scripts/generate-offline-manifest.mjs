import { readdir, stat, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const distDir = "dist";
const ignored = new Set(["offline-cache-manifest.json"]);

async function walk(dir) {
  const entries = await readdir(dir);
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry);
    const info = await stat(path);
    if (info.isDirectory()) {
      files.push(...(await walk(path)));
    } else if (!ignored.has(entry)) {
      files.push(path);
    }
  }
  return files;
}

const files = await walk(distDir);
const urls = [
  "./",
  ...files
    .map((file) => relative(distDir, file).split(sep).join("/"))
    .filter((url) => url !== "index.html"),
  "index.html"
];

await writeFile(
  join(distDir, "offline-cache-manifest.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      files: [...new Set(urls)]
    },
    null,
    2
  )
);

console.log(`offline-cache-manifest.json generado con ${urls.length} archivos.`);
