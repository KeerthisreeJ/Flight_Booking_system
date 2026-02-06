// Crew Portal JavaScript
const API_BASE_URL = 'http://localhost:5000/api';

// State
let crewProfile = null;
let assignedFlights = [];
let allCrew = []; // State for team management
let currentSection = 'dashboard';

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.content-section');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');
const pageTitle = document.querySelector('.page-title');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkCrewAuth();
    initializeEventListeners();
});

// Check Crew Authentication
async function checkCrewAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user || user.role !== 'crew') {
        alert('Access denied. Crew privileges required.');
        window.location.href = 'login.html';
        return;
    }

    // Load crew profile
    await loadCrewProfile();
    await loadDashboardData();
}

// Load Crew Profile
async function loadCrewProfile() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));

        let response;

        // Try to load by crewProfile ID if it exists
        if (user.crewProfile) {
            response = await fetch(`${API_BASE_URL}/crew/${user.crewProfile}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } else {
            // Otherwise, find crew by email
            console.log('No crewProfile linked, searching by email:', user.email);
            response = await fetch(`${API_BASE_URL}/crew`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const allCrewData = await response.json();

            if (allCrewData.success) {
                // Find crew member with matching email
                const matchingCrew = allCrewData.crew.find(c => c.email === user.email);

                if (matchingCrew) {
                    crewProfile = matchingCrew;
                    updateProfileDisplay();
                    return;
                } else {
                    alert('No crew profile found for this account. Please contact administrator.');
                    return;
                }
            } else {
                throw new Error('Failed to load crew list');
            }
        }

        const data = await response.json();

        if (data.success) {
            crewProfile = data.crew;
            updateProfileDisplay();
        }
    } catch (error) {
        console.error('Error loading crew profile:', error);
        showNotification('Error loading profile', 'error');
    }
}

// Update Profile Display
function updateProfileDisplay() {
    if (!crewProfile) return;

    document.getElementById('crewName').textContent = `${crewProfile.firstName} ${crewProfile.lastName}`;
    document.getElementById('crewRole').textContent = formatRole(crewProfile.role);
    document.getElementById('employeeId').textContent = `ID: ${crewProfile.employeeId}`;

    // Update profile section
    const profileInfo = document.getElementById('profileInfo');
    profileInfo.innerHTML = `
        <div class="info-row">
            <span class="info-label">Full Name</span>
            <span class="info-value">${crewProfile.firstName} ${crewProfile.lastName}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Employee ID</span>
            <span class="info-value">${crewProfile.employeeId}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">${crewProfile.email}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Phone</span>
            <span class="info-value">${crewProfile.phone}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Nationality</span>
            <span class="info-value">${crewProfile.nationality}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Date of Birth</span>
            <span class="info-value">${new Date(crewProfile.dateOfBirth).toLocaleDateString()}</span>
        </div>
    `;

    const professionalInfo = document.getElementById('professionalInfo');
    professionalInfo.innerHTML = `
        <div class="info-row">
            <span class="info-label">Role</span>
            <span class="info-value">${formatRole(crewProfile.role)}</span>
        </div>
        ${crewProfile.licenseNumber ? `
        <div class="info-row">
            <span class="info-label">License Number</span>
            <span class="info-value">${crewProfile.licenseNumber}</span>
        </div>
        ` : ''}
        <div class="info-row">
            <span class="info-label">Experience</span>
            <span class="info-value">${crewProfile.experience} years</span>
        </div>
        <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value"><span class="status-badge ${crewProfile.status}">${crewProfile.status}</span></span>
        </div>
        <div class="info-row">
            <span class="info-label">Assigned Flights</span>
            <span class="info-value">${crewProfile.assignedFlights?.length || 0}</span>
        </div>
    `;
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

    // Menu Toggle
    menuToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Logout
    document.getElementById('crewLogout').addEventListener('click', logout);

    // Filters
    document.getElementById('flightStatusFilter')?.addEventListener('change', filterFlights);

    // Modal Close
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = btn.dataset.modal;
            if (modalId) {
                closeModal(modalId);
            }
        });
    });
    // Team Management
    document.getElementById('addCrewBtn')?.addEventListener('click', openAddCrewModal);
    document.getElementById('crewForm')?.addEventListener('submit', handleCrewForm);

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
        flights: 'My Flights',
        schedule: 'Schedule',
        flights: 'My Flights',
        schedule: 'Schedule',
        profile: 'Profile',
        team: 'Team Management'
    };
    pageTitle.textContent = titles[section] || 'Dashboard';

    // Load section data
    switch (section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'flights':
            loadAssignedFlights();
            break;
        case 'schedule':
            loadSchedule();
            break;
        case 'schedule':
            loadSchedule();
            break;
        case 'team':
            loadTeam();
            break;
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    await loadAssignedFlights();
    updateStats();
    displayUpcomingFlights();
}

// Load Assigned Flights
async function loadAssignedFlights() {
    if (!crewProfile) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/flights`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            // Filter flights where this crew member is assigned
            assignedFlights = data.flights.filter(flight => {
                const crew = flight.crew || {};
                return crew.pilot?._id === crewProfile._id ||
                    crew.coPilot?._id === crewProfile._id ||
                    crew.cabinCrew?.some(c => c._id === crewProfile._id);
            });

            displayFlights(assignedFlights);
        }
    } catch (error) {
        console.error('Error loading flights:', error);
        showNotification('Error loading flights', 'error');
    }
}

// Update Stats
function updateStats() {
    const total = assignedFlights.length;
    const upcoming = assignedFlights.filter(f => f.status === 'active').length;
    const completed = assignedFlights.filter(f => f.status === 'completed').length;
    const hours = crewProfile?.experience * 1000 || 0; // Estimate

    document.getElementById('totalFlights').textContent = total;
    document.getElementById('upcomingFlights').textContent = upcoming;
    document.getElementById('completedFlights').textContent = completed;
    document.getElementById('totalHours').textContent = hours.toLocaleString();
}

// Display Upcoming Flights
function displayUpcomingFlights() {
    const upcomingList = document.getElementById('upcomingFlightsList');
    const upcoming = assignedFlights.filter(f => f.status === 'active').slice(0, 5);

    if (upcoming.length === 0) {
        upcomingList.innerHTML = '<div class="loading">No upcoming flights</div>';
        return;
    }

    upcomingList.innerHTML = upcoming.map(flight => {
        const myRole = getMyRole(flight);
        return `
            <div class="flight-item" onclick="viewFlightDetails('${flight._id}')">
                <div class="flight-header">
                    <div class="flight-number">${flight.flightNumber}</div>
                    <span class="status-badge ${flight.status}">${flight.status}</span>
                </div>
                <div class="flight-route">
                    <div class="flight-city">${flight.from.city} (${flight.from.code})</div>
                    <i class="ri-arrow-right-line"></i>
                    <div class="flight-city">${flight.to.city} (${flight.to.code})</div>
                </div>
                <div class="flight-details">
                    <div class="flight-detail">
                        <div class="detail-label">Departure</div>
                        <div class="detail-value">${flight.departureTime}</div>
                    </div>
                    <div class="flight-detail">
                        <div class="detail-label">Aircraft</div>
                        <div class="detail-value">${flight.aircraft}</div>
                    </div>
                    <div class="flight-detail">
                        <div class="detail-label">My Role</div>
                        <div class="detail-value">${myRole}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Display Flights Table
function displayFlights(flights) {
    const tbody = document.querySelector('#flightsTable tbody');

    if (flights.length === 0) {
        tbody.innerHTML = '<tr class="loading-row"><td colspan="8">No assigned flights</td></tr>';
        return;
    }

    tbody.innerHTML = flights.map(flight => {
        const myRole = getMyRole(flight);
        return `
            <tr>
                <td>${flight.flightNumber}</td>
                <td>${flight.from.code} → ${flight.to.code}</td>
                <td>${flight.departureTime}</td>
                <td>${flight.arrivalTime}</td>
                <td>${flight.aircraft}</td>
                <td>${myRole}</td>
                <td><span class="status-badge ${flight.status}">${flight.status}</span></td>
                <td>
                    <button class="action-btn" onclick="viewFlightDetails('${flight._id}')" title="View Details">
                        <i class="ri-eye-line"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Get My Role in Flight
function getMyRole(flight) {
    if (!crewProfile || !flight.crew) return 'N/A';

    if (flight.crew.pilot?._id === crewProfile._id) return 'Pilot';
    if (flight.crew.coPilot?._id === crewProfile._id) return 'Co-Pilot';
    if (flight.crew.cabinCrew?.some(c => c._id === crewProfile._id)) {
        return crewProfile.role === 'senior-cabin-crew' ? 'Senior Cabin Crew' : 'Cabin Crew';
    }
    return 'N/A';
}

// Filter Flights
function filterFlights() {
    const statusFilter = document.getElementById('flightStatusFilter').value;

    let filtered = assignedFlights;

    if (statusFilter) {
        filtered = filtered.filter(f => f.status === statusFilter);
    }

    displayFlights(filtered);
}

// View Flight Details
function viewFlightDetails(flightId) {
    const flight = assignedFlights.find(f => f._id === flightId);
    if (!flight) return;

    const myRole = getMyRole(flight);
    const content = document.getElementById('flightDetailsContent');

    content.innerHTML = `
        <div class="flight-details-grid">
            <h3>${flight.flightNumber} - ${flight.airline}</h3>
            
            <div class="detail-section">
                <h4>Route Information</h4>
                <div class="info-row">
                    <span class="info-label">From</span>
                    <span class="info-value">${flight.from.city} (${flight.from.code})</span>
                </div>
                <div class="info-row">
                    <span class="info-label">To</span>
                    <span class="info-value">${flight.to.city} (${flight.to.code})</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Departure</span>
                    <span class="info-value">${flight.departureTime}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Arrival</span>
                    <span class="info-value">${flight.arrivalTime}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Duration</span>
                    <span class="info-value">${flight.duration}</span>
                </div>
            </div>

            <div class="detail-section">
                <h4>Aircraft & Gate</h4>
                <div class="info-row">
                    <span class="info-label">Aircraft</span>
                    <span class="info-value">${flight.aircraft}</span>
                </div>
                ${flight.terminal ? `
                <div class="info-row">
                    <span class="info-label">Terminal</span>
                    <span class="info-value">${flight.terminal}</span>
                </div>
                ` : ''}
                ${flight.gate ? `
                <div class="info-row">
                    <span class="info-label">Gate</span>
                    <span class="info-value">${flight.gate}</span>
                </div>
                ` : ''}
            </div>

            <div class="detail-section">
                <h4>My Assignment</h4>
                <div class="info-row">
                    <span class="info-label">Role</span>
                    <span class="info-value">${myRole}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status</span>
                    <span class="info-value"><span class="status-badge ${flight.status}">${flight.status}</span></span>
                </div>
            </div>

            <div class="detail-section">
                <h4>Crew Members</h4>
                ${flight.crew?.pilot ? `
                <div class="info-row">
                    <span class="info-label">Pilot</span>
                    <span class="info-value">${flight.crew.pilot.firstName} ${flight.crew.pilot.lastName}</span>
                </div>
                ` : ''}
                ${flight.crew?.coPilot ? `
                <div class="info-row">
                    <span class="info-label">Co-Pilot</span>
                    <span class="info-value">${flight.crew.coPilot.firstName} ${flight.crew.coPilot.lastName}</span>
                </div>
                ` : ''}
                ${flight.crew?.cabinCrew?.length ? `
                <div class="info-row">
                    <span class="info-label">Cabin Crew</span>
                    <span class="info-value">${flight.crew.cabinCrew.length} members</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;

    openModal('flightDetailsModal');
}

// Load Schedule
function loadSchedule() {
    const calendar = document.getElementById('scheduleCalendar');

    // Simple schedule view
    const scheduleFlights = assignedFlights.filter(f => f.status === 'active');

    if (scheduleFlights.length === 0) {
        calendar.innerHTML = '<div class="loading">No scheduled flights</div>';
        return;
    }

    calendar.innerHTML = `
        <div class="schedule-list">
            ${scheduleFlights.map(flight => `
                <div class="schedule-item">
                    <div class="schedule-date">${flight.departureTime}</div>
                    <div class="schedule-flight">
                        <strong>${flight.flightNumber}</strong> - ${flight.from.code} → ${flight.to.code}
                    </div>
                    <div class="schedule-role">${getMyRole(flight)}</div>
                </div>
            `).join('')}
        </div>
    `;
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

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

function showNotification(message, type = 'info') {
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
// ========== TEAM MANAGEMENT ==========

async function loadTeam() {
    try {
        const token = localStorage.getItem('token');
        const tbody = document.querySelector('#teamTable tbody');
        tbody.innerHTML = '<tr class="loading-row"><td colspan="5">Loading team members...</td></tr>';

        const response = await fetch(`${API_BASE_URL}/crew`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (data.success) {
            allCrew = data.crew;
            displayTeam(allCrew);
        }
    } catch (error) {
        console.error('Error loading team:', error);
        showNotification('Error loading team members', 'error');
    }
}

function displayTeam(crew) {
    const tbody = document.querySelector('#teamTable tbody');
    if (crew.length === 0) {
        tbody.innerHTML = '<tr class="loading-row"><td colspan="5">No team members found</td></tr>';
        return;
    }

    tbody.innerHTML = crew.map(member => `
        <tr>
            <td>${member.employeeId}</td>
            <td>${member.firstName} ${member.lastName}</td>
            <td><span class="status-badge ${member.role}">${formatRole(member.role)}</span></td>
            <td><span class="status-badge ${member.status}">${member.status}</span></td>
            <td>
                <!-- Read-only for now unless logic added -->
                <button class="action-btn" title="View"><i class="ri-eye-line"></i></button>
            </td>
        </tr>
    `).join('');
}

function openAddCrewModal() {
    document.getElementById('crewModalTitle').textContent = 'Add Crew Member';
    document.getElementById('crewForm').reset();
    document.getElementById('crewId').value = '';
    document.getElementById('licenseGroup').style.display = 'none';
    openModal('crewModal');
}

async function handleCrewForm(e) {
    e.preventDefault();
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
        // Using same endpoint as Admin (assuming backend allows it)
        const response = await fetch(`${API_BASE_URL}/crew`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(crewData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Crew member added successfully', 'success');
            closeModal('crewModal');
            loadTeam();
        } else {
            showNotification(data.message || 'Error adding crew member', 'error');
        }
    } catch (error) {
        console.error('Error adding crew:', error);
        showNotification('Error adding crew member', 'error');
    }
}
