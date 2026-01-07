// Firebase Cloud Messaging Service Worker
// This file handles background notifications when the app is not in focus

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
    apiKey: "AIzaSyAA2quN-3A4NrBrOF-Goo0lVH0Gvm48jTo",
    authDomain: "llrun-20f0f.firebaseapp.com",
    projectId: "llrun-20f0f",
    storageBucket: "llrun-20f0f.firebasestorage.app",
    messagingSenderId: "417810153294",
    appId: "1:417810153294:web:ca0c86aec4b3c765b6281f"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'Running App';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/logo.png',
        badge: '/logo.png',
        data: payload.data || {},
        tag: payload.data?.type || 'default',
        requireInteraction: false
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked:', event);

    event.notification.close();

    const data = event.notification.data;
    const route = data.route || '/';

    // Open or focus the app window
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.postMessage({
                            type: 'NOTIFICATION_CLICK',
                            route: route,
                            data: data
                        });
                        return client.focus();
                    }
                }

                // If no window is open, open a new one
                if (clients.openWindow) {
                    return clients.openWindow(route);
                }
            })
    );
});
