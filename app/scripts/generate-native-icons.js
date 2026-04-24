const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sourcePath = path.join(__dirname, '..', 'public', 'icons', 'icon-512x512.png');
const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

const androidIconSpecs = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 }
];

async function generateNativeIcons() {
    if (!fs.existsSync(sourcePath)) {
        console.error('Source icon not found at', sourcePath);
        process.exit(1);
    }

    for (const spec of androidIconSpecs) {
        const destDir = path.join(androidResDir, spec.dir);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        const destPath = path.join(destDir, 'ic_launcher.png');
        const roundDestPath = path.join(destDir, 'ic_launcher_round.png');

        // Square icon
        await sharp(sourcePath)
            .resize(spec.size, spec.size)
            .toFile(destPath);
        
        // Round icon (Android usually wants both)
        const radius = spec.size / 2;
        const circleSvg = Buffer.from(
            `<svg><circle cx="${radius}" cy="${radius}" r="${radius}" /></svg>`
        );

        await sharp(sourcePath)
            .resize(spec.size, spec.size)
            .composite([{
                input: circleSvg,
                blend: 'dest-in'
            }])
            .toFile(roundDestPath);

        console.log(`Generated Android icons for ${spec.dir} (${spec.size}x${spec.size})`);
    }
}

generateNativeIcons().then(() => console.log('Native icons generated successfully')).catch(console.error);
