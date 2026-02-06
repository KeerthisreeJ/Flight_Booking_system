// Admin Dashboard JavaScript
const API_BASE_URL = 'http://localhost:5000/api';

// State Management
let currentSection = 'dashboard';
let allBookings = [];
let allUsers = [];
let allCrew = [];
let allFlights = [];
let stats = {};

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.content-section');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');
const pageTitle = document.querySelector('.page-title');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    initializeEventListeners();
    loadDashboardData();
});

// Check if user is admin
function checkAdminAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user || user.role !== 'admin') {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'login.html';
        return;
    }

    // Display admin name
    document.getElementById('adminName').textContent = `${user.firstName} ${user.lastName}`;
}

// Initialize Event Listeners
function initializeEventListeners() {
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
        });
    });

    // Menu Toggle (Mobile)
    menuToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Logout
    document.getElementById('adminLogout').addEventListener('click', logout);

    // Refresh Buttons
    document.getElementById('refreshBookings')?.addEventListener('click', loadBookings);
    document.getElementById('refreshUsers')?.addEventListener('click', loadUsers);
    document.getElementById('refreshFlights')?.addEventListener('click', loadFlights);

    // Filters
    document.getElementById('bookingStatusFilter')?.addEventListener('click', filterBookings);
    document.getElementById('userRoleFilter')?.addEventListener('change', filterUsers);
    document.getElementById('crewRoleFilter')?.addEventListener('change', filterCrew);
    document.getElementById('crewStatusFilter')?.addEventListener('change', filterCrew);
    document.getElementById('flightStatusFilter')?.addEventListener('change', filterFlights);

    // Modal Close Buttons
    document.querySelectorAll('.close-modal, .secondary-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = btn.dataset.modal;
            if (modalId) {
                closeModal(modalId);
            }
        });
    });

    // Forms
    document.getElementById('editBookingForm')?.addEventListener('submit', handleEditBooking);
    document.getElementById('editUserForm')?.addEventListener('submit', handleEditUser);
    document.getElementById('crewForm')?.addEventListener('submit', handleCrewForm);
    document.getElementById('flightForm')?.addEventListener('submit', handleFlightForm);
    document.getElementById('assignCrewForm')?.addEventListener('submit', handleAssignCrew);

    // Add Buttons
    document.getElementById('addCrewBtn')?.addEventListener('click', openAddCrewModal);
    document.getElementById('addFlightBtn')?.addEventListener('click', openAddFlightModal);

    // Crew Role Change (show/hide license field)
    document.getElementById('crewRole')?.addEventListener('change', (e) => {
        const licenseGroup = document.getElementById('licenseGroup');
        if (e.target.value === 'pilot' || e.target.value === 'co-pilot') {
            licenseGroup.style.display = 'block';
            document.getElementById('crewLicense').required = true;
        } else {
            licenseGroup.style.display = 'none';
            document.getElementById('crewLicense').required = false;
        }
    });

    // Global Search
    document.getElementById('globalSearch')?.addEventListener('input', handleGlobalSearch);
}

// Switch Section
function switchSection(section) {
    currentSection = section;

    // Update navigation
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) {
            item.classList.add('active');
        }
    });

    // Update sections
    sections.forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${section}-section`)?.classList.add('active');

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        bookings: 'Manage Bookings',
        users: 'Manage Users',
        crew: 'Crew Management',
        flights: 'Flight Management',
        settings: 'Settings'
    };
    pageTitle.textContent = titles[section] || 'Dashboard';

    // Load section data
    switch (section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'bookings':
            loadBookings();
            break;
        case 'users':
            loadUsers();
            break;
        case 'crew':
            loadCrew();
            break;
        case 'flights':
            loadFlights();
            break;
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadStats(),
            loadRecentBookings()
        ]);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

// Load Statistics
async function loadStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            stats = data.stats;
            updateStatsDisplay();
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Update Stats Display
function updateStatsDisplay() {
    document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
    document.getElementById('totalBookings').textContent = stats.totalBookings || 0;
    document.getElementById('totalRevenue').textContent = `₹${(stats.totalRevenue || 0).toLocaleString()}`;
    document.getElementById('confirmedBookings').textContent = stats.confirmedBookings || 0;
}

// Load Recent Bookings (Dashboard)
async function loadRecentBookings() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            const recentBookings = data.bookings.slice(0, 5);
            displayRecentBookings(recentBookings);
        }
    } catch (error) {
        console.error('Error loading recent bookings:', error);
    }
}

// Display Recent Bookings
function displayRecentBookings(bookings) {
    const tbody = document.querySelector('#recentBookingsTable tbody');

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr class="loading-row"><td colspan="6">No bookings found</td></tr>';
        return;
    }

    tbody.innerHTML = bookings.map(booking => `
        <tr>
            <td>${booking.bookingId}</td>
            <td>${booking.user?.firstName || 'N/A'} ${booking.user?.lastName || ''}</td>
            <td>${booking.from} → ${booking.to}</td>
            <td>${new Date(booking.departureDate).toLocaleDateString()}</td>
            <td><span class="status-badge ${booking.bookingStatus}">${booking.bookingStatus}</span></td>
            <td>₹${booking.totalPrice.toLocaleString()}</td>
        </tr>
    `).join('');
}

// Load All Bookings
async function loadBookings() {
    try {
        const token = localStorage.getItem('token');
        const tbody = document.querySelector('#bookingsTable tbody');
        tbody.innerHTML = '<tr class="loading-row"><td colspan="9">Loading bookings...</td></tr>';

        const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            allBookings = data.bookings;
            displayBookings(allBookings);
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        showNotification('Error loading bookings', 'error');
    }
}

// Display Bookings
function displayBookings(bookings) {
    const tbody = document.querySelector('#bookingsTable tbody');

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr class="loading-row"><td colspan="9">No bookings found</td></tr>';
        return;
    }

    tbody.innerHTML = bookings.map(booking => `
        <tr>
            <td>${booking.bookingId}</td>
            <td>${booking.user?.firstName || 'N/A'} ${booking.user?.lastName || ''}</td>
            <td>${booking.flightNumber}</td>
            <td>${booking.from} → ${booking.to}</td>
            <td>${new Date(booking.departureDate).toLocaleDateString()}</td>
            <td>${booking.passengers?.length || 0}</td>
            <td>₹${booking.totalPrice.toLocaleString()}</td>
            <td><span class="status-badge ${booking.bookingStatus}">${booking.bookingStatus}</span></td>
            <td>
                <button class="action-btn" onclick="openEditBookingModal('${booking._id}')" title="Edit">
                    <i class="ri-edit-line"></i>
                </button>
                <button class="action-btn delete" onclick="deleteBooking('${booking._id}')" title="Delete">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Filter Bookings
function filterBookings() {
    const statusFilter = document.getElementById('bookingStatusFilter').value;

    let filtered = allBookings;

    if (statusFilter) {
        filtered = filtered.filter(b => b.bookingStatus === statusFilter);
    }

    displayBookings(filtered);
}

// Open Edit Booking Modal
function openEditBookingModal(bookingId) {
    const booking = allBookings.find(b => b._id === bookingId);

    if (!booking) return;

    document.getElementById('editBookingId').value = booking._id;
    document.getElementById('editFlightNumber').value = booking.flightNumber;
    document.getElementById('editFrom').value = booking.from;
    document.getElementById('editTo').value = booking.to;
    document.getElementById('editDepartureDate').value = new Date(booking.departureDate).toISOString().slice(0, 16);

    if (booking.returnDate) {
        document.getElementById('editReturnDate').value = new Date(booking.returnDate).toISOString().slice(0, 16);
    }

    document.getElementById('editTotalPrice').value = booking.totalPrice;
    document.getElementById('editBookingStatus').value = booking.bookingStatus;
    document.getElementById('editPaymentStatus').value = booking.paymentStatus;

    openModal('editBookingModal');
}

// Handle Edit Booking
async function handleEditBooking(e) {
    e.preventDefault();

    const bookingId = document.getElementById('editBookingId').value;
    const updatedData = {
        flightNumber: document.getElementById('editFlightNumber').value,
        from: document.getElementById('editFrom').value,
        to: document.getElementById('editTo').value,
        departureDate: document.getElementById('editDepartureDate').value,
        returnDate: document.getElementById('editReturnDate').value || null,
        totalPrice: parseFloat(document.getElementById('editTotalPrice').value),
        bookingStatus: document.getElementById('editBookingStatus').value,
        paymentStatus: document.getElementById('editPaymentStatus').value
    };

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/booking/${bookingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Booking updated successfully', 'success');
            closeModal('editBookingModal');
            loadBookings();
            if (currentSection === 'dashboard') {
                loadRecentBookings();
            }
        } else {
            showNotification(data.message || 'Error updating booking', 'error');
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        showNotification('Error updating booking', 'error');
    }
}

// Delete Booking
async function deleteBooking(bookingId) {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/booking/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Booking deleted successfully', 'success');
            loadBookings();
            loadStats();
        } else {
            showNotification(data.message || 'Error deleting booking', 'error');
        }
    } catch (error) {
        console.error('Error deleting booking:', error);
        showNotification('Error deleting booking', 'error');
    }
}

// Load Users
async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        const tbody = document.querySelector('#usersTable tbody');
        tbody.innerHTML = '<tr class="loading-row"><td colspan="6">Loading users...</td></tr>';

        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            allUsers = data.users;
            displayUsers(allUsers);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error loading users', 'error');
    }
}

// Display Users
function displayUsers(users) {
    const tbody = document.querySelector('#usersTable tbody');

    if (users.length === 0) {
        tbody.innerHTML = '<tr class="loading-row"><td colspan="6">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.firstName} ${user.lastName}</td>
            <td>${user.email}</td>
            <td>${user.phone || 'N/A'}</td>
            <td><span class="status-badge ${user.role}">${user.role}</span></td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="action-btn" onclick="openEditUserModal('${user._id}')" title="Edit Role">
                    <i class="ri-edit-line"></i>
                </button>
                <button class="action-btn delete" onclick="deleteUser('${user._id}')" title="Delete">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Filter Users
function filterUsers() {
    const roleFilter = document.getElementById('userRoleFilter').value;

    let filtered = allUsers;

    if (roleFilter) {
        filtered = filtered.filter(u => u.role === roleFilter);
    }

    displayUsers(filtered);
}

// Open Edit User Modal
function openEditUserModal(userId) {
    const user = allUsers.find(u => u._id === userId);

    if (!user) return;

    document.getElementById('editUserId').value = user._id;
    document.getElementById('editUserRole').value = user.role;

    openModal('editUserModal');
}

// Handle Edit User
async function handleEditUser(e) {
    e.preventDefault();

    const userId = document.getElementById('editUserId').value;
    const role = document.getElementById('editUserRole').value;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ role })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('User role updated successfully', 'success');
            closeModal('editUserModal');
            loadUsers();
        } else {
            showNotification(data.message || 'Error updating user role', 'error');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        showNotification('Error updating user role', 'error');
    }
}

// Delete User
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showNotification('User deleted successfully', 'success');
            loadUsers();
            loadStats();
        } else {
            showNotification(data.message || 'Error deleting user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Error deleting user', 'error');
    }
}

// ========== CREW MANAGEMENT ==========

// Load Crew
async function loadCrew() {
    try {
        const token = localStorage.getItem('token');
        const tbody = document.querySelector('#crewTable tbody');
        tbody.innerHTML = '<tr class="loading-row"><td colspan="8">Loading crew members...</td></tr>';

        const response = await fetch(`${API_BASE_URL}/crew`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            allCrew = data.crew;
            displayCrew(allCrew);
        }
    } catch (error) {
        console.error('Error loading crew:', error);
        showNotification('Error loading crew members', 'error');
    }
}

// Display Crew
function displayCrew(crew) {
    const tbody = document.querySelector('#crewTable tbody');

    if (crew.length === 0) {
        tbody.innerHTML = '<tr class="loading-row"><td colspan="8">No crew members found</td></tr>';
        return;
    }

    tbody.innerHTML = crew.map(member => `
        <tr>
            <td>${member.employeeId}</td>
            <td>${member.firstName} ${member.lastName}</td>
            <td><span class="status-badge ${member.role}">${formatRole(member.role)}</span></td>
            <td>${member.licenseNumber || 'N/A'}</td>
            <td>${member.experience} years</td>
            <td><span class="status-badge ${member.status}">${member.status}</span></td>
            <td>${member.assignedFlights?.length || 0}</td>
            <td>
                <button class="action-btn" onclick="openEditCrewModal('${member._id}')" title="Edit">
                    <i class="ri-edit-line"></i>
                </button>
                <button class="action-btn" onclick="createCrewAccount('${member._id}')" title="Create Account">
                    <i class="ri-user-add-line"></i>
                </button>
                <button class="action-btn delete" onclick="deleteCrew('${member._id}')" title="Delete">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Filter Crew
function filterCrew() {
    const roleFilter = document.getElementById('crewRoleFilter').value;
    const statusFilter = document.getElementById('crewStatusFilter').value;

    let filtered = allCrew;

    if (roleFilter) {
        filtered = filtered.filter(c => c.role === roleFilter);
    }
    if (statusFilter) {
        filtered = filtered.filter(c => c.status === statusFilter);
    }

    displayCrew(filtered);
}

// Open Add Crew Modal
function openAddCrewModal() {
    document.getElementById('crewModalTitle').textContent = 'Add Crew Member';
    document.getElementById('crewForm').reset();
    document.getElementById('crewId').value = '';
    document.getElementById('licenseGroup').style.display = 'none';
    openModal('crewModal');
}

// Open Edit Crew Modal
function openEditCrewModal(crewId) {
    const member = allCrew.find(c => c._id === crewId);
    if (!member) return;

    document.getElementById('crewModalTitle').textContent = 'Edit Crew Member';
    document.getElementById('crewId').value = member._id;
    document.getElementById('crewFirstName').value = member.firstName;
    document.getElementById('crewLastName').value = member.lastName;
    document.getElementById('crewEmail').value = member.email;
    document.getElementById('crewPhone').value = member.phone;
    document.getElementById('crewRole').value = member.role;
    document.getElementById('crewStatus').value = member.status;
    document.getElementById('crewExperience').value = member.experience;
    document.getElementById('crewNationality').value = member.nationality;
    document.getElementById('crewDOB').value = member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : '';

    if (member.role === 'pilot' || member.role === 'co-pilot') {
        document.getElementById('licenseGroup').style.display = 'block';
        document.getElementById('crewLicense').value = member.licenseNumber || '';
        document.getElementById('crewLicense').required = true;
    }

    openModal('crewModal');
}

// Handle Crew Form
async function handleCrewForm(e) {
    e.preventDefault();

    const crewId = document.getElementById('crewId').value;
    const crewData = {
        firstName: document.getElementById('crewFirstName').value,
        lastName: document.getElementById('crewLastName').value,
        email: document.getElementById('crewEmail').value,
        phone: document.getElementById('crewPhone').value,
        role: document.getElementById('crewRole').value,
        status: document.getElementById('crewStatus').value,
        experience: parseInt(document.getElementById('crewExperience').value),
        nationality: document.getElementById('crewNationality').value,
        dateOfBirth: document.getElementById('crewDOB').value
    };

    if (crewData.role === 'pilot' || crewData.role === 'co-pilot') {
        crewData.licenseNumber = document.getElementById('crewLicense').value;
    }

    try {
        const token = localStorage.getItem('token');
        const url = crewId ? `${API_BASE_URL}/crew/${crewId}` : `${API_BASE_URL}/crew`;
        const method = crewId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(crewData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification(`Crew member ${crewId ? 'updated' : 'created'} successfully`, 'success');
            closeModal('crewModal');
            loadCrew();
        } else {
            showNotification(data.message || 'Error saving crew member', 'error');
        }
    } catch (error) {
        console.error('Error saving crew:', error);
        showNotification('Error saving crew member', 'error');
    }
}

// Delete Crew
async function deleteCrew(crewId) {
    if (!confirm('Are you sure you want to delete this crew member?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/crew/${crewId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Crew member deleted successfully', 'success');
            loadCrew();
        } else {
            showNotification(data.message || 'Error deleting crew member', 'error');
        }
    } catch (error) {
        console.error('Error deleting crew:', error);
        showNotification('Error deleting crew member', 'error');
    }
}

// Create Crew Account
async function createCrewAccount(crewId) {
    const member = allCrew.find(c => c._id === crewId);
    if (!member) return;

    if (!confirm(`Create user account for ${member.firstName} ${member.lastName}?\n\nEmail: ${member.email}\n\nA temporary password will be generated.`)) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/crew/${crewId}/create-account`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            // Show credentials to admin
            alert(`✅ Crew account created successfully!\n\nEmail: ${data.credentials.email}\nTemporary Password: ${data.credentials.tempPassword}\n\n⚠️ Please save these credentials and share them with the crew member securely.`);
            showNotification('Crew account created successfully', 'success');
            loadCrew();
        } else {
            showNotification(data.message || 'Error creating crew account', 'error');
        }
    } catch (error) {
        console.error('Error creating crew account:', error);
        showNotification('Error creating crew account', 'error');
    }
}

// ========== FLIGHT MANAGEMENT ==========

// Load Flights
async function loadFlights() {
    try {
        const token = localStorage.getItem('token');
        const tbody = document.querySelector('#flightsTable tbody');
        tbody.innerHTML = '<tr class="loading-row"><td colspan="8">Loading flights...</td></tr>';

        const response = await fetch(`${API_BASE_URL}/flights`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            allFlights = data.flights;
            displayFlights(allFlights);
        }
    } catch (error) {
        console.error('Error loading flights:', error);
        showNotification('Error loading flights', 'error');
    }
}

// Display Flights
function displayFlights(flights) {
    const tbody = document.querySelector('#flightsTable tbody');

    if (flights.length === 0) {
        tbody.innerHTML = '<tr class="loading-row"><td colspan="8">No flights found</td></tr>';
        return;
    }

    tbody.innerHTML = flights.map(flight => `
        <tr>
            <td>${flight.flightNumber}</td>
            <td>${flight.airline}</td>
            <td>${flight.from.code} → ${flight.to.code}</td>
            <td>${flight.departureTime} - ${flight.arrivalTime}</td>
            <td>${flight.aircraft}</td>
            <td>
                ${flight.crew?.pilot ? '✓ Pilot' : '✗ Pilot'}<br>
                ${flight.crew?.coPilot ? '✓ Co-Pilot' : '✗ Co-Pilot'}<br>
                ${flight.crew?.cabinCrew?.length || 0} Cabin Crew
            </td>
            <td><span class="status-badge ${flight.status}">${flight.status}</span></td>
            <td>
                <button class="action-btn" onclick="openEditFlightModal('${flight._id}')" title="Edit">
                    <i class="ri-edit-line"></i>
                </button>
                <button class="action-btn" onclick="openAssignCrewModal('${flight._id}')" title="Assign Crew">
                    <i class="ri-team-line"></i>
                </button>
                <button class="action-btn delete" onclick="deleteFlight('${flight._id}')" title="Delete">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Filter Flights
function filterFlights() {
    const statusFilter = document.getElementById('flightStatusFilter').value;

    let filtered = allFlights;

    if (statusFilter) {
        filtered = filtered.filter(f => f.status === statusFilter);
    }

    displayFlights(filtered);
}

// Open Add Flight Modal
function openAddFlightModal() {
    document.getElementById('flightModalTitle').textContent = 'Create Flight';
    document.getElementById('flightForm').reset();
    document.getElementById('flightId').value = '';
    document.getElementById('flightAirline').value = 'Air India';
    openModal('flightModal');
}

// Open Edit Flight Modal
function openEditFlightModal(flightId) {
    const flight = allFlights.find(f => f._id === flightId);
    if (!flight) return;

    document.getElementById('flightModalTitle').textContent = 'Edit Flight';
    document.getElementById('flightId').value = flight._id;
    document.getElementById('flightNumber').value = flight.flightNumber;
    document.getElementById('flightAirline').value = flight.airline;
    document.getElementById('flightAircraft').value = flight.aircraft;
    document.getElementById('flightFromCode').value = flight.from.code;
    document.getElementById('flightFromCity').value = flight.from.city;
    document.getElementById('flightToCode').value = flight.to.code;
    document.getElementById('flightToCity').value = flight.to.city;
    document.getElementById('flightDeparture').value = flight.departureTime;
    document.getElementById('flightArrival').value = flight.arrivalTime;
    document.getElementById('flightDuration').value = flight.duration;
    document.getElementById('flightPriceEconomy').value = flight.price.economy;
    document.getElementById('flightPriceBusiness').value = flight.price.business || '';
    document.getElementById('flightPriceFirst').value = flight.price.firstClass || '';
    document.getElementById('flightCapacityEconomy').value = flight.capacity.economy;
    document.getElementById('flightCapacityBusiness').value = flight.capacity.business || 0;
    document.getElementById('flightCapacityFirst').value = flight.capacity.firstClass || 0;
    document.getElementById('flightStatus').value = flight.status;
    document.getElementById('flightTerminal').value = flight.terminal || '';
    document.getElementById('flightGate').value = flight.gate || '';

    openModal('flightModal');
}

// Handle Flight Form
async function handleFlightForm(e) {
    e.preventDefault();

    const flightId = document.getElementById('flightId').value;
    const flightData = {
        flightNumber: document.getElementById('flightNumber').value,
        airline: document.getElementById('flightAirline').value,
        aircraft: document.getElementById('flightAircraft').value,
        from: {
            code: document.getElementById('flightFromCode').value.toUpperCase(),
            city: document.getElementById('flightFromCity').value
        },
        to: {
            code: document.getElementById('flightToCode').value.toUpperCase(),
            city: document.getElementById('flightToCity').value
        },
        departureTime: document.getElementById('flightDeparture').value,
        arrivalTime: document.getElementById('flightArrival').value,
        duration: document.getElementById('flightDuration').value,
        price: {
            economy: parseFloat(document.getElementById('flightPriceEconomy').value),
            business: parseFloat(document.getElementById('flightPriceBusiness').value) || undefined,
            firstClass: parseFloat(document.getElementById('flightPriceFirst').value) || undefined
        },
        capacity: {
            economy: parseInt(document.getElementById('flightCapacityEconomy').value),
            business: parseInt(document.getElementById('flightCapacityBusiness').value) || 0,
            firstClass: parseInt(document.getElementById('flightCapacityFirst').value) || 0
        },
        status: document.getElementById('flightStatus').value,
        terminal: document.getElementById('flightTerminal').value || undefined,
        gate: document.getElementById('flightGate').value || undefined,
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] // Default to all days
    };

    try {
        const token = localStorage.getItem('token');
        const url = flightId ? `${API_BASE_URL}/flights/${flightId}` : `${API_BASE_URL}/flights`;
        const method = flightId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(flightData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification(`Flight ${flightId ? 'updated' : 'created'} successfully`, 'success');
            closeModal('flightModal');
            loadFlights();
        } else {
            showNotification(data.message || 'Error saving flight', 'error');
        }
    } catch (error) {
        console.error('Error saving flight:', error);
        showNotification('Error saving flight', 'error');
    }
}

// Delete Flight
async function deleteFlight(flightId) {
    if (!confirm('Are you sure you want to delete this flight?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/flights/${flightId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Flight deleted successfully', 'success');
            loadFlights();
        } else {
            showNotification(data.message || 'Error deleting flight', 'error');
        }
    } catch (error) {
        console.error('Error deleting flight:', error);
        showNotification('Error deleting flight', 'error');
    }
}

// Open Assign Crew Modal
async function openAssignCrewModal(flightId) {
    const flight = allFlights.find(f => f._id === flightId);
    if (!flight) return;

    document.getElementById('assignFlightId').value = flight._id;
    document.getElementById('assignFlightNumber').textContent = flight.flightNumber;
    document.getElementById('assignFlightRoute').textContent = `${flight.from.city} (${flight.from.code}) → ${flight.to.city} (${flight.to.code})`;

    // Load available crew
    try {
        const token = localStorage.getItem('token');

        // Load pilots
        const pilotsRes = await fetch(`${API_BASE_URL}/crew?role=pilot&status=active`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const pilotsData = await pilotsRes.json();

        // Load co-pilots
        const coPilotsRes = await fetch(`${API_BASE_URL}/crew?role=co-pilot&status=active`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const coPilotsData = await coPilotsRes.json();

        // Load cabin crew
        const cabinCrewRes = await fetch(`${API_BASE_URL}/crew?status=active`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cabinCrewData = await cabinCrewRes.json();
        const cabinCrew = cabinCrewData.crew.filter(c => c.role === 'cabin-crew' || c.role === 'senior-cabin-crew');

        // Populate dropdowns
        const pilotSelect = document.getElementById('assignPilot');
        pilotSelect.innerHTML = '<option value="">Select Pilot</option>' +
            pilotsData.crew.map(p => `<option value="${p._id}" ${flight.crew?.pilot?._id === p._id ? 'selected' : ''}>${p.firstName} ${p.lastName} (${p.employeeId})</option>`).join('');

        const coPilotSelect = document.getElementById('assignCoPilot');
        coPilotSelect.innerHTML = '<option value="">Select Co-Pilot</option>' +
            coPilotsData.crew.map(p => `<option value="${p._id}" ${flight.crew?.coPilot?._id === p._id ? 'selected' : ''}>${p.firstName} ${p.lastName} (${p.employeeId})</option>`).join('');

        const cabinCrewSelect = document.getElementById('assignCabinCrew');
        cabinCrewSelect.innerHTML = cabinCrew.map(c => {
            const isSelected = flight.crew?.cabinCrew?.some(cc => cc._id === c._id);
            return `<option value="${c._id}" ${isSelected ? 'selected' : ''}>${c.firstName} ${c.lastName} (${c.employeeId})</option>`;
        }).join('');

        openModal('assignCrewModal');
    } catch (error) {
        console.error('Error loading crew for assignment:', error);
        showNotification('Error loading crew members', 'error');
    }
}

// Handle Assign Crew
async function handleAssignCrew(e) {
    e.preventDefault();

    const flightId = document.getElementById('assignFlightId').value;
    const pilotId = document.getElementById('assignPilot').value;
    const coPilotId = document.getElementById('assignCoPilot').value;
    const cabinCrewSelect = document.getElementById('assignCabinCrew');
    const cabinCrewIds = Array.from(cabinCrewSelect.selectedOptions).map(option => option.value);

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/flights/${flightId}/assign-crew`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                pilotId: pilotId || undefined,
                coPilotId: coPilotId || undefined,
                cabinCrewIds
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Crew assigned successfully', 'success');
            closeModal('assignCrewModal');
            loadFlights();
            loadCrew();
        } else {
            showNotification(data.message || 'Error assigning crew', 'error');
        }
    } catch (error) {
        console.error('Error assigning crew:', error);
        showNotification('Error assigning crew', 'error');
    }
}

// Helper Functions
function formatRole(role) {
    const roleMap = {
        'pilot': 'Pilot',
        'co-pilot': 'Co-Pilot',
        'cabin-crew': 'Cabin Crew',
        'senior-cabin-crew': 'Senior Cabin Crew'
    };
    return roleMap[role] || role;
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Global Search
function handleGlobalSearch(e) {
    const query = e.target.value.toLowerCase();

    if (currentSection === 'bookings') {
        const filtered = allBookings.filter(b =>
            b.bookingId.toLowerCase().includes(query) ||
            b.flightNumber.toLowerCase().includes(query) ||
            b.from.toLowerCase().includes(query) ||
            b.to.toLowerCase().includes(query) ||
            (b.user?.firstName || '').toLowerCase().includes(query) ||
            (b.user?.lastName || '').toLowerCase().includes(query)
        );
        displayBookings(filtered);
    } else if (currentSection === 'users') {
        const filtered = allUsers.filter(u =>
            u.firstName.toLowerCase().includes(query) ||
            u.lastName.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query)
        );
        displayUsers(filtered);
    } else if (currentSection === 'crew') {
        const filtered = allCrew.filter(c =>
            c.firstName.toLowerCase().includes(query) ||
            c.lastName.toLowerCase().includes(query) ||
            c.employeeId.toLowerCase().includes(query) ||
            c.email.toLowerCase().includes(query)
        );
        displayCrew(filtered);
    } else if (currentSection === 'flights') {
        const filtered = allFlights.filter(f =>
            f.flightNumber.toLowerCase().includes(query) ||
            f.airline.toLowerCase().includes(query) ||
            f.from.code.toLowerCase().includes(query) ||
            f.to.code.toLowerCase().includes(query)
        );
        displayFlights(filtered);
    }
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'web00.html';
    }
}

// Notification System
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'};
        color: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 3000;
        font-family: Georgia, serif;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
