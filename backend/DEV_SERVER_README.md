# Development Server for Windows Testing

## Overview

This is a **minimal Flask server** specifically created to enable frontend development and testing on Windows without requiring `ansible_runner` (which needs Linux).

## ⚠️ Important Limitations

**USE ONLY FOR:**
- ✅ Testing login/authentication
- ✅ Testing UI components  
- ✅ Frontend development
- ✅ Dashboard visualization (with empty/mock data)

**NOT SUPPORTED:**
- ❌ Ansible playbook execution
- ❌ Job execution
- ❌ Celery async tasks
- ❌ Real server/playbook CRUD operations

## How to Use

### 1. Start the Development Server

```powershell
cd backend
& ".\InfraAuto\Scripts\python.exe" dev_server.py
```

You should see:
```
============================================================
🚀 DEVELOPMENT SERVER FOR WINDOWS TESTING
============================================================
⚠️  WARNING: This is a minimal mock server
✅ Login/Auth: WORKS
✅ Dashboard: WORKS (empty data)
❌ Job Execution: NOT SUPPORTED
❌ Ansible: NOT SUPPORTED

📋 Use this ONLY to test login and UI components
🐧 For full functionality, deploy to Linux VM
============================================================

 * Running on http://127.0.0.1:5000
```

### 2. Start the Frontend (in a separate terminal)

```powershell
cd frontend
npm run dev
```

### 3. Access the Application

Open your browser and go to:
- **Frontend**: http://localhost:5173
- **Backend Health**: http://localhost:5000/api/health

### 4. Login

Use the default credentials:
- **Username**: `admin`
- **Password**: `admin123`

## What Works

### ✅ Authentication
- Login with JWT tokens
- Token storage in localStorage
- User session management
- Logout functionality

### ✅ Dashboard
- Shows empty statistics (zeros)
- UI components render correctly
- Navigation works
- User profile display

### ✅ Mock Endpoints
All these endpoints return empty data but respond correctly:
- `/api/servers` - Empty server list
- `/api/playbooks` - Empty playbook list
- `/api/jobs` - Empty job list
- `/api/jobs/statistics` - Zero statistics

## What Doesn't Work

### ❌ Job Execution
Ansible playbook execution requires Linux. The full backend with `ansible_runner` must run on a Linux VM.

### ❌ Real CRUD Operations
This server only provides READ operations with empty data. CREATE/UPDATE/DELETE operations are not implemented.

### ❌ Celery Tasks
Async background tasks are not supported on this development server.

## Troubleshooting

### Password Field Shows Dots/Asterisks

**This is correct and intentional!** Password fields should never show plain text. The dots/asterisks are a security feature.

### Login Says "Invalid Credentials"

Check that:
1. The development server is running (see terminal output)
2. MySQL is running: `Get-Service MySQL80`
3. Database exists and has admin user
4. You're using correct credentials: admin/admin123

### Backend Not Responding

1. Stop the server (Ctrl+C)
2. Check MySQL is running
3. Restart the development server
4. Wait 5 seconds before trying to connect

## For Production Use

**This development server is NOT for production!**

For full functionality including Ansible automation:
1. Complete development on Windows
2. Commit code to Git
3. Deploy to Linux VM following the [Linux VM Migration Guide](../PROJECT_SETUP.md#-linux-vm-migration-guide)
4. No code changes required - same codebase runs on Linux

## Technical Details

### Dependencies
- Flask 3.0
- Flask-CORS
- PyJWT
- mysql-connector-python
- bcrypt
- python-dotenv

### Database Connection
Connects directly to MySQL using:
- Host: localhost
- User: infra_user
- Password: infra_pass123
- Database: infra_automation

### JWT Configuration
- Secret key from `.env` file
- Access token: 1 hour expiry
- Refresh token: 30 days expiry

## Files

- `dev_server.py` - Main development server script
- `DEV_SERVER_README.md` - This file

## Support

For issues with:
- **Frontend development**: Check frontend README
- **Database setup**: Check PROJECT_SETUP.md
- **Production deployment**: See Linux VM Migration Guide
- **Full backend functionality**: Deploy to Linux VM
