const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

try {
    // 1. Check if VAPID keys are already provided in environment variables
    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        console.log('✅ VAPID keys already configured in environment variables.');
        process.exit(0);
    }

    const envPath = path.resolve(__dirname, '../.env');

    // 2. If .env does not exist (typical in production containers where env vars are injected)
    if (!fs.existsSync(envPath)) {
        console.log('ℹ️  No .env file found at:', envPath);
        const vapidKeys = webpush.generateVAPIDKeys();
        console.log('Generated VAPID Keys for reference:');
        console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
        console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
        console.log('VAPID_SUBJECT="mailto:admin@escalafin.com"');

        try {
            const initialContent = `NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"\nVAPID_PRIVATE_KEY="${vapidKeys.privateKey}"\nVAPID_SUBJECT="mailto:admin@escalafin.com"\n`;
            fs.writeFileSync(envPath, initialContent);
            console.log('Created .env with generated VAPID keys.');
        } catch (writeErr) {
            console.log('⚠️ Notice: Could not write .env file (expected in containerized environments without write permissions):', writeErr.message);
        }
        process.exit(0);
    }

    let envContent = fs.readFileSync(envPath, 'utf8');

    // 3. If keys already present in .env, don't overwrite them (preserves push subscriptions)
    if (envContent.includes('NEXT_PUBLIC_VAPID_PUBLIC_KEY=') && envContent.includes('VAPID_PRIVATE_KEY=')) {
        console.log('✅ VAPID keys already present in .env file.');
        process.exit(0);
    }

    const vapidKeys = webpush.generateVAPIDKeys();
    console.log('Generated VAPID Keys:');
    console.log('Public Key:', vapidKeys.publicKey);
    console.log('Private Key:', vapidKeys.privateKey);

    // Update or Add VAPID keys
    if (envContent.includes('NEXT_PUBLIC_VAPID_PUBLIC_KEY=')) {
        envContent = envContent.replace(
            /NEXT_PUBLIC_VAPID_PUBLIC_KEY=.*/,
            `NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`
        );
    } else {
        envContent += `\nNEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`;
    }

    if (envContent.includes('VAPID_PRIVATE_KEY=')) {
        envContent = envContent.replace(
            /VAPID_PRIVATE_KEY=.*/,
            `VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`
        );
    } else {
        envContent += `\nVAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`;
    }

    // Add VAPID_SUBJECT (email)
    if (!envContent.includes('VAPID_SUBJECT=')) {
        envContent += `\nVAPID_SUBJECT="mailto:admin@escalafin.com"`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('Updated .env with new VAPID keys.');
} catch (err) {
    console.warn('⚠️ Warning in setup-vapid.js:', err.message);
}

