# Role System Migration Guide

## Overview
This guide explains the migration from the old 3-tier role system to the new 3-tier role system with different permission levels.

## Role System Changes

### Old System (Deprecated)
- **admin**: Full administrative access
- **operator**: Can execute playbooks and manage servers
- **viewer**: Read-only access

### New System (Current)
- **super_admin**: Full administrative access including user deletion
- **admin**: All administrative powers except user deletion
- **user**: Can run playbooks and view details (read and execute)

## Permission Matrix

| Feature | super_admin | admin | user |
|---------|-------------|-------|------|
| **Playbooks** |
| - View playbooks | ✅ | ✅ | ✅ |
| - Run playbooks | ✅ | ✅ | ✅ |
| - Create/Edit playbooks | ✅ | ✅ | ❌ |
| - Delete playbooks | ✅ | ✅ | ❌ |
| - Upload YAML files | ✅ | ✅ | ❌ |
| **Servers** |
| - View servers | ✅ | ✅ | ✅ |
| - View server details | ✅ | ✅ | ✅ |
| - Add servers | ✅ | ✅ | ❌ |
| - Edit servers | ✅ | ✅ | ❌ |
| - Delete servers | ✅ | ✅ | ❌ |
| - Refresh metrics | ✅ | ✅ | ❌ |
| **Jobs** |
| - View jobs | ✅ | ✅ | ✅ |
| - View job details | ✅ | ✅ | ✅ |
| - Create jobs (run playbooks) | ✅ | ✅ | ✅ |
| - Monitor resource usage | ✅ | ✅ | ❌ |
| - Stop/Delete jobs | ✅ | ✅ | ❌ |
| **Users** |
| - View users | ✅ | ✅ | ❌ |
| - Create users | ✅ | ✅ | ❌ |
| - Edit users | ✅ | ✅ | ❌ |
| - Delete users | ✅ | ❌ | ❌ |

## Migration Steps

### 1. Backup Your Database
```bash
# Create a backup before migration
mysqldump -u root -p infraansible > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Run the Migration Script
```bash
# Navigate to migrations directory
cd /home/NikhilRokade/InfraAnsible/backend/migrations

# Run the migration script
mysql -u root -p infraansible < update_user_roles.sql
```

### 3. Role Mapping
The migration script automatically maps old roles to new roles:

- **operator** → **admin**: Operators are promoted to admin status
- **viewer** → **user**: Viewers become regular users
- **admin** → **admin**: Admins remain as admins (not automatically promoted to super_admin)

### 4. Promote Super Admins (Manual Step)
After migration, you need to manually promote at least one admin to super_admin:

```sql
-- Connect to database
mysql -u root -p infraansible

-- Promote specific user to super_admin
UPDATE users SET role = 'super_admin' WHERE username = 'your_admin_username';

-- Verify
SELECT username, role FROM users WHERE role = 'super_admin';
```

### 5. Restart Backend Server
```bash
cd /home/NikhilRokade/InfraAnsible/backend
python run.py
```

### 6. Test the Migration
1. Login as the super_admin user
2. Verify you can access all features
3. Test user deletion (should only work for super_admin)
4. Create a test user with default "user" role
5. Login as regular user and verify limited access (only Run and Details buttons visible)

## New User Registration
- **Self-signup**: New users registering via `/auth/signup` automatically get the **user** role
- **Admin creation**: Admins can create users with any role via `/auth/register`

## Frontend Changes
All pages have been updated with role-based visibility:

### PlaybooksPage
- Users see: Run button only
- Admins see: Run, Edit, Delete buttons + Upload YAML + Create Playbook

### ServersPage
- Users see: Details button only
- Admins see: Details, Edit, Delete buttons + Add Server + Refresh Metrics

### JobsPage
- Users see: Details button only
- Admins see: Details, Resource Monitor, Stop/Delete buttons

### UsersPage
- Users: No access
- Admins: Can view, create, edit users (cannot delete)
- Super Admins: Can view, create, edit, and delete users

## Backend Changes

### Updated Files
1. **models.py**: User role enum updated to ('super_admin', 'admin', 'user')
2. **auth_service.py**: Role hierarchy updated to {'user': 1, 'admin': 2, 'super_admin': 3}
3. **auth.py**: Signup endpoint now creates users with 'user' role
4. **users.py**: Delete endpoint restricted to super_admin only
5. **jobs.py**: Job creation now allows 'user' role

## Troubleshooting

### Issue: Migration fails with "Data truncated for column 'role'"
**Solution**: Some users may have non-standard roles. Check and fix:
```sql
SELECT username, role FROM users WHERE role NOT IN ('admin', 'operator', 'viewer');
```

### Issue: Cannot login after migration
**Solution**: Clear browser cache and JWT tokens, then login again.

### Issue: No super_admin exists
**Solution**: Connect to database and manually promote a user:
```sql
UPDATE users SET role = 'super_admin' WHERE id = 1;
```

### Issue: Frontend still shows old role names
**Solution**: Clear browser cache or do a hard refresh (Ctrl+Shift+R)

## Rollback Procedure
If you need to rollback the migration:

```sql
START TRANSACTION;

-- Reverse role mappings
UPDATE users SET role = 'operator' WHERE role = 'admin';
UPDATE users SET role = 'viewer' WHERE role = 'user';
UPDATE users SET role = 'admin' WHERE role = 'super_admin';

-- Restore old enum
ALTER TABLE users 
MODIFY COLUMN role ENUM('admin', 'operator', 'viewer') NOT NULL DEFAULT 'viewer';

COMMIT;
```

Then restore the backed-up code files.

## Security Notes
- **Super Admin**: This is the most powerful role. Assign it only to trusted administrators.
- **User Deletion**: Only super_admins can delete users to prevent accidental data loss.
- **Default Role**: New signups default to 'user' role for security.
- **JWT Tokens**: Existing JWT tokens remain valid but will reflect new roles on next login.

## Support
If you encounter issues during migration, please:
1. Check the backend logs: `backend/logs/app.log`
2. Verify database schema: `DESCRIBE users;`
3. Test API endpoints with curl or Postman
4. Review frontend console for errors
