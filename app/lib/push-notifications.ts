import webpush from 'web-push';
import prisma from './prisma';

// Configure web-push
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@escalafin.com';

if (publicVapidKey && privateVapidKey) {
    webpush.setVapidDetails(subject, publicVapidKey, privateVapidKey);
}

interface PushPayload {
    title: string;
    body: string;
    url?: string;
    icon?: string;
    badge?: string;
    data?: any;
}

export async function sendPushNotification(userId: string, payload: PushPayload) {
    if (!publicVapidKey || !privateVapidKey) {
        console.warn('VAPID keys not configured. Skipping push notification.');
        return; // Or throw error depending on needs
    }

    try {
        // Get user subscriptions
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId },
        });

        if (subscriptions.length === 0) {
            return;
        }

        const notificationPayload = JSON.stringify(payload);

        // Send to all subscriptions
        const promises = subscriptions.map(async (sub) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh, // p256dh from db
                    auth: sub.auth,     // auth from db
                },
            };

            try {
                await webpush.sendNotification(pushSubscription, notificationPayload);
            } catch (error: any) {
                // 410 Gone: The subscription is no longer valid
                // 404 Not Found: The subscription is invalid
                if (error.statusCode === 410 || error.statusCode === 404) {
                    console.log(`Subscription ${sub.id} expired or invalid. Removing.`);
                    await prisma.pushSubscription.delete({
                        where: { id: sub.id },
                    });
                } else {
                    console.error(`Error sending push notification to subscription ${sub.id}:`, error);
                }
            }
        });

        await Promise.all(promises);
    } catch (error) {
        console.error('Error in sendPushNotification:', error);
    }
}
