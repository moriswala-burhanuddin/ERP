import { API_URL } from './config';

export const authApi = {
    login: async (email, password) => {
        try {
            // Using standard Django SimpleJWT endpoint
            const response = await fetch(`${API_URL}/auth/token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                // Return a structured error
                return {
                    success: false,
                    message: data.detail || data.message || 'Login failed',
                    status: response.status
                };
            }

            return { success: true, data };
        } catch (error) {
            console.error("Auth API Error:", error);
            return {
                success: false,
                message: error.message || 'Network error',
                isNetworkError: true
            };
        }
    },

    refreshToken: async (refresh) => {
        try {
            const response = await fetch(`${API_URL}/auth/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh })
            });
            return await response.json();
        } catch (e) {
            return null;
        }
    }
};
