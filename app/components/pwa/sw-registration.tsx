'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
    useEffect(() => {
        if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
            const registerServiceWorker = async () => {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    console.log('SW registration successful with scope:', registration.scope);

                    // Request notification permissions
                    if ('Notification' in window && Notification.permission === 'default') {
                        await Notification.requestPermission();
                    }
                } catch (error) {
                    console.error('SW registration failed:', error);
                }
            };

            registerServiceWorker();
        }
    }, []);

    return null;
}
