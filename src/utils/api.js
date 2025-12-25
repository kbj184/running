
/**
 * Common API utility to handle requests with automatic token refresh on 401.
 */
export const api = {
    request: async (url, options = {}) => {
        let response = await fetch(url, options);

        if (response.status === 401) {
            console.log('🔄 401 Unauthorized received. Attempting to refresh token...');
            try {
                // Call the refresh token endpoint
                const refreshResponse = await fetch(`${import.meta.env.VITE_API_URL}/refresh/token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include', // Important for cookies
                });

                if (refreshResponse.ok) {
                    let newAccessToken = refreshResponse.headers.get('Authorization');
                    if (newAccessToken && newAccessToken.startsWith('Bearer ')) {
                        newAccessToken = newAccessToken.substring(7); // 'Bearer ' 제거
                    }
                    console.log('✅ Access Token refreshed successfully.');

                    if (newAccessToken) {
                        // Dispatch event with PURE token
                        window.dispatchEvent(new CustomEvent('token-refreshed', { detail: newAccessToken }));

                        // Update header: API expects 'Bearer TOKEN'
                        const newOptions = {
                            ...options,
                            headers: {
                                ...options.headers,
                                'Authorization': `Bearer ${newAccessToken}`,
                            }
                        };

                        // Retry the original request
                        response = await fetch(url, newOptions);
                    }
                } else {
                    console.log('❌ Refresh token failed with status:', refreshResponse.status);
                    // Optionally dispatch a logout event if refresh fails
                    // window.dispatchEvent(new Event('auth-session-expired'));
                }
            } catch (error) {
                console.error('❌ Error during token refresh flow:', error);
            }
        }

        return response;
    }
};
