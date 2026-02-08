const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('Generated VAPID Keys:');
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);

const envPath = path.resolve(__dirname, '../.env');
let envContent = fs.readFileSync(envPath, 'utf8');

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
