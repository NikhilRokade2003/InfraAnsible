-- Migration Script: Update User Roles
-- This script updates the user roles from the old system to the new 3-tier system
-- Old roles: admin, operator, viewer
-- New roles: super_admin, admin, user

-- Start transaction
START TRANSACTION;

-- Step 1: Add new enum values temporarily
-- Note: MySQL doesn't support adding enum values directly, so we need to alter the column

-- Step 2: Update existing roles
-- Map operator -> admin (operators become admins in new system)
UPDATE users 
SET role = 'admin' 
WHERE role = 'operator';

-- Map viewer -> user (viewers become regular users)
UPDATE users 
SET role = 'user' 
WHERE role = 'viewer';

-- Keep existing admin as admin (they will need manual promotion to super_admin if needed)
-- Note: You may want to manually promote certain admins to super_admin

-- Step 3: Alter the enum column to only accept new values
ALTER TABLE users 
MODIFY COLUMN role ENUM('super_admin', 'admin', 'user') NOT NULL DEFAULT 'user';

-- Step 4: Update the default value for new users
ALTER TABLE users 
ALTER COLUMN role SET DEFAULT 'user';

-- Verify the changes
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;

-- Commit the transaction
COMMIT;

-- Optional: Manually promote specific admins to super_admin
-- UPDATE users SET role = 'super_admin' WHERE username = 'your_super_admin_username';
