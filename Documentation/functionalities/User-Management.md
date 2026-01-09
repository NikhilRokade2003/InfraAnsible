# User Management

## Overview

The User Management module provides comprehensive administration capabilities for managing user accounts, roles, permissions, and access control within the Infra Automation Platform. It enables administrators to create, update, and manage users while maintaining security and audit compliance.

## Key Features

### 1. **User Account Management**
- User registration and creation
- Account activation/deactivation
- Profile updates
- Password management
- Last login tracking

### 2. **Role-Based Access Control**
- Three-tier role hierarchy (Admin, Operator, Viewer)
- Granular permission control
- Role assignment and modification
- Self-service profile updates

### 3. **User Directory**
- Searchable user list
- Filtering by role and status
- Pagination support
- User activity tracking

### 4. **Security Features**
- Password complexity requirements
- Password hashing with bcrypt
- Email validation
- Account lockout (future enhancement)
- Password reset (future enhancement)

## User Data Model

```python
class User:
    id: Integer (Primary Key)
    username: String(80) - Unique, Indexed
    email: String(120) - Unique, Indexed
    password_hash: String(255) - Bcrypt hashed
    role: Enum('admin', 'operator', 'viewer')
    is_active: Boolean (default: True)
    created_at: DateTime
    updated_at: DateTime
    last_login: DateTime
    
    # Relationships
    jobs: List[Job] - Jobs created by user
    tickets: List[Ticket] - Tickets created by user
    audit_logs: List[AuditLog] - Activity logs
```

### Database Indexes

- `username` - Unique index for fast lookups
- `email` - Unique index for authentication
- `(role, is_active)` - Composite index for filtering

## Core Components

### 1. **User API Endpoints** (`app/api/users.py`)

| Endpoint | Method | Description | Required Role |
|----------|--------|-------------|---------------|
| `/users` | GET | List all users | Admin |
| `/users` | POST | Create new user | Admin |
| `/users/:id` | GET | Get user details | Admin or Self |
| `/users/:id` | PUT | Update user | Admin or Self (limited) |
| `/users/:id` | DELETE | Deactivate user | Admin |
| `/users/:id/reactivate` | POST | Reactivate user | Admin |
| `/users/me` | GET | Get current user profile | Any authenticated user |
| `/users/me` | PUT | Update own profile | Any authenticated user |

### 2. **User Service** (within `app/services/auth_service.py`)

User management functions:

- **`register_user(username, email, password, role)`**: Create new user
- **`get_user_by_id(user_id)`**: Retrieve user by ID
- **`get_user_by_username(username)`**: Retrieve user by username
- **`get_all_users(filters, page, per_page)`**: List users with filtering
- **`update_user(user_id, data, requesting_user_id)`**: Update user details
- **`deactivate_user(user_id, requesting_user_id)`**: Soft delete user
- **`reactivate_user(user_id, requesting_user_id)`**: Restore deactivated user
- **`change_password(user_id, old_password, new_password)`**: Change user password

## User Roles

### Role Hierarchy

```
┌──────────────────────────────────────┐
│            ADMIN                     │
│  ✓ Full system access                │
│  ✓ User management                   │
│  ✓ Delete resources                  │
│  ✓ System configuration              │
└──────────────┬───────────────────────┘
               │
┌──────────────▼───────────────────────┐
│          OPERATOR                    │
│  ✓ Create/manage servers             │
│  ✓ Upload playbooks                  │
│  ✓ Execute jobs                      │
│  ✓ Create tickets                    │
│  ✗ Delete resources                  │
│  ✗ User management                   │
└──────────────┬───────────────────────┘
               │
┌──────────────▼───────────────────────┐
│           VIEWER                     │
│  ✓ View servers                      │
│  ✓ View playbooks                    │
│  ✓ View jobs and logs                │
│  ✗ Create/modify resources           │
│  ✗ Execute jobs                      │
└──────────────────────────────────────┘
```

### Permission Matrix

| Action | Viewer | Operator | Admin |
|--------|--------|----------|-------|
| **Users** |
| View all users | ✗ | ✗ | ✓ |
| Create user | ✗ | ✗ | ✓ |
| Update any user | ✗ | ✗ | ✓ |
| Update self | ✓ (limited) | ✓ (limited) | ✓ |
| Deactivate user | ✗ | ✗ | ✓ |
| **Servers** |
| List/View | ✓ | ✓ | ✓ |
| Create | ✗ | ✓ | ✓ |
| Update | ✗ | ✓ | ✓ |
| Delete | ✗ | ✗ | ✓ |
| **Playbooks** |
| List/View | ✓ | ✓ | ✓ |
| Upload | ✗ | ✓ | ✓ |
| Update metadata | ✗ | ✓ | ✓ |
| Delete | ✗ | ✗ | ✓ |
| **Jobs** |
| List/View | ✓ | ✓ | ✓ |
| Execute | ✗ | ✓ | ✓ |
| Cancel | ✗ | ✓ | ✓ |
| **Tickets** |
| View | ✓ | ✓ | ✓ |
| Create | ✗ | ✓ | ✓ |
| Update | ✗ | ✓ | ✓ |

## Workflows

### 1. **Creating a New User (Admin)**

```
┌─────────┐                              ┌─────────────┐
│  Admin  │                              │   Backend   │
└────┬────┘                              └──────┬──────┘
     │                                          │
     │  1. POST /auth/register                  │
     │  {                                       │
     │    username: "john.doe",                 │
     │    email: "john@example.com",            │
     │    password: "SecurePass123!",           │
     │    role: "operator"                      │
     │  }                                       │
     ├──────────────────────────────────────────>│
     │                                          │
     │  2. Validate Request                     │
     │     - Check admin privileges             │
     │     - Validate email format              │
     │     - Check username uniqueness          │
     │     - Verify password strength           │
     │                                          │
     │  3. Create User                          │
     │     - Hash password (bcrypt)             │
     │     - Insert into database               │
     │     - Set is_active = true               │
     │     - Create audit log                   │
     │                                          │
     │  4. Response                             │
     │  {                                       │
     │    id: 5,                                │
     │    username: "john.doe",                 │
     │    email: "john@example.com",            │
     │    role: "operator",                     │
     │    is_active: true,                      │
     │    created_at: "2024-01-08T10:00:00"     │
     │  }                                       │
     │<──────────────────────────────────────────┤
     │                                          │
```

### 2. **User Self-Update**

```
┌─────────┐                              ┌─────────────┐
│  User   │                              │   Backend   │
└────┬────┘                              └──────┬──────┘
     │                                          │
     │  1. PUT /users/me                        │
     │  {                                       │
     │    email: "newemail@example.com",        │
     │    current_password: "OldPass123!",      │
     │    new_password: "NewPass456!"           │
     │  }                                       │
     ├──────────────────────────────────────────>│
     │                                          │
     │  2. Validate                             │
     │     - Verify current password            │
     │     - Check new password strength        │
     │     - Validate email format              │
     │                                          │
     │  3. Update User                          │
     │     - Hash new password                  │
     │     - Update email                       │
     │     - Set updated_at timestamp           │
     │     - Create audit log                   │
     │                                          │
     │  4. Response                             │
     │  {                                       │
     │    id: 5,                                │
     │    username: "john.doe",                 │
     │    email: "newemail@example.com",        │
     │    updated_at: "2024-01-08T11:00:00"     │
     │  }                                       │
     │<──────────────────────────────────────────┤
     │                                          │
```

## API Examples

### Create User (Admin Only)

```bash
POST /auth/register
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "username": "jane.smith",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "role": "operator"
}
```

### Response

```json
{
  "id": 6,
  "username": "jane.smith",
  "email": "jane@example.com",
  "role": "operator",
  "is_active": true,
  "created_at": "2024-01-08T10:30:00",
  "updated_at": "2024-01-08T10:30:00",
  "last_login": null
}
```

### List All Users (Admin Only)

```bash
GET /users?role=operator&is_active=true&page=1&per_page=20
Authorization: Bearer <admin_token>
```

### Response

```json
{
  "items": [
    {
      "id": 5,
      "username": "john.doe",
      "email": "john@example.com",
      "role": "operator",
      "is_active": true,
      "created_at": "2024-01-07T10:00:00",
      "last_login": "2024-01-08T09:00:00"
    },
    {
      "id": 6,
      "username": "jane.smith",
      "email": "jane@example.com",
      "role": "operator",
      "is_active": true,
      "created_at": "2024-01-08T10:30:00",
      "last_login": null
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 2,
    "pages": 1
  }
}
```

### Get User Details

```bash
# Admin getting any user
GET /users/5
Authorization: Bearer <admin_token>

# User getting own profile
GET /users/me
Authorization: Bearer <user_token>
```

### Response

```json
{
  "id": 5,
  "username": "john.doe",
  "email": "john@example.com",
  "role": "operator",
  "is_active": true,
  "created_at": "2024-01-07T10:00:00",
  "updated_at": "2024-01-08T10:00:00",
  "last_login": "2024-01-08T09:00:00",
  "statistics": {
    "jobs_created": 45,
    "jobs_success": 40,
    "jobs_failed": 5,
    "tickets_created": 3
  }
}
```

### Update User (Admin)

```bash
PUT /users/5
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "role": "admin",
  "is_active": true
}
```

### Update Own Profile

```bash
PUT /users/me
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "email": "newemail@example.com",
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456!"
}
```

### Deactivate User (Admin Only)

```bash
DELETE /users/5
Authorization: Bearer <admin_token>
```

### Response

```json
{
  "message": "User deactivated successfully",
  "user": {
    "id": 5,
    "username": "john.doe",
    "is_active": false
  }
}
```

### Reactivate User (Admin Only)

```bash
POST /users/5/reactivate
Authorization: Bearer <admin_token>
```

### Response

```json
{
  "message": "User reactivated successfully",
  "user": {
    "id": 5,
    "username": "john.doe",
    "is_active": true
  }
}
```

## Password Management

### Password Requirements

```python
PASSWORD_REQUIREMENTS = {
    'min_length': 8,
    'require_uppercase': True,
    'require_lowercase': True,
    'require_digit': True,
    'require_special_char': True,
    'special_chars': '!@#$%^&*()_+-=[]{}|;:,.<>?'
}
```

### Password Validation Rules

1. **Minimum Length**: At least 8 characters
2. **Complexity**: 
   - At least one uppercase letter (A-Z)
   - At least one lowercase letter (a-z)
   - At least one digit (0-9)
   - At least one special character (!@#$%^&*...)
3. **Common Passwords**: Reject common/weak passwords
4. **Username Check**: Password cannot contain username

### Password Storage

- **Algorithm**: bcrypt with automatic salt generation
- **Work Factor**: 12 rounds (configurable)
- **Storage**: Only hash stored, never plain text
- **Verification**: Constant-time comparison to prevent timing attacks

```python
# Password hashing
password_hash = bcrypt.hashpw(
    password.encode('utf-8'), 
    bcrypt.gensalt(rounds=12)
)

# Password verification
is_valid = bcrypt.checkpw(
    password.encode('utf-8'),
    stored_hash.encode('utf-8')
)
```

## User Status Management

### Active vs Inactive Users

| Status | Description | Can Login | Appears in Lists |
|--------|-------------|-----------|------------------|
| **Active** | Normal, operational user | Yes | Yes (default view) |
| **Inactive** | Deactivated/soft-deleted user | No | Yes (when filtered) |

### Deactivation Behavior

When a user is deactivated:
- Cannot login to the system
- Existing sessions are invalidated
- User's historical data (jobs, tickets) remains intact
- Can be reactivated by admin

### Self-Deletion Prevention

- Users cannot deactivate themselves
- Admins cannot deactivate themselves
- At least one admin must remain active

## Email Management

### Email Validation

- **Format Check**: Must contain @ symbol and domain
- **Uniqueness**: Email must be unique across all users
- **Normalization**: Stored in lowercase

### Email Usage

- Authentication (if username/email login supported)
- Password reset notifications (future)
- Job completion notifications (future)
- System alerts (future)

## User Activity Tracking

### Tracked Information

```json
{
  "last_login": "2024-01-08T09:00:00",
  "jobs_created": 45,
  "jobs_success": 40,
  "jobs_failed": 5,
  "tickets_created": 3,
  "servers_created": 12,
  "playbooks_uploaded": 5
}
```

### Activity Reports (Future Enhancement)

- User activity dashboard
- Login frequency analysis
- Resource usage patterns
- Failed login attempts

## Validation Rules

### Username

- **Required**: Yes
- **Unique**: Yes
- **Length**: 3-80 characters
- **Format**: Alphanumeric, dash, underscore, period
- **Pattern**: `^[a-zA-Z0-9._-]+$`

### Email

- **Required**: Yes
- **Unique**: Yes
- **Length**: 5-120 characters
- **Format**: Valid email format
- **Case**: Stored in lowercase

### Role

- **Required**: Yes
- **Values**: 'admin', 'operator', 'viewer'
- **Default**: 'viewer' (if not specified)
- **Validation**: Must be one of allowed values

## Security Considerations

### 1. **Password Security**

- Strong password requirements enforced
- Bcrypt hashing with high work factor
- No password storage in logs or audit trails
- Password change requires current password

### 2. **Access Control**

- Role-based permissions strictly enforced
- Users can only update limited fields on their own profile
- Admins have full control but cannot self-delete
- Token-based authentication for all operations

### 3. **Audit Trail**

All user management actions are logged:
- User creation (who created whom)
- Profile updates (what changed)
- Role changes (from/to roles)
- Deactivation/reactivation events
- Failed login attempts

### 4. **Protection Against Attacks**

- **Brute Force**: Rate limiting on login endpoint
- **Account Enumeration**: Generic error messages
- **Privilege Escalation**: Role changes require admin
- **Session Hijacking**: JWT tokens with expiration

## Best Practices

### For Administrators

1. **Role Assignment**: Give users minimum necessary permissions
2. **Regular Audits**: Review user list and roles quarterly
3. **Deactivation**: Deactivate users who leave organization immediately
4. **Strong Policies**: Enforce strong password policies
5. **Activity Monitoring**: Review audit logs regularly

### For Users

1. **Strong Passwords**: Use unique, complex passwords
2. **Regular Updates**: Change password periodically
3. **Secure Sessions**: Logout when finished
4. **Report Issues**: Report suspicious activity immediately

### For Developers

1. **Never Log Passwords**: Exclude passwords from all logging
2. **Validate Input**: Validate all user input thoroughly
3. **Check Permissions**: Verify permissions on every endpoint
4. **Audit Everything**: Log all user management actions

## Error Handling

### Common Errors

| Error | HTTP Status | Description |
|-------|-------------|-------------|
| `duplicate_username` | 400 | Username already exists |
| `duplicate_email` | 400 | Email already registered |
| `weak_password` | 400 | Password doesn't meet requirements |
| `invalid_email` | 400 | Email format invalid |
| `user_not_found` | 404 | User ID doesn't exist |
| `cannot_self_delete` | 403 | Users cannot deactivate themselves |
| `last_admin` | 403 | Cannot deactivate last admin |
| `insufficient_permissions` | 403 | User lacks required permissions |
| `incorrect_password` | 401 | Current password is wrong |

### Error Response Format

```json
{
  "error": "weak_password",
  "message": "Password must be at least 8 characters and contain uppercase, lowercase, digit, and special character",
  "details": {
    "requirements": {
      "min_length": 8,
      "has_uppercase": false,
      "has_lowercase": true,
      "has_digit": true,
      "has_special": false
    }
  }
}
```

## Integration with Other Modules

### With Authentication

- User credentials validated during login
- JWT tokens include user ID and role
- Tokens used for authorization checks

### With Jobs

- Jobs associated with user who created them
- User statistics include job counts
- Job filtering by user ID

### With Audit Logs

- All user actions logged with user attribution
- User management events tracked
- Audit trail for compliance

## Future Enhancements

- **Password Reset**: Email-based password reset flow
- **Two-Factor Authentication**: TOTP-based 2FA
- **Account Lockout**: Lock accounts after failed login attempts
- **Password Expiration**: Force password changes periodically
- **SSO Integration**: LDAP/Active Directory/SAML support
- **User Groups**: Group-based permission management
- **API Keys**: Generate API keys for programmatic access
- **Session Management**: View and revoke active sessions

## Troubleshooting

### Cannot Create User

**Check:**
- Are you logged in as admin?
- Is the username unique?
- Is the email unique?
- Does password meet requirements?

### Cannot Update User

**Check:**
- Do you have permission (admin or self)?
- Is the email already in use by another user?
- If changing role, are you admin?

### User Cannot Login

**Check:**
- Is the account active (`is_active = true`)?
- Is the password correct?
- Has the account been locked (future feature)?

## Related Documentation

- [Authentication and Authorization](./Authentication-and-Authorization.md)
- [Audit and Logging](./Audit-and-Logging.md)
- [API Documentation](../backend/API_DOCS.md)
- [Security Best Practices](../backend/SECURITY.md)
