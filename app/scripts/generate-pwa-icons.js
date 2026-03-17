const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sourcePath = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\57acc18b-0015-44b0-8f78-61ec1bd61091\\escalafin_pwa_logo_1773711565654.png';
const targetsDir = path.join(__dirname, 'public', 'icons');

if (!fs.existsSync(targetsDir)) {
    fs.mkdirSync(targetsDir, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
    for (const size of sizes) {
        const destPath = path.join(targetsDir, `icon-${size}x${size}.png`);
        await sharp(sourcePath)
            .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .toFile(destPath);
        console.log(`Generated icon ${size}x${size}`);
    }
    
    // Shortcuts icons
    const shortcutIcons = ['client-icon.png', 'asesor-icon.png', 'reports-icon.png'];
    for(const iconName of shortcutIcons) {
        await sharp(sourcePath)
            .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .toFile(path.join(targetsDir, iconName));
        console.log(`Generated shortcut ${iconName}`);
    }
}

generateIcons().then(() => console.log('Done')).catch(console.error);
