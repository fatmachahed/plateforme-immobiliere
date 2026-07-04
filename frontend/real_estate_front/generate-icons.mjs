import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const svgContent = readFileSync(resolve(__dirname, "public/favicon.svg"));
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

mkdirSync(resolve(__dirname, "public/icons"), { recursive: true });

for (const size of sizes) {
  await sharp(svgContent)
    .resize(size, size)
    .png()
    .toFile(resolve(__dirname, `public/icons/icon-${size}.png`));
  console.log(`Generated icon-${size}.png`);
}

console.log("All icons generated!");
