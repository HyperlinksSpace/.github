/**
 * Rasterize SVG to PNG for Markdown previews (VS Code/Cursor often block local SVG images).
 * Requires: npm install at the `.github` repo root (see ../package.json).
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

export async function convertSvgFileToPng(svgPath, pngPath) {
  const { default: sharp } = await import("sharp");
  const input = await fs.readFile(svgPath);
  await sharp(input, { density: 150 })
    .png({ compressionLevel: 9 })
    .toFile(pngPath);
}

/** Returns true if `commits-by-month.png` was written next to the SVG. */
export async function tryWriteChartPng(svgPath) {
  const pngPath = svgPath.replace(/\.svg$/iu, ".png");
  try {
    await convertSvgFileToPng(svgPath, pngPath);
    return true;
  } catch (err) {
    console.error("PNG export skipped (run npm install at the .github repo root):", err?.message ?? err);
    return false;
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);

async function cli() {
  const svgPath = path.resolve(process.argv[2] ?? path.join(__dirname, "..", "images", "commits-by-month.svg"));
  const pngPath = path.resolve(process.argv[3] ?? path.join(__dirname, "..", "images", "commits-by-month.png"));
  await convertSvgFileToPng(svgPath, pngPath);
  console.error(`Wrote ${pngPath}`);
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (invokedDirectly) {
  cli().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
