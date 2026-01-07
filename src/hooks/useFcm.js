import { useState, useEffect, useCallback } from 'react';
import { messaging, getToken, onMessage } from '../firebase-config';
import { api } from '../utils/api';

export function useFcm(user) {
    const [permission, setPermission] = useState('default');
    const [fcmToken, setFcmToken] = useState(null);
    const [notification, setNotification] = useState(null);

    // Request notification permission and get FCM token
    const requestPermissionAndGetToken = useCallback(async () => {
        if (!messaging) {
            console.warn('Firebase Messaging not supported');
            return;
        }

        try {
            const currentPermission = Notification.permission;
            setPermission(currentPermission);

            if (currentPermission === 'granted') {
                await getFcmToken();
            } else if (currentPermission === 'default') {
                const newPermission = await Notification.requestPermission();
                setPermission(newPermission);

                if (newPermission === 'granted') {
                    await getFcmToken();
                }
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    }, [user]);

    // Get FCM token
    const getFcmToken = async () => {
        try {
            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

            const token = await getToken(messaging, {
                vapidKey: vapidKey,
                serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js')
            });

            if (token) {
                console.log('✅ FCM Token:', token);
                setFcmToken(token);

                // Send token to server
                if (user && user.accessToken) {
                    await sendTokenToServer(token);
                } else {
                    console.warn('⚠️ FCM Token generated but user not ready to save yet (accessToken missing)');
                }
            } else {
                console.warn('No FCM token available');
            }
        } catch (error) {
            console.error('Error getting FCM token:', error);
        }
    };

    // Send token to server
    const sendTokenToServer = async (token) => {
        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/fcm/token`, {
                method: 'POST',
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: token,
                    deviceType: 'web'
                })
            });

            if (response.ok) {
                console.log('✅ FCM token saved to server');
            } else {
                console.error('❌ Failed to save FCM token to server');
            }
        } catch (error) {
            console.error('Error sending token to server:', error);
        }
    };

    // Remove token from server on logout
    const removeTokenFromServer = useCallback(async () => {
        if (!fcmToken || !user) return;

        try {
            const response = await api.request(`${import.meta.env.VITE_API_URL}/api/fcm/token?token=${fcmToken}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': user.accessToken.startsWith('Bearer ') ? user.accessToken : `Bearer ${user.accessToken}`
                }
            });

            if (response.ok) {
                console.log('✅ FCM token removed from server');
            }
        } catch (error) {
            console.error('Error removing token from server:', error);
        }
    }, [fcmToken, user]);

    // Setup foreground message listener
    useEffect(() => {
        if (!messaging) return;

        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('📬 Foreground message received:', payload);

            setNotification({
                title: payload.notification?.title,
                body: payload.notification?.body,
                data: payload.data
            });

            // Show browser notification
            if (Notification.permission === 'granted') {
                new Notification(payload.notification?.title || 'Running App', {
                    body: payload.notification?.body || '',
                    icon: '/logo.png',
                    data: payload.data
                });
            }
        });

        return () => unsubscribe();
    }, []);

    // Listen for service worker messages (notification clicks)
    useEffect(() => {
        const handleServiceWorkerMessage = (event) => {
            if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
                console.log('🔔 Notification clicked, navigating to:', event.data.route);
                window.location.href = event.data.route;
            }
        };

        navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

        return () => {
            navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
        };
    }, []);

    // Initialize on user login
    useEffect(() => {
        if (user && user.accessToken) {
            requestPermissionAndGetToken();
        }
    }, [user, requestPermissionAndGetToken]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (!user) {
                removeTokenFromServer();
            }
        };
    }, [user, removeTokenFromServer]);

    return {
        permission,
        fcmToken,
        notification,
        clearNotification: () => setNotification(null),
        requestPermission: requestPermissionAndGetToken
    };
}
