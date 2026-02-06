# ✈️ Flight Management System

A comprehensive and secure flight booking platform built with modern web technologies and enterprise-grade security features. This system provides a complete solution for flight search, booking, payment processing, and ticket management with robust security implementations.

![Tech Stack](https://img.shields.io/badge/Stack-MERN-blue)
![Security](https://img.shields.io/badge/Security-Enterprise%20Grade-success)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🌟 Key Features

### For Passengers
- **Flight Search & Booking**: Search flights by route, date, and preferences
- **Secure Payment Processing**: Encrypted payment data with AES-256 encryption
- **Digital Boarding Passes**: QR code-based tickets with digital signatures
- **Booking Management**: View, verify, and manage all your bookings
- **Email Notifications**: Automated booking confirmations and updates

### For Crew Members
- **Flight Assignments**: View assigned flights and schedules
- **Passenger Manifests**: Access passenger lists for assigned flights
- **Profile Management**: Update crew information and credentials

### For Administrators
- **Flight Management**: Create, update, and manage flight schedules
- **User Management**: Manage user accounts and roles
- **Booking Oversight**: Monitor all bookings and transactions
- **System Analytics**: View statistics and system health

---

## 🔐 Security Features

### 1. **Multi-Factor Authentication (2FA)**
- Email/password login with strong validation
- OTP verification via email (6-digit code, 10-minute expiry)
- Account lockout after 5 failed login attempts (2-hour lock)
- Password requirements: minimum 8 characters, uppercase, lowercase, and numbers

### 2. **Role-Based Access Control (RBAC)**
- **Guest**: Browse flights (read-only access)
- **User**: Book flights, manage own bookings and profile
- **Crew**: View assigned flights and passenger manifests
- **Admin**: Full system access and management capabilities

### 3. **Data Encryption**
- **AES-256-CBC**: Encrypts sensitive payment information
- **RSA-2048**: Secure key exchange and digital signatures
- **Hybrid Encryption**: Combines symmetric and asymmetric encryption for optimal security
- All sensitive data encrypted at rest in the database

### 4. **Password Security**
- **bcrypt Hashing**: Industry-standard password hashing with 10 rounds
- **Unique Salts**: Each password has a unique salt
- **SHA-256**: Used for OTP hashing
- Passwords never stored in plaintext

### 5. **Digital Signatures**
- **RSA-SHA256**: Every booking is digitally signed
- **Integrity Verification**: Verify booking authenticity and detect tampering
- **Non-repudiation**: Cryptographic proof of booking creation

### 6. **Secure Session Management**
- **JWT Tokens**: Stateless authentication with 7-day expiry
- **HTTPOnly Cookies**: Protection against XSS attacks
- **HTTPS Only**: All data transmitted over secure connections

### 7. **Additional Security Measures**
- **Rate Limiting**: Prevents brute-force attacks (100 requests per 15 minutes)
- **Helmet.js**: Security headers protection
- **CORS Configuration**: Controlled cross-origin access
- **Input Validation**: Sanitization of all user inputs
- **QR Code Encoding**: Base64-encoded boarding passes

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│              FRONTEND (HTML/CSS/JS)                 │
│  • Login/Register with 2FA                          │
│  • Flight Search & Booking                          │
│  • Dashboard with QR Tickets                        │
│  • Booking Verification                             │
└─────────────────┬───────────────────────────────────┘
                  │ HTTPS/TLS
                  │ JWT Authentication
┌─────────────────▼───────────────────────────────────┐
│           BACKEND (Node.js/Express)                 │
│  ┌─────────────────────────────────────────────┐   │
│  │  Security Middleware                        │   │
│  │  • Helmet.js (Security headers)             │   │
│  │  • Rate limiting                            │   │
│  │  • CORS configuration                       │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │  Authentication & Authorization             │   │
│  │  • JWT validation                           │   │
│  │  • Role-based access control                │   │
│  │  • Ownership verification                   │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │  Cryptographic Services                     │   │
│  │  • AES-256 encryption                       │   │
│  │  • RSA-2048 signatures                      │   │
│  │  • bcrypt password hashing                  │   │
│  │  • QR code generation                       │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│            DATABASE (MongoDB)                       │
│  • Encrypted payment data                           │
│  • Hashed passwords                                 │
│  • Digital signatures                               │
│  • User profiles and bookings                       │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
Flight_Booking_system/
├── backend/
│   ├── docs/
│   │   ├── access_control_policy.md    # Access control documentation
│   │   └── security_theory.md          # Security implementation theory
│   ├── middleware/
│   │   └── auth.js                     # RBAC enforcement
│   ├── models/
│   │   ├── User.js                     # User schema with password hashing
│   │   ├── Booking.js                  # Booking schema with encryption
│   │   ├── Flight.js                   # Flight schema
│   │   └── Crew.js                     # Crew member schema
│   ├── routes/
│   │   ├── auth.js                     # Authentication endpoints
│   │   ├── booking.js                  # Booking management
│   │   ├── flight.js                   # Flight operations
│   │   ├── crew.js                     # Crew operations
│   │   └── admin.js                    # Admin panel
│   ├── utils/
│   │   ├── encryption.js               # AES, RSA, digital signatures
│   │   └── email.js                    # Email service for OTP
│   ├── keys/
│   │   ├── private.pem                 # RSA private key
│   │   └── public.pem                  # RSA public key
│   ├── server.js                       # Express application
│   └── package.json                    # Dependencies
├── css/
│   ├── index.css                       # Main stylesheet
│   ├── admin.css                       # Admin panel styles
│   └── crew.css                        # Crew portal styles
├── js/
│   ├── api.js                          # API client
│   ├── auth.js                         # Authentication logic
│   ├── dashboard.js                    # Dashboard functionality
│   ├── admin.js                        # Admin panel logic
│   ├── crew.js                         # Crew portal logic
│   └── payment-validation.js           # Payment validation
├── index.html                          # Login/Register page
├── dashboard.html                      # User dashboard
├── admin.html                          # Admin panel
├── crew.html                           # Crew portal
├── bookings.html                       # Booking history
├── verify.html                         # Signature verification
└── README.md                           # This file
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 16 or higher
- **MongoDB** 4.4 or higher
- **Gmail account** (for OTP email delivery)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KeerthisreeJ/Flight_Booking_system.git
   cd Flight_Booking_system
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/flight_booking
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   ENCRYPTION_KEY=your_32_byte_hex_encryption_key
   ENCRYPTION_IV=your_16_byte_hex_iv
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_app_specific_password
   ```

4. **Start MongoDB**
   ```bash
   mongod
   ```

5. **Start the backend server**
   ```bash
   npm run dev
   ```

6. **Open the frontend**
   
   Open `index.html` in your browser or use a live server extension.

---

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123"
}
```

#### Login (Step 1)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response: { "requiresOTP": true, "userId": "..." }
```

#### Verify OTP (Step 2)
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "userId": "...",
  "otp": "123456"
}

Response: { "token": "jwt_token", "user": {...} }
```

### Flight Endpoints

#### Search Flights
```http
GET /api/flights/search?from=NYC&to=LON&date=2026-03-15
```

#### Get Flight Details
```http
GET /api/flights/:flightId
```

### Booking Endpoints (Authentication Required)

#### Create Booking
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "flightNumber": "FL123",
  "from": "New York",
  "to": "London",
  "departureDate": "2026-03-15",
  "passengers": [
    { "name": "John Doe", "ageCategory": "Adult" }
  ],
  "totalPrice": 1200
}

Response: Includes QR code and digital signature
```

#### Get User Bookings
```http
GET /api/bookings
Authorization: Bearer <token>
```

#### Verify Booking Signature
```http
GET /api/bookings/:bookingId/verify

Response: { "verified": true, "bookingDetails": {...} }
```

### Admin Endpoints (Admin Role Required)

```http
GET /api/admin/users              # Get all users
GET /api/admin/bookings           # Get all bookings
PUT /api/admin/users/:id/role     # Update user role
GET /api/admin/stats              # System statistics
POST /api/admin/flights           # Create new flight
PUT /api/admin/flights/:id        # Update flight
DELETE /api/admin/flights/:id     # Delete flight
```

### Crew Endpoints (Crew Role Required)

```http
GET /api/crew/profile             # Get crew profile
GET /api/crew/flights             # Get assigned flights
GET /api/crew/flights/:id/passengers  # Get passenger manifest
```

---

## 🔒 Security Implementation Details

### Access Control Matrix

| Role | Flights | Bookings | User Data | Admin Functions |
|------|---------|----------|-----------|-----------------|
| **Guest** | Read | None | None | None |
| **User** | Read | Create/Read/Cancel (Own) | Read/Update (Own) | None |
| **Crew** | Read (Assigned) | Read (Assigned Flights) | Read (Own) | None |
| **Admin** | Full Access | Full Access | Read/Update/Delete (All) | Full Access |

### Encryption Details

**Payment Data Encryption (AES-256-CBC)**
```javascript
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
const encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
```

**Digital Signature Generation (RSA-SHA256)**
```javascript
const signature = crypto.createSign('SHA256')
  .update(bookingData)
  .sign(privateKey, 'base64');
```

**Password Hashing (bcrypt)**
```javascript
const hashedPassword = await bcrypt.hash(password, 10);
```

---

## 🎨 Frontend Features

- **Modern Design**: Premium gradients, glassmorphism effects, and dark mode support
- **Responsive Layout**: Optimized for mobile, tablet, and desktop devices
- **Smooth Animations**: Micro-interactions and transitions for enhanced UX
- **Accessibility**: Semantic HTML, ARIA labels, and keyboard navigation
- **Real-time Validation**: Client-side form validation with instant feedback

---

## 🧪 Testing

### Manual Testing Checklist

- ✅ Register new user with strong password
- ✅ Login and receive OTP via email
- ✅ Verify OTP and access dashboard
- ✅ Search for available flights
- ✅ Create booking and receive QR code
- ✅ Verify booking signature
- ✅ View booking history
- ✅ Test crew portal (crew role)
- ✅ Test admin panel (admin role)
- ✅ Test access control (unauthorized access attempts)
- ✅ Test account lockout (5 failed login attempts)

---

## 📖 Additional Documentation

- **Access Control Policy**: `backend/docs/access_control_policy.md`
  - Detailed role definitions
  - Permission matrix with justifications
  - Security policy explanations

- **Security Theory**: `backend/docs/security_theory.md`
  - Encryption vs Hashing vs Encoding
  - Attack vectors and mitigations
  - Risk analysis and security best practices

---

## 🛡️ Security Compliance

- ✅ **OWASP Top 10**: Protection against major web vulnerabilities
- ✅ **NIST Guidelines**: Access control and authentication standards
- ✅ **PCI DSS**: Payment data encryption and security
- ✅ **GDPR**: Data minimization and user privacy

---

## 🔧 Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **crypto** - Encryption and digital signatures
- **nodemailer** - Email service
- **qrcode** - QR code generation
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling with modern features
- **JavaScript (ES6+)** - Client-side logic
- **Fetch API** - HTTP requests

---

## 👨‍💻 Author

**Keerthisree J**
- GitHub: [@KeerthisreeJ](https://github.com/KeerthisreeJ)
- Repository: [Flight_Booking_system](https://github.com/KeerthisreeJ/Flight_Booking_system)

---

## 📄 License

MIT License - Feel free to use this project for educational and commercial purposes.

---

## 🙏 Acknowledgments

- Node.js and Express.js communities
- MongoDB for the database solution
- All open-source libraries and contributors
- Security best practices from OWASP and NIST

---

## 📞 Support

For issues, questions, or contributions, please open an issue on the [GitHub repository](https://github.com/KeerthisreeJ/Flight_Booking_system/issues).

---

**Built with ❤️ and 🔐 by Keerthisree J**
