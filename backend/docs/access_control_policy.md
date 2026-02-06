# Access Control Policy - Flight Management System

## Overview

This document defines the **Access Control Matrix (ACM)** and **Access Control List (ACL)** for the Flight Management System. The system implements **Role-Based Access Control (RBAC)** to ensure that users can only access resources appropriate to their role.

---

## 1. Subjects (Roles)

The system defines **three distinct subjects** (user roles):

### 1.1 Guest
**Description:** Unauthenticated users who have not logged into the system.

**Characteristics:**
- No account or session token
- Limited read-only access
- Cannot perform transactions
- Can view public information only

### 1.2 User (Registered User)
**Description:** Authenticated users with a valid account who have completed login (including 2FA).

**Characteristics:**
- Has valid JWT authentication token
- Can perform bookings and transactions
- Can access own personal data
- Cannot access other users' private information
- Cannot perform administrative functions

### 1.3 Admin (Administrator)
**Description:** Privileged users with full system access for management and oversight.

**Characteristics:**
- Has valid JWT token with `role: 'admin'`
- Full read/write access to all resources
- Can manage users and their roles
- Can view system statistics and all bookings
- Cannot delete own account (safety measure)

---

## 2. Objects (Resources)

The system defines **three primary objects** (resources):

### 2.1 Flights
**Description:** Flight information including schedules, routes, availability, and pricing.

**Data Includes:**
- Flight numbers and schedules
- Departure/arrival locations
- Available seats
- Pricing information
- Flight status

### 2.2 Bookings
**Description:** Flight reservation records containing passenger and payment information.

**Data Includes:**
- Booking ID and status
- Passenger details
- Flight information
- Payment information (encrypted)
- Digital signatures
- QR codes for boarding passes

### 2.3 User Data
**Description:** Personal information and account details of registered users.

**Data Includes:**
- Personal information (name, email, phone)
- Account credentials (hashed passwords)
- Role assignments
- Login history
- Account status

---

## 3. Access Control Matrix

The following matrix defines permissions for each Subject-Object combination:

| **Subject** | **Flights** | **Bookings** | **User Data** |
|-------------|-------------|--------------|---------------|
| **Guest** | Read (Search/View) | None | None |
| **User** | Read (Search/View) | Create (Own)<br>Read (Own)<br>Update (Cancel Own) | Read (Own)<br>Update (Own Profile) |
| **Admin** | Read (All)<br>Create<br>Update<br>Delete | Read (All)<br>Update (All)<br>Delete (All) | Read (All)<br>Update (Roles)<br>Delete (Others) |

### Permission Legend:
- **Read:** View/retrieve resource data
- **Create:** Create new resources
- **Update:** Modify existing resources
- **Delete:** Remove resources
- **(Own):** Only resources owned by the user
- **(All):** All resources in the system

---

## 4. Detailed Access Rights & Justifications

### 4.1 Guest Access Rights

#### Flights: READ ✅
**Justification:** Guests need to browse available flights to make informed decisions before registering. This is essential for user acquisition and transparency. Flight information is public data that doesn't contain sensitive information.

**Security Consideration:** No authentication required, but rate limiting prevents abuse.

#### Bookings: NONE ❌
**Justification:** Bookings contain sensitive personal and payment information. Allowing unauthenticated access would violate privacy and enable unauthorized viewing of passenger data.

**Security Consideration:** Prevents data breaches and unauthorized access to PII (Personally Identifiable Information).

#### User Data: NONE ❌
**Justification:** User data is highly sensitive and should never be accessible without authentication. This prevents enumeration attacks and protects user privacy.

**Security Consideration:** Prevents account enumeration, data harvesting, and privacy violations.

---

### 4.2 User Access Rights

#### Flights: READ ✅
**Justification:** Authenticated users need to search and view flights to make bookings. Same as guests, but with potential for personalized recommendations in future.

**Security Consideration:** Authenticated access allows for usage tracking and personalization while maintaining data integrity.

#### Bookings: CREATE (Own), READ (Own), UPDATE (Cancel Own) ✅
**Justification:**
- **CREATE:** Users must be able to book flights for themselves
- **READ:** Users need to view their booking history and details
- **UPDATE (Cancel):** Users should be able to cancel their own bookings

**Restrictions:** Users CANNOT:
- View other users' bookings (privacy violation)
- Modify booking details after creation (prevents fraud)
- Delete bookings (audit trail requirement)

**Security Consideration:** Ownership validation prevents horizontal privilege escalation. Digital signatures ensure booking integrity.

#### User Data: READ (Own), UPDATE (Own Profile) ✅
**Justification:**
- **READ:** Users need to view their own profile information
- **UPDATE:** Users should be able to update their contact details and password

**Restrictions:** Users CANNOT:
- Change their own role (prevents privilege escalation)
- View other users' data (privacy protection)
- Delete their account without admin approval (data retention)

**Security Consideration:** Prevents privilege escalation and protects against unauthorized data modification.

---

### 4.3 Admin Access Rights

#### Flights: READ (All), CREATE, UPDATE, DELETE ✅
**Justification:** Admins need full control to manage flight schedules, pricing, and availability. This is essential for system operation and maintenance.

**Security Consideration:** Admin actions are logged for audit purposes. Only users with verified admin role can access these functions.

#### Bookings: READ (All), UPDATE (All), DELETE (All) ✅
**Justification:**
- **READ:** Admins need to view all bookings for customer support and reporting
- **UPDATE:** Admins may need to modify bookings for customer service (refunds, changes)
- **DELETE:** Admins can remove fraudulent or test bookings

**Security Consideration:** All admin actions on bookings are logged. Digital signatures are re-generated when admins modify bookings to maintain integrity.

#### User Data: READ (All), UPDATE (Roles), DELETE (Others) ✅
**Justification:**
- **READ:** Admins need to view user information for support and management
- **UPDATE (Roles):** Admins can promote users to admin or demote as needed
- **DELETE:** Admins can remove user accounts (except their own)

**Restrictions:** Admins CANNOT:
- Delete their own account (prevents accidental lockout)
- View plaintext passwords (passwords are hashed)

**Security Consideration:** Role changes are logged. Self-deletion is prevented to avoid system lockout.

---

## 5. Programmatic Enforcement

### 5.1 Middleware Implementation

The access control policy is enforced through middleware in [`middleware/auth.js`](file:///d:/SEM%206/FOCYS/eval/Flight_Booking_system/backend/middleware/auth.js):

#### `protect` Middleware
- Verifies JWT token
- Extracts user information
- Blocks unauthenticated requests
- **Usage:** Applied to all protected routes

```javascript
// Example: Protect booking routes
router.get('/bookings', protect, getBookings);
```

#### `authorize(...roles)` Middleware
- Checks if authenticated user has required role
- Returns 403 Forbidden if role doesn't match
- **Usage:** Applied to role-specific routes

```javascript
// Example: Admin-only route
router.get('/admin/users', protect, authorize('admin'), getAllUsers);
```

#### `checkOwnership(resourceField)` Middleware
- Verifies user owns the requested resource
- Allows admins to bypass ownership check
- **Usage:** Applied to resource-specific routes

```javascript
// Example: User can only view own bookings
router.get('/bookings/:id', protect, checkOwnership('user'), getBooking);
```

### 5.2 Route Protection Examples

#### Guest Routes (No Authentication)
```javascript
// Public flight search
GET /api/flights
GET /api/flights/:flightNumber

// Public booking verification (for airport staff)
GET /api/bookings/:bookingId/verify
```

#### User Routes (Authentication Required)
```javascript
// User bookings
POST /api/bookings (protect)
GET /api/bookings (protect)
GET /api/bookings/:id (protect + ownership check)
PUT /api/bookings/:id/cancel (protect + ownership check)

// User profile
GET /api/auth/me (protect)
PUT /api/auth/me (protect)
```

#### Admin Routes (Admin Role Required)
```javascript
// User management
GET /api/admin/users (protect + authorize('admin'))
PUT /api/admin/users/:id/role (protect + authorize('admin'))
DELETE /api/admin/users/:id (protect + authorize('admin'))

// All bookings
GET /api/admin/bookings (protect + authorize('admin'))

// Statistics
GET /api/admin/stats (protect + authorize('admin'))
```

---

## 6. Access Control List (ACL) Summary

### Guest ACL
```json
{
  "role": "guest",
  "permissions": {
    "flights": ["read"],
    "bookings": [],
    "users": []
  }
}
```

### User ACL
```json
{
  "role": "user",
  "permissions": {
    "flights": ["read"],
    "bookings": ["create:own", "read:own", "update:own"],
    "users": ["read:own", "update:own"]
  }
}
```

### Admin ACL
```json
{
  "role": "admin",
  "permissions": {
    "flights": ["create", "read", "update", "delete"],
    "bookings": ["read:all", "update:all", "delete:all"],
    "users": ["read:all", "update:roles", "delete:others"]
  }
}
```

---

## 7. Security Benefits

### Principle of Least Privilege
Each role has only the minimum permissions necessary to perform their functions. This reduces the attack surface and limits potential damage from compromised accounts.

### Defense in Depth
Multiple layers of security:
1. Authentication (JWT tokens)
2. Authorization (role checks)
3. Ownership validation (resource-level checks)
4. Input validation
5. Rate limiting

### Separation of Duties
Regular users cannot perform administrative functions, and admins cannot delete their own accounts, preventing accidental or malicious system compromise.

### Audit Trail
All access attempts are logged, enabling detection of unauthorized access attempts and forensic analysis.

---

## 8. Compliance & Standards

This access control implementation follows:
- **NIST SP 800-53:** Access Control family (AC)
- **OWASP Top 10:** Broken Access Control prevention
- **GDPR:** Data minimization and access control requirements
- **PCI DSS:** Requirement 7 (Restrict access to cardholder data)

---

## Document Version
- **Version:** 1.0
- **Last Updated:** February 1, 2026
- **Author:** Flight Management System Security Team
