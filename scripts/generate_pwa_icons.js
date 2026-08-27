import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const masterPath = path.resolve('public/EE LOGO.png');
  const iconsDir = path.resolve('public/icons');

  if (!fs.existsSync(masterPath)) {
    console.error('Master logo not found at public/EE LOGO.png');
    process.exit(1);
  }

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('Generating PWA icons from:', masterPath);

  // 1. icon-192.png (192x192)
  await sharp(masterPath)
    .resize(192, 192, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'));

  // 2. icon-512.png (512x512)
  await sharp(masterPath)
    .resize(512, 512, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .png()
    .toFile(path.join(iconsDir, 'icon-512.png'));

  // 3. icon-512-maskable.png (512x512 with 20% safe-zone margin for Android adaptive maskable icons)
  const logoResized = await sharp(masterPath)
    .resize(380, 380, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 } // #0F172A theme color
    }
  })
    .composite([{ input: logoResized, gravity: 'center' }])
    .png()
    .toFile(path.join(iconsDir, 'icon-512-maskable.png'));

  // 4. apple-touch-icon.png (180x180 for iOS)
  await sharp(masterPath)
    .resize(180, 180, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));

  // 5. favicon.png (64x64)
  await sharp(masterPath)
    .resize(64, 64, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .png()
    .toFile(path.join(iconsDir, 'favicon.png'));

  // Also copy apple-touch-icon.png and favicon.png to root of /public
  fs.copyFileSync(path.join(iconsDir, 'apple-touch-icon.png'), path.resolve('public/apple-touch-icon.png'));
  fs.copyFileSync(path.join(iconsDir, 'favicon.png'), path.resolve('public/favicon.png'));

  console.log('Successfully generated all PWA icons!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
