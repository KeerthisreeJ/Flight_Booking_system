// Dashboard Logic

// Redirect if not authenticated
if (!redirectIfNotAuthenticated()) {
    throw new Error('Not authenticated');
}

const user = api.getCurrentUser();

// Update user info in header
document.getElementById('user-name').textContent = `${user.firstName} ${user.lastName}`;
document.getElementById('user-role').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
document.getElementById('user-avatar').textContent = user.firstName.charAt(0) + user.lastName.charAt(0);
document.getElementById('welcome-name').textContent = user.firstName;

// Show admin action if user is admin
if (api.isAdmin()) {
    document.getElementById('admin-action').style.display = 'block';
    document.getElementById('user-role').innerHTML = '<span class="admin-badge">Admin</span>';
}

// Logout handler
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await api.logout();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
});

// Load recent bookings
async function loadRecentBookings() {
    const container = document.getElementById('bookings-container');

    try {
        const response = await api.getMyBookings();

        if (response.success && response.bookings && response.bookings.length > 0) {
            // Show only first 3 bookings
            const recentBookings = response.bookings.slice(0, 3);

            container.innerHTML = recentBookings.map(booking => `
                <div class="booking-card">
                    <div class="booking-header">
                        <div>
                            <div class="booking-id">${booking.bookingId}</div>
                            <div class="text-secondary" style="font-size: 0.875rem;">Flight ${booking.flightNumber}</div>
                        </div>
                        <span class="badge badge-${booking.bookingStatus === 'confirmed' ? 'success' : booking.bookingStatus === 'cancelled' ? 'error' : 'primary'}">
                            ${booking.bookingStatus}
                        </span>
                    </div>
                    
                    <div class="booking-route">
                        <span>${booking.from}</span>
                        <span class="route-arrow">✈️</span>
                        <span>${booking.to}</span>
                    </div>
                    
                    <div class="booking-details">
                        <div class="detail-item">
                            <div class="detail-label">Departure</div>
                            <div class="detail-value">${formatDate(booking.departureDate)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Passengers</div>
                            <div class="detail-value">${booking.passengers.length} ${booking.passengers.length === 1 ? 'Person' : 'People'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Total Price</div>
                            <div class="detail-value">${formatCurrency(booking.totalPrice)}</div>
                        </div>
                    </div>
                    
                    <div class="booking-actions">
                        <button class="btn btn-primary btn-sm" onclick="showQRCode('${booking.bookingId}')">
                            📱 View QR Code
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="window.location.href='bookings.html#${booking.bookingId}'">
                            View Details
                        </button>
                        ${booking.bookingStatus === 'confirmed' ? `
                            <button class="btn btn-error btn-sm" onclick="cancelBooking('${booking.bookingId}')">
                                Cancel
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✈️</div>
                    <h3>No bookings yet</h3>
                    <p class="text-secondary">Start by searching for flights and making your first booking!</p>
                    <button class="btn btn-primary mt-lg" onclick="window.location.href='flights.html'">
                        Search Flights
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        container.innerHTML = `
            <div class="alert alert-error">
                <span>⚠️</span>
                <span>Failed to load bookings. Please try again later.</span>
            </div>
        `;
    }
}

// Show QR Code Modal
async function showQRCode(bookingId) {
    const modal = document.getElementById('qr-modal');
    const display = document.getElementById('qr-code-display');

    try {
        display.innerHTML = '<div class="spinner"></div>';
        modal.style.display = 'flex';

        const response = await api.getBookingQRCode(bookingId);

        if (response.success && response.qrCode) {
            display.innerHTML = `
                <img src="${response.qrCode}" alt="Booking QR Code">
                <p class="mt-md text-secondary">Scan this code at the airport</p>
                <p class="text-secondary" style="font-size: 0.875rem;">Booking ID: ${bookingId}</p>
            `;
        }
    } catch (error) {
        display.innerHTML = `
            <div class="alert alert-error">
                <span>⚠️</span>
                <span>Failed to load QR code</span>
            </div>
        `;
    }
}

// Close QR Modal
function closeQRModal() {
    document.getElementById('qr-modal').style.display = 'none';
}

// Close modal on overlay click
document.getElementById('qr-modal').addEventListener('click', (e) => {
    if (e.target.id === 'qr-modal') {
        closeQRModal();
    }
});

// Cancel Booking
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }

    try {
        const response = await api.cancelBooking(bookingId);

        if (response.success) {
            alert('Booking cancelled successfully');
            loadRecentBookings(); // Reload bookings
        }
    } catch (error) {
        alert('Failed to cancel booking: ' + error.message);
    }
}

// Load bookings on page load
loadRecentBookings();
