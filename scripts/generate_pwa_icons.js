import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const candidatePaths = [
    path.resolve('EE hse.jfif'),
    path.resolve('public/EE hse.jfif'),
    path.resolve('EE hse.png'),
    path.resolve('public/EE hse.png'),
    path.resolve('EE hse.jpg'),
    path.resolve('public/EE hse.jpg'),
    path.resolve('EE LOGO.png'),
    path.resolve('public/EE LOGO.png')
  ];

  const masterPath = candidatePaths.find(p => fs.existsSync(p));
  const iconsDir = path.resolve('public/icons');
  const publicDir = path.resolve('public');

  if (!masterPath) {
    console.error('No master logo file found in candidate paths.');
    process.exit(1);
  }

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('Generating PWA icons from source image:', masterPath);

  // 1. icon-192.png (192x192) - Standard PWA Android & Desktop
  await sharp(masterPath)
    .resize(192, 192, {
      fit: 'contain',
      background: { r: 15, g: 23, b: 42, alpha: 1 } // #0F172A theme background
    })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'icon-192.png'));

  // 2. icon-512.png (512x512) - High-res PWA Splash & Launcher
  await sharp(masterPath)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'icon-512.png'));

  // 3. icon-512-maskable.png (512x512 with safe-zone margin for Android adaptive maskable icons)
  const innerLogoBuffer = await sharp(masterPath)
    .resize(380, 380, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 } // #0F172A
    }
  })
    .composite([{ input: innerLogoBuffer, gravity: 'center' }])
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'icon-512-maskable.png'));

  // 4. apple-touch-icon.png (180x180 for iOS Safari Home Screen)
  await sharp(masterPath)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));

  // 5. favicon.png (64x64)
  await sharp(masterPath)
    .resize(64, 64, {
      fit: 'contain',
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'favicon.png'));

  // Copy apple-touch-icon.png and favicon.png to root of /public
  fs.copyFileSync(path.join(iconsDir, 'apple-touch-icon.png'), path.join(publicDir, 'apple-touch-icon.png'));
  fs.copyFileSync(path.join(iconsDir, 'favicon.png'), path.join(publicDir, 'favicon.png'));

  console.log('Successfully generated all PWA icons with crisp quality from:', masterPath);
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
