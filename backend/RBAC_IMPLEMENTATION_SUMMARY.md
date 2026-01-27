# Role-Based Access Control (RBAC) Implementation Summary

## Date: 2025
## Project: InfraAnsible

---

## Overview
Successfully implemented a 3-tier role-based access control system replacing the old (admin/operator/viewer) with a new (super_admin/admin/user) system.

---

## Changes Made

### Backend Changes

#### 1. Database Model (`backend/app/models.py`)
- **Updated**: User role enum from `('admin', 'operator', 'viewer')` to `('super_admin', 'admin', 'user')`
- **Default**: New users default to `'user'` role

#### 2. Authentication Service (`backend/app/services/auth_service.py`)
- **Updated**: Role hierarchy from `{'viewer': 1, 'operator': 2, 'admin': 3}` to `{'user': 1, 'admin': 2, 'super_admin': 3}`
- **Purpose**: Determines permission levels for authorization checks

#### 3. Authentication API (`backend/app/api/auth.py`)
- **Updated**: Signup endpoint now creates users with `'user'` role instead of `'viewer'`
- **Impact**: All new self-registrations get minimal permissions by default

#### 4. User Management API (`backend/app/api/users.py`)
- **Updated**: Delete user endpoint restricted to `super_admin` only
- **Previous**: Any admin could delete users
- **Current**: Only super_admin can delete users

#### 5. Job API (`backend/app/api/jobs.py`)
- **Updated**: Job creation permission lowered from `'operator'` to `'user'`
- **Impact**: All authenticated users can now execute playbooks

---

### Frontend Changes

#### 1. Type Definitions (`frontend/src/types/index.ts`)
- **Updated**: UserRole type from `'admin' | 'operator' | 'viewer'` to `'super_admin' | 'admin' | 'user'`
- **Impact**: TypeScript now enforces new role types across the application

#### 2. Playbooks Page (`frontend/src/pages/PlaybooksPage/PlaybooksPage.tsx`)
**Role Checks Added:**
```typescript
const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
const isSuperAdmin = user?.role === 'super_admin';
```

**Visibility Changes:**
- **All Users**: Can see and use Run button
- **Admin/Super Admin**: Can see Run, Edit, Delete buttons + Upload YAML + Create Playbook
- **Regular Users**: Cannot create, edit, or delete playbooks

#### 3. Servers Page (`frontend/src/pages/ServersPage/ServersPage.tsx`)
**New Features:**
- Added Server Details modal with complete server information display
- Modal shows: hostname, IP, OS, SSH config, resource usage (CPU/memory/disk), timestamps

**Visibility Changes:**
- **All Users**: Can see Details button
- **Admin/Super Admin**: Can see Details, Edit, Delete buttons + Add Server + Refresh Metrics
- **Regular Users**: Cannot manage servers

**Details Modal Content:**
- Basic Information (hostname, IP, OS, status)
- SSH Configuration (user, port, key path)
- Resource Usage (CPU, memory, disk with progress bars)
- Timestamps (created, updated, last seen)

#### 4. Jobs Page (`frontend/src/pages/JobsPage/JobsPage.tsx`)
**Role Checks Added:**
```typescript
const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
```

**Visibility Changes:**
- **All Users**: Can see job details
- **Admin/Super Admin**: Can see resource monitoring (Zap icon) and stop/delete buttons
- **Regular Users**: View-only access to job history

#### 5. Users Page (`frontend/src/pages/UsersPage/UsersPage.tsx`)
**Role Checks Added:**
```typescript
const isSuperAdmin = currentUser?.role === 'super_admin';
const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
```

**Permission Logic:**
```typescript
const canDeleteUser = (targetUser: User) => {
  if (!isSuperAdmin) return false;
  if (targetUser.id === currentUser?.id) return false;
  return true;
};
```

**Visibility Changes:**
- **Super Admin**: Can view, create, edit, and delete users
- **Admin**: Can view, create, and edit users (cannot delete)
- **Regular Users**: No access to users page

**Role Badge Colors:**
- super_admin: Red badge
- admin: Purple badge
- user: Blue badge

---

### Migration Files

#### 1. SQL Migration (`backend/migrations/update_user_roles.sql`)
**Purpose**: Safely migrate existing user roles to new system

**Operations:**
1. Updates `operator` → `admin`
2. Updates `viewer` → `user`
3. Keeps `admin` → `admin`
4. Alters enum column to accept only new values
5. Sets default role to `'user'`

**Features:**
- Wrapped in transaction for safety
- Includes rollback instructions
- Verification query included

#### 2. Migration Guide (`backend/ROLE_MIGRATION_GUIDE.md`)
**Content:**
- Complete permission matrix for all roles
- Step-by-step migration instructions
- Database backup procedures
- Manual super_admin promotion steps
- Testing checklist
- Troubleshooting guide
- Rollback procedures
- Security notes

---

## Permission Matrix

| Feature | super_admin | admin | user |
|---------|-------------|-------|------|
| Run playbooks | ✅ | ✅ | ✅ |
| View details | ✅ | ✅ | ✅ |
| Create/Edit playbooks | ✅ | ✅ | ❌ |
| Delete playbooks | ✅ | ✅ | ❌ |
| Manage servers | ✅ | ✅ | ❌ |
| Monitor resources | ✅ | ✅ | ❌ |
| Stop/Delete jobs | ✅ | ✅ | ❌ |
| Manage users | ✅ | ✅* | ❌ |
| Delete users | ✅ | ❌ | ❌ |

*Admin can create and edit users but cannot delete them

---

## Security Improvements

1. **Principle of Least Privilege**: New users get minimal permissions (user role)
2. **Protected Admin Deletion**: Only super_admin can delete users, preventing accidental account removal
3. **Role Hierarchy**: Clear permission escalation path (user → admin → super_admin)
4. **Frontend Validation**: UI elements hidden based on role (defense in depth)
5. **Backend Enforcement**: API endpoints check roles server-side (security layer)

---

## Testing Checklist

### Backend Testing
- [ ] New user signup creates 'user' role
- [ ] User can create jobs (run playbooks)
- [ ] User cannot delete jobs
- [ ] Admin can manage playbooks/servers
- [ ] Admin cannot delete users
- [ ] Super admin can delete users
- [ ] Migration script runs successfully
- [ ] Role hierarchy works correctly

### Frontend Testing
- [ ] PlaybooksPage shows correct buttons per role
- [ ] ServersPage shows correct buttons per role
- [ ] Server Details modal displays all information
- [ ] JobsPage shows correct buttons per role
- [ ] UsersPage shows correct buttons per role
- [ ] Delete user button only visible to super_admin
- [ ] No TypeScript/compilation errors
- [ ] UI properly reflects user permissions

---

## Files Modified

### Backend
1. `backend/app/models.py` - User model role enum
2. `backend/app/services/auth_service.py` - Role hierarchy
3. `backend/app/api/auth.py` - Signup default role
4. `backend/app/api/users.py` - Delete permission
5. `backend/app/api/jobs.py` - Job creation permission

### Frontend
1. `frontend/src/types/index.ts` - UserRole type
2. `frontend/src/pages/PlaybooksPage/PlaybooksPage.tsx` - Role-based buttons
3. `frontend/src/pages/ServersPage/ServersPage.tsx` - Role-based buttons + Details modal
4. `frontend/src/pages/JobsPage/JobsPage.tsx` - Role-based buttons
5. `frontend/src/pages/UsersPage/UsersPage.tsx` - Role-based actions

### Documentation
1. `backend/migrations/update_user_roles.sql` - Migration script
2. `backend/ROLE_MIGRATION_GUIDE.md` - Complete migration guide
3. `backend/RBAC_IMPLEMENTATION_SUMMARY.md` - This file

---

## Deployment Instructions

### Step 1: Backup
```bash
# Backup database
mysqldump -u root -p infraansible > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup code (optional)
tar -czf code_backup_$(date +%Y%m%d_%H%M%S).tar.gz /home/NikhilRokade/InfraAnsible
```

### Step 2: Database Migration
```bash
# Run migration
cd /home/NikhilRokade/InfraAnsible/backend/migrations
mysql -u root -p infraansible < update_user_roles.sql

# Promote at least one super_admin
mysql -u root -p infraansible -e "UPDATE users SET role = 'super_admin' WHERE username = 'your_admin_username';"
```

### Step 3: Deploy Backend
```bash
cd /home/NikhilRokade/InfraAnsible/backend
# Install any new dependencies if needed
pip install -r requirements.txt
# Restart server
python run.py
```

### Step 4: Deploy Frontend
```bash
cd /home/NikhilRokade/InfraAnsible/frontend
# Install dependencies and rebuild
npm install
npm run build
# Or for dev server
npm run dev
```

### Step 5: Verify
1. Login as super_admin - verify full access
2. Login as admin - verify cannot delete users
3. Create new account via signup - verify gets 'user' role
4. Login as user - verify limited access (Run and Details only)

---

## Rollback Plan

If issues occur after deployment:

### Database Rollback
```bash
# Restore from backup
mysql -u root -p infraansible < backup_YYYYMMDD_HHMMSS.sql
```

### Code Rollback
```bash
# Restore code from backup or git
git checkout <previous-commit-hash>
```

### Manual Role Revert (if partial rollback needed)
```sql
UPDATE users SET role = 'operator' WHERE role = 'admin';
UPDATE users SET role = 'viewer' WHERE role = 'user';
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'operator', 'viewer') NOT NULL DEFAULT 'viewer';
```

---

## Known Issues & Limitations

1. **TypeScript Cache**: May need to restart TypeScript server in IDE to pick up new UserRole type
2. **JWT Tokens**: Existing tokens remain valid but role changes require re-login
3. **Super Admin Bootstrap**: First super_admin must be created manually via SQL after migration
4. **CSS Warnings**: Duplicate shadow classes are intentional for design consistency

---

## Future Enhancements

1. **Custom Permissions**: Granular permissions beyond role hierarchy
2. **Role Management UI**: Allow super_admin to change user roles from UI
3. **Audit Logging**: Track role changes and permission-based actions
4. **Multi-tenancy**: Organization-level role isolation
5. **API Keys**: Service accounts with role-based permissions

---

## Support & Troubleshooting

For issues:
1. Check backend logs: `backend/logs/app.log`
2. Check browser console for frontend errors
3. Verify database schema: `DESCRIBE users;`
4. Test API endpoints directly with curl/Postman
5. Consult `ROLE_MIGRATION_GUIDE.md` for detailed troubleshooting

---

## Conclusion

The role-based access control system is now fully implemented with:
- ✅ 3-tier role hierarchy (super_admin > admin > user)
- ✅ Frontend UI enforcement with conditional rendering
- ✅ Backend API security with permission checks
- ✅ Complete migration path from old system
- ✅ Comprehensive documentation and testing guides

**Status**: Ready for deployment
**Risk Level**: Medium (requires database migration)
**Testing Status**: Code complete, pending integration testing
