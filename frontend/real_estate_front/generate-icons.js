import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const INPUT  = join(__dirname, 'public', 'logo_localizi.png');
const OUTPUT = join(__dirname, 'public', 'icons');

mkdirSync(OUTPUT, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  await sharp(INPUT)
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(join(OUTPUT, `icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
}

// Screenshot placeholder (mobile 390×844)
mkdirSync(join(__dirname, 'public', 'screenshots'), { recursive: true });
console.log('\n✅ Icônes générées dans public/icons/');
console.log('📸 Ajoutez un screenshot mobile dans public/screenshots/mobile-home.png');
