# Authentication and Authorization

## Overview

The authentication system provides secure access control for the Infra Automation Platform using JWT (JSON Web Tokens) with role-based access control (RBAC). It ensures that only authorized users can access the platform and perform actions based on their assigned roles.

## Key Features

### 1. **JWT-Based Authentication**
- **Access Tokens**: Short-lived tokens for API requests (default: 15 minutes)
- **Refresh Tokens**: Long-lived tokens to obtain new access tokens (default: 30 days)
- **Secure Token Generation**: Uses Flask-JWT-Extended library
- **Token Blacklisting**: Support for token revocation (optional)

### 2. **Role-Based Access Control (RBAC)**

Three distinct user roles with hierarchical permissions:

| Role | Description | Access Level |
|------|-------------|--------------|
| **Admin** | Full system access | Create users, delete servers, manage all resources |
| **Operator** | Operational access | Create/manage servers, upload playbooks, execute jobs |
| **Viewer** | Read-only access | View servers, playbooks, and jobs |

### 3. **User Management**
- User registration (admin only)
- Password hashing using bcrypt
- Email validation
- Account activation/deactivation
- Last login tracking

## Authentication Flow

```
┌─────────┐                                    ┌─────────┐
│ Client  │                                    │ Backend │
└────┬────┘                                    └────┬────┘
     │                                              │
     │  1. POST /auth/login                         │
     │  { username, password }                      │
     ├──────────────────────────────────────────────>│
     │                                              │
     │  2. Validate Credentials                     │
     │     - Check username exists                  │
     │     - Verify password hash                   │
     │     - Check account is active                │
     │                                              │
     │  3. Generate Tokens                          │
     │     - Create access token                    │
     │     - Create refresh token                   │
     │     - Update last_login                      │
     │                                              │
     │  4. Response                                 │
     │  { access_token, refresh_token, user }       │
     │<──────────────────────────────────────────────┤
     │                                              │
     │  5. Subsequent API Requests                  │
     │  Header: Authorization: Bearer <token>       │
     ├──────────────────────────────────────────────>│
     │                                              │
     │  6. Token Validation                         │
     │     - Verify token signature                 │
     │     - Check expiration                       │
     │     - Extract user identity                  │
     │                                              │
```

## Core Components

### 1. **AuthService** (`app/services/auth_service.py`)

Handles all authentication and authorization logic:

- **`register_user()`**: Create new user accounts
- **`authenticate()`**: Validate credentials and generate tokens
- **`refresh_token()`**: Generate new access token from refresh token
- **`get_user_by_id()`**: Retrieve user information
- **`update_user()`**: Update user details
- **`deactivate_user()`**: Soft delete user accounts
- **`check_permission()`**: Verify role-based permissions

### 2. **Authentication Endpoints** (`app/api/auth.py`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/auth/login` | POST | Login and receive tokens | No |
| `/auth/refresh` | POST | Get new access token | Yes (Refresh Token) |
| `/auth/register` | POST | Create new user | Yes (Admin) |
| `/auth/logout` | POST | Invalidate tokens | Yes |

### 3. **User Model** (`app/models.py`)

Database schema for user storage:

```python
class User:
    id: Integer (Primary Key)
    username: String(80) - Unique, Indexed
    email: String(120) - Unique, Indexed
    password_hash: String(255)
    role: Enum('admin', 'operator', 'viewer')
    is_active: Boolean
    created_at: DateTime
    updated_at: DateTime
    last_login: DateTime
```

## Security Features

### 1. **Password Security**
- **Bcrypt Hashing**: Industry-standard password hashing algorithm
- **Salt Generation**: Automatic unique salt per password
- **Configurable Work Factor**: Adjustable computational cost
- **No Plain Text Storage**: Passwords never stored in plain text

### 2. **Token Security**
- **Cryptographic Signing**: HMAC-SHA256 signature
- **Expiration Enforcement**: Automatic token expiry
- **Secret Key**: Environment-based secret key configuration
- **Token Payload**: Minimal user information (user_id, role)

### 3. **Audit Logging**
Every authentication event is logged:
- Successful logins
- Failed login attempts (with reason)
- User registration
- Account modifications
- IP address and user agent tracking

## API Examples

### Login Request
```bash
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "secure_password123"
}
```

### Login Response
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00",
    "last_login": "2024-01-08T10:30:00"
  }
}
```

### Authenticated Request
```bash
GET /servers
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Refresh Token Request
```bash
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

## Permission Matrix

| Resource | Action | Viewer | Operator | Admin |
|----------|--------|--------|----------|-------|
| Servers | List/View | ✓ | ✓ | ✓ |
| Servers | Create/Update | ✗ | ✓ | ✓ |
| Servers | Delete | ✗ | ✗ | ✓ |
| Playbooks | List/View | ✓ | ✓ | ✓ |
| Playbooks | Upload | ✗ | ✓ | ✓ |
| Playbooks | Delete | ✗ | ✗ | ✓ |
| Jobs | List/View | ✓ | ✓ | ✓ |
| Jobs | Execute | ✗ | ✓ | ✓ |
| Jobs | Cancel | ✗ | ✓ | ✓ |
| Users | List/View | ✗ | ✗ | ✓ |
| Users | Create | ✗ | ✗ | ✓ |
| Users | Update (Self) | ✓ | ✓ | ✓ |
| Users | Update (Others) | ✗ | ✗ | ✓ |
| Users | Deactivate | ✗ | ✗ | ✓ |

## Configuration

### Environment Variables

```bash
# JWT Settings
JWT_SECRET_KEY=your-secret-key-here
JWT_ACCESS_TOKEN_EXPIRES=900        # 15 minutes
JWT_REFRESH_TOKEN_EXPIRES=2592000   # 30 days

# Password Requirements
MIN_PASSWORD_LENGTH=8
REQUIRE_SPECIAL_CHAR=true
```

### Token Expiration Strategy

- **Access Token**: Short-lived (15 minutes)
  - Used for all API requests
  - Minimizes exposure if compromised
  
- **Refresh Token**: Long-lived (30 days)
  - Stored securely by client
  - Used only to obtain new access tokens
  - Can be revoked if needed

## Best Practices

### For Developers

1. **Always Use HTTPS**: Never transmit tokens over unencrypted connections
2. **Validate Tokens**: Check token validity on every protected endpoint
3. **Minimize Token Payload**: Include only essential user information
4. **Log Authentication Events**: Track all auth-related activities
5. **Handle Token Expiry**: Implement automatic token refresh logic

### For Users

1. **Strong Passwords**: Minimum 8 characters with mixed case and special characters
2. **Secure Storage**: Never expose tokens in URLs or logs
3. **Regular Logouts**: Clear tokens when session ends
4. **Monitor Activity**: Review audit logs for suspicious activity

## Error Handling

### Common Authentication Errors

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `invalid_credentials` | 401 | Wrong username or password |
| `inactive_account` | 401 | User account is deactivated |
| `token_expired` | 401 | Access token has expired |
| `invalid_token` | 401 | Token is malformed or invalid |
| `insufficient_permissions` | 403 | User role lacks required permissions |
| `duplicate_username` | 400 | Username already exists |
| `duplicate_email` | 400 | Email already registered |

### Error Response Format

```json
{
  "error": "invalid_credentials",
  "message": "Invalid username or password"
}
```

## Integration with Frontend

The frontend stores tokens and includes them in all API requests:

```typescript
// Store tokens after login
localStorage.setItem('access_token', response.access_token);
localStorage.setItem('refresh_token', response.refresh_token);

// Include token in requests
headers: {
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
}

// Handle token expiration
if (response.status === 401) {
  // Attempt to refresh token
  const newToken = await refreshAccessToken();
  // Retry original request
}
```

## Related Documentation

- [User Management Functionality](./User-Management.md)
- [Audit and Logging](./Audit-and-Logging.md)
- [API Documentation](../backend/API_DOCS.md)
- [Security Best Practices](../backend/SECURITY.md)
