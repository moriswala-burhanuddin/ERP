import { useStoreConfig } from './store-config';

/**
 * Service to interact with the Elegance E-commerce Django API.
 * Uses simple English for internal clarity and modularity.
 */
export const eleganceApi = {
    /**
     * Helper to get the base URL and Token from the store config
     */
    getConfig() {
        const state = useStoreConfig.getState();
        return {
            baseUrl: state.ecommerceApiUrl.replace(/\/$/, ''), // Remove trailing slash if any
            token: state.ecommerceAuthToken
        };
    },

    /**
     * Standard fetch wrapper with Auth headers
     */
    async request(endpoint: string, options: RequestInit = {}) {
        const { baseUrl: rawBaseUrl, token } = this.getConfig();
        let baseUrl = rawBaseUrl;

        if (!baseUrl) {
            throw new Error("No store website link configured.");
        }

        // Clean up URL: remove trailing slashes, /admin/ suffix, and ensure it starts with http
        baseUrl = baseUrl.replace(/\/$/, '').replace(/\/admin$/, '');
        if (!baseUrl.startsWith('http')) {
            baseUrl = `https://${baseUrl}`; // Default to https for pythonanywhere
        }

        const url = `${baseUrl}/api/${endpoint.replace(/^\//, '')}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };

        try {
            const response = await fetch(url, { ...options, headers });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error("Login key is invalid or expired.");
                }
                throw new Error(`Store request failed: ${response.statusText} (${response.status})`);
            }

            return await response.json();
        } catch (err: any) {
            if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
                throw new Error("Cannot reach the store website. Please check your internet and make sure the link is correct.");
            }
            throw err;
        }
    },

    /**
     * Get store overview stats
     */
    async getStoreSummary() {
        return this.request('admin/dashboard/stats/');
    },

    /**
     * Get list of products (called projects in the backend)
     */
    async getProducts() {
        return this.request('admin/projects/');
    },

    /**
     * Get list of orders
     */
    async getOrders() {
        return this.request('admin/orders/');
    },

    /**
     * Get detailed info for a single order
     */
    async getOrderDetails(id: number | string) {
        return this.request(`admin/orders/${id}/`);
    },

    /**
     * Get list of registered customers
     */
    async getCustomers() {
        return this.request('admin/users/');
    },

    /**
     * Get reviews from the online store
     */
    async getReviews() {
        return this.request('v1/reviews/');
    },

    /**
     * Delete a review
     */
    async deleteReview(id: number | string) {
        return this.request(`v1/reviews/${id}/`, { method: 'DELETE' });
    },

    /**
     * Get user feedback/contact submissions
     */
    async getFeedback() {
        return this.request('v1/feedback/');
    },

    /**
     * Login to get a new access key
     */
    async login(email, password) {
        const { baseUrl: rawBaseUrl } = this.getConfig();
        let baseUrl = rawBaseUrl;

        // Normalize URL
        baseUrl = baseUrl.replace(/\/$/, '');
        if (!baseUrl.startsWith('http')) {
            baseUrl = `http://${baseUrl}`;
        }

        const url = `${baseUrl}/api/auth/token/`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || "Login failed. Check your email and password.");
        }

        const data = await response.json();
        // Return the access token (JWT)
        return data.access;
    }
};
