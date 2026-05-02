const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceIcon = path.join(__dirname, '../public/icons/icon-512x512.png');
const resDir = path.join(__dirname, '../android/app/src/main/res');

const sizes = [
  { name: 'mipmap-mdpi', size: 48 },
  { name: 'mipmap-hdpi', size: 72 },
  { name: 'mipmap-xhdpi', size: 96 },
  { name: 'mipmap-xxhdpi', size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 }
];

async function generateIcons() {
  for (const item of sizes) {
    const dirPath = path.join(resDir, item.name);
    
    // Generar ic_launcher.png
    await sharp(sourceIcon)
      .resize(item.size, item.size)
      .toFile(path.join(dirPath, 'ic_launcher.png'));
    
    // Generar ic_launcher_round.png
    // Para el redondo, aplicamos una máscara circular
    const radius = item.size / 2;
    const circleSvg = Buffer.from(
      `<svg><circle cx="${radius}" cy="${radius}" r="${radius}" /></svg>`
    );

    await sharp(sourceIcon)
      .resize(item.size, item.size)
      .composite([{
        input: circleSvg,
        blend: 'dest-in'
      }])
      .toFile(path.join(dirPath, 'ic_launcher_round.png'));

    // Generar ic_launcher_foreground.png (para Adaptive Icons)
    // En adaptive icons, el foreground suele ser el logo escalado al 66% para evitar recortes
    const foregroundSize = Math.floor(item.size * 0.66);
    await sharp(sourceIcon)
      .resize(foregroundSize, foregroundSize)
      .extend({
        top: Math.floor((item.size - foregroundSize) / 2),
        bottom: Math.ceil((item.size - foregroundSize) / 2),
        left: Math.floor((item.size - foregroundSize) / 2),
        right: Math.ceil((item.size - foregroundSize) / 2),
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(path.join(dirPath, 'ic_launcher_foreground.png'));

    console.log(`Generated icons for ${item.name}`);
  }
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
