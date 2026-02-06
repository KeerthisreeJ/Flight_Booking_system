// API Client for Flight Management System
// Handles all HTTP requests with JWT authentication

const API_BASE_URL = 'http://localhost:5000/api';

class APIClient {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    // Set user data
    setUser(user) {
        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
    }

    // Clear authentication
    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    // Get authentication headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST request
    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    // PUT request
    async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // ===== AUTHENTICATION ENDPOINTS =====

    async register(userData) {
        const response = await this.post('/auth/register', userData);
        if (response.success && response.token) {
            this.setToken(response.token);
            this.setUser(response.user);
        }
        return response;
    }

    async login(credentials) {
        const response = await this.post('/auth/login', credentials);
        return response;
    }

    async verifyOTP(userId, otp) {
        const response = await this.post('/auth/verify-otp', { userId, otp });
        if (response.success && response.token) {
            this.setToken(response.token);
            this.setUser(response.user);
        }
        return response;
    }

    async resendOTP(userId) {
        return this.post('/auth/resend-otp', { userId });
    }

    async getMe() {
        return this.get('/auth/me');
    }

    async logout() {
        try {
            await this.post('/auth/logout');
        } finally {
            this.clearAuth();
        }
    }

    // ===== BOOKING ENDPOINTS =====

    async createBooking(bookingData) {
        return this.post('/bookings', bookingData);
    }

    async getMyBookings() {
        return this.get('/bookings');
    }

    async getBooking(bookingId) {
        return this.get(`/bookings/${bookingId}`);
    }

    async cancelBooking(bookingId) {
        return this.put(`/bookings/${bookingId}/cancel`);
    }

    async verifyBookingSignature(bookingId) {
        return this.get(`/bookings/${bookingId}/verify`);
    }

    async getBookingQRCode(bookingId) {
        return this.get(`/bookings/${bookingId}/qrcode`);
    }

    // ===== FLIGHT ENDPOINTS =====

    async searchFlights(params) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/flights?${queryString}`);
    }

    async getFlight(flightNumber) {
        return this.get(`/flights/${flightNumber}`);
    }

    // ===== ADMIN ENDPOINTS =====

    async getAllUsers() {
        return this.get('/admin/users');
    }

    async getAllBookings() {
        return this.get('/admin/bookings');
    }

    async updateUserRole(userId, role) {
        return this.put(`/admin/users/${userId}/role`, { role });
    }

    async deleteUser(userId) {
        return this.delete(`/admin/users/${userId}`);
    }

    async getAdminStats() {
        return this.get('/admin/stats');
    }

    // ===== UTILITY METHODS =====

    isAuthenticated() {
        return !!this.token;
    }

    isAdmin() {
        return this.user && this.user.role === 'admin';
    }

    getCurrentUser() {
        return this.user;
    }
}

// Create global API instance
const api = new APIClient();

// Utility functions for UI
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="spinner"></div>';
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
}

function showError(message, elementId = 'error-message') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="alert alert-error">
                <span>⚠️</span>
                <span>${message}</span>
            </div>
        `;
        setTimeout(() => {
            element.innerHTML = '';
        }, 5000);
    }
}

function showSuccess(message, elementId = 'success-message') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="alert alert-success">
                <span>✅</span>
                <span>${message}</span>
            </div>
        `;
        setTimeout(() => {
            element.innerHTML = '';
        }, 5000);
    }
}

function redirectIfNotAuthenticated() {
    if (!api.isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function redirectIfAuthenticated() {
    if (api.isAuthenticated()) {
        const user = api.getCurrentUser();
        if (user) {
            if (user.role === 'admin') window.location.href = 'admin.html';
            else if (user.role === 'crew') window.location.href = 'crew.html';
            else window.location.href = 'web.html';
        } else {
            window.location.href = 'web.html';
        }
        return false;
    }
    return true;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Dark mode toggle
function initThemeToggle() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const toggleButton = document.getElementById('theme-toggle');
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            toggleButton.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        });
        toggleButton.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', initThemeToggle);
