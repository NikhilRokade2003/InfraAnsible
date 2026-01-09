# Infrastructure Automation Platform - Complete Startup Guide

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                      LINUX VM (192.168.10.200)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   MySQL/     │  │    Redis     │  │    Flask     │     │
│  │  MariaDB     │  │   (Port      │  │   Backend    │     │
│  │  (Port 3306) │  │    6379)     │  │ (Port 5000)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                   │                 │             │
│         └───────────────────┴─────────────────┘             │
│                             │                               │
│                    ┌────────┴────────┐                      │
│                    │  Celery Worker  │                      │
│                    │  (Async Tasks)  │                      │
│                    └─────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
                             ▲
                             │ HTTP API Calls
                             │ (192.168.10.200:5000)
                             │
┌─────────────────────────────────────────────────────────────┐
│                    WINDOWS (Developer PC)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React Frontend (Vite)                   │  │
│  │             http://localhost:5173                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## STARTUP ORDER (CRITICAL!)

```
1. Database (MySQL/MariaDB)  →  Must be running first
2. Redis                     →  Required for Celery
3. Flask Backend            →  Depends on Database + Redis
4. Celery Worker            →  Depends on Backend + Redis
5. Frontend (Windows)       →  Connects to Backend API
```

---

# ═══════════════════════════════════════════════════════════════
# PART 0: PREREQUISITES & ONE-TIME SETUP
# ═══════════════════════════════════════════════════════════════

## A. DATABASE SETUP (Linux VM - One Time Only)

### 1. Ensure MySQL/MariaDB is installed and running

```bash
# Check if MySQL/MariaDB is installed
mysql --version

# Check if it's running
sudo systemctl status mariadb
# OR
sudo systemctl status mysql

# If not running, start it
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

### 2. Create Database and User

```bash
# Login as root
sudo mysql -u root -p

# In MySQL prompt, run:
CREATE DATABASE IF NOT EXISTS infra_automation
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'infra_user'@'localhost' IDENTIFIED BY 'infra_pass123';
GRANT ALL PRIVILEGES ON infra_automation.* TO 'infra_user'@'localhost';

# Allow remote connection from Windows (optional but recommended)
CREATE USER IF NOT EXISTS 'infra_user'@'%' IDENTIFIED BY 'infra_pass123';
GRANT ALL PRIVILEGES ON infra_automation.* TO 'infra_user'@'%';

FLUSH PRIVILEGES;
EXIT;
```

### 3. Import Schema

```bash
# Navigate to backend directory
cd ~/InfraAnsible/backend

# Import the schema
mysql -u infra_user -pinfra_pass123 infra_automation < schema.sql

# Verify tables were created
mysql -u infra_user -pinfra_pass123 -e "USE infra_automation; SHOW TABLES;"
```

### 4. Create Admin User

```bash
# Make sure you're in the backend directory
cd ~/InfraAnsible/backend

# Activate virtual environment
source InfraAuto/bin/activate  # Or your venv name

# Create admin user
flask create-admin

# You should see: "✅ Admin user 'admin' created successfully!"
```

**Expected Output:**
```
✅ Admin user 'admin' created successfully!
   Username: admin
   Password: admin123
   Role: admin
```

## B. BACKEND CONFIGURATION (Linux VM - One Time Only)

### 1. Create .env file

```bash
cd ~/InfraAnsible/backend

# Create .env file
cat > .env << 'EOF'
# Flask Configuration
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production

# Database Configuration
DATABASE_URL=mysql+pymysql://infra_user:infra_pass123@localhost/infra_automation

# Celery & Redis Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# CORS Configuration (Allow Windows frontend)
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Logging
LOG_LEVEL=INFO
EOF

# Verify .env file was created
cat .env
```

### 2. Verify Python Dependencies

```bash
cd ~/InfraAnsible/backend
source InfraAuto/bin/activate

# Check if all packages are installed
pip list | grep -E "Flask|celery|redis|ansible|SQLAlchemy|PyMySQL"

# If any are missing, install
pip install -r requirements.txt
```

## C. FRONTEND CONFIGURATION (Windows - One Time Only)

### 1. Update .env file

Open PowerShell:

```powershell
cd C:\Users\nikhil.rokade_jadegl\Documents\InfraAnsible\frontend

# Create or edit .env file
notepad .env
```

**Add this content:**
```
# Demo Mode - Disabled for real backend connection
VITE_DEMO_MODE=false

# Backend API URL (IMPORTANT: Use your Linux VM IP)
VITE_API_URL=http://192.168.10.200:5000/api
```

**💡 Replace `192.168.10.200` with your actual Linux VM IP address**

### 2. Verify Node Dependencies

```powershell
cd C:\Users\nikhil.rokade_jadegl\Documents\InfraAnsible\frontend

# Check if node_modules exists
dir node_modules

# If not, install dependencies
npm install
```

### 3. Test Connection to Linux VM

```powershell
# Test if you can reach the Linux VM
Test-NetConnection -ComputerName 192.168.10.200 -Port 5000

# Should show: TcpTestSucceeded : True (when backend is running)
```

---

# ═══════════════════════════════════════════════════════════════
# PART 1: START SERVICES ON LINUX VM
# ═══════════════════════════════════════════════════════════════

## Step 1: SSH into Linux VM

```bash
ssh NikhilRokade@192.168.10.200
```

**💡 Replace with your actual VM IP and username**

---

## Step 2: Verify Database is Running

```bash
# Check MySQL/MariaDB status
sudo systemctl status mariadb

# If not running:
sudo systemctl start mariadb

# Quick database test
mysql -u infra_user -pinfra_pass123 -e "SELECT 'Database OK' as status;"
```

**✅ Expected Output:**
```
+-------------+
| status      |
+-------------+
| Database OK |
+-------------+
```

---

## Step 3: Start Redis (MANDATORY - Must Start First!)

```bash
# Start Redis service
sudo systemctl start redis

# Enable Redis to start on boot
sudo systemctl enable redis

# Verify Redis is running
redis-cli ping
```

**✅ Expected Output:**
```
PONG
```

**❌ If Redis fails:**
```bash
# Check Redis status
sudo systemctl status redis

# View Redis logs
sudo journalctl -u redis -n 50

# Restart Redis
sudo systemctl restart redis
```

---

## Step 4: Start Flask Backend (Terminal 1)

```bash
# Navigate to backend directory
cd ~/InfraAnsible/backend

# Activate virtual environment
source InfraAuto/bin/activate

# Verify .env file exists
cat .env | grep DATABASE_URL

# Start Flask development server
python run.py
```

**✅ Expected Output:**
```
 * Serving Flask app 'app'
 * Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment.
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://192.168.10.200:5000
Press CTRL+C to quit
```

**⚠️ KEEP THIS TERMINAL OPEN! Do not close it.**

**❌ If Backend fails to start:**
```bash
# Common issues:

# 1. Port 5000 already in use
sudo lsof -i :5000
# Kill the process: sudo kill -9 <PID>

# 2. Database connection error
mysql -u infra_user -pinfra_pass123 infra_automation -e "SELECT 1;"

# 3. Missing .env file
ls -la .env
cat .env

# 4. Python dependencies missing
pip install -r requirements.txt
```

---

## Step 5: Start Celery Worker (Terminal 2)

**Open a NEW SSH session or use tmux/screen:**

```bash
# New SSH connection
ssh NikhilRokade@192.168.10.200

# Navigate to backend
cd ~/InfraAnsible/backend

# Activate virtual environment
source InfraAuto/bin/activate

# Start Celery worker
celery -A app worker --loglevel=info
```

**✅ Expected Output:**
```
-------------- celery@<hostname> v5.3.4 (emerald-rush)
--- ***** ----- 
-- ******* ---- Linux-5.x.x-x86_64-with-glibc2.xx
- *** --- * --- 
- ** ---------- [config]
- ** ---------- .> app:         app:0x...
- ** ---------- .> transport:   redis://localhost:6379/0
- ** ---------- .> results:     redis://localhost:6379/0
- *** --- * --- .> concurrency: 4 (prefork)
-- ******* ---- .> task events: OFF
--- ***** ----- 
-------------- [queues]
                .> celery           exchange=celery(direct) key=celery

[tasks]
  . app.tasks.execute_playbook

[2026-01-09 12:00:00,000: INFO/MainProcess] Connected to redis://localhost:6379/0
[2026-01-09 12:00:00,000: INFO/MainProcess] mingle: searching for neighbors
[2026-01-09 12:00:00,000: INFO/MainProcess] mingle: all alone
[2026-01-09 12:00:00,000: INFO/MainProcess] celery@<hostname> ready.
```

**⚠️ KEEP THIS TERMINAL OPEN! Do not close it.**

**❌ If Celery fails:**
```bash
# 1. Redis connection error
redis-cli ping

# 2. Check if Redis is accessible
redis-cli -h localhost -p 6379 ping

# 3. Verify Celery configuration
cd ~/InfraAnsible/backend
source InfraAuto/bin/activate
python -c "from app import celery; print(celery.conf.broker_url)"
```

---

## Step 6: Verify Backend is Accessible

**From the Linux VM:**

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Should return: {"status":"healthy"}
```

**From Windows (PowerShell):**

```powershell
# Test from Windows
Invoke-RestMethod -Uri "http://192.168.10.200:5000/api/health"

# Should return: status: healthy
```

---

# ═══════════════════════════════════════════════════════════════
# PART 2: START FRONTEND ON WINDOWS
# ═══════════════════════════════════════════════════════════════

## Step 7: Open PowerShell on Windows

```powershell
# Navigate to frontend directory
cd C:\Users\nikhil.rokade_jadegl\Documents\InfraAnsible\frontend
```

---

## Step 8: Verify Configuration

```powershell
# Check .env file
type .env

# Should show:
# VITE_DEMO_MODE=false
# VITE_API_URL=http://192.168.10.200:5000/api
```

**⚠️ CRITICAL: Make sure `VITE_API_URL` points to your Linux VM IP, NOT localhost!**

---

## Step 9: Start Frontend Development Server

```powershell
npm run dev
```

**✅ Expected Output:**
```
> infra-automation-frontend@1.0.0 dev
> vite

  VITE v5.4.21  ready in 1040 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**💡 Note: If port 5173 is in use, Vite will automatically use 5174 or another port**

---

## Step 10: Open Application in Browser

1. **Open browser** (Chrome, Edge, Firefox)
2. **Navigate to:** `http://localhost:5173`
3. **Login with default credentials:**
   - Username: `admin`
   - Password: `admin123`

**✅ Expected: You should see the Dashboard page**

---

# ═══════════════════════════════════════════════════════════════
# VERIFICATION & TESTING
# ═══════════════════════════════════════════════════════════════

## Complete System Health Check

### 1. Database Check (Linux VM)

```bash
mysql -u infra_user -pinfra_pass123 -e "
USE infra_automation;
SELECT 'Users:', COUNT(*) FROM users
UNION ALL
SELECT 'Servers:', COUNT(*) FROM servers
UNION ALL
SELECT 'Playbooks:', COUNT(*) FROM playbooks
UNION ALL
SELECT 'Jobs:', COUNT(*) FROM jobs;
"
```

### 2. Redis Check (Linux VM)

```bash
redis-cli ping
redis-cli info | grep uptime_in_seconds
```

### 3. Backend Check (Linux VM)

```bash
curl http://localhost:5000/api/health
```

**Expected:** `{"status":"healthy"}`

### 4. Celery Check (Linux VM)

Look at the Celery terminal - should show:
```
[INFO/MainProcess] celery@<hostname> ready.
```

No errors about Redis connection.

### 5. Frontend Check (Windows Browser)

Open browser console (F12) and check:
- ✅ No CORS errors
- ✅ No 404 errors for API calls
- ✅ No network errors
- ✅ Login works
- ✅ Dashboard loads with data

### 6. End-to-End Test

1. **Login** to the application
2. **Navigate to Servers page** - Should load server list
3. **Navigate to Playbooks page** - Should load playbooks
4. **Navigate to Jobs page** - Should load job history
5. **Try creating a new account:**
   - Click "Create an account" on login page
   - Fill in username, email, password
   - Click "Sign Up"
   - Should see success message

---

# ═══════════════════════════════════════════════════════════════
# TROUBLESHOOTING
# ═══════════════════════════════════════════════════════════════

## Problem: "Cannot connect to server" on signup/login

**Cause:** Backend not running or frontend has wrong IP

**Solution:**
```powershell
# On Windows, test connection
Test-NetConnection -ComputerName 192.168.10.200 -Port 5000

# If it fails (TcpTestSucceeded: False):
# 1. Make sure backend is running on Linux VM
# 2. Check Linux VM firewall allows port 5000
```

---

## Problem: "Database connection error" in backend

**Cause:** MySQL not running or wrong credentials

**Solution:**
```bash
# On Linux VM
sudo systemctl status mariadb
mysql -u infra_user -pinfra_pass123 infra_automation -e "SELECT 1;"

# Check .env file
cd ~/InfraAnsible/backend
cat .env | grep DATABASE_URL
```

---

## Problem: Celery shows Redis connection errors

**Cause:** Redis not running

**Solution:**
```bash
# On Linux VM
sudo systemctl status redis
redis-cli ping

# If not running
sudo systemctl start redis
```

---

## Problem: CORS errors in browser console

**Cause:** Backend CORS not configured for frontend URL

**Solution:**
```bash
# On Linux VM, check backend .env
cd ~/InfraAnsible/backend
cat .env | grep CORS_ORIGINS

# Should include: http://localhost:5173
# If not, add it:
echo "CORS_ORIGINS=http://localhost:5173,http://localhost:5174" >> .env

# Restart backend
```

---

## Problem: Port 5000 already in use on Linux

**Solution:**
```bash
# Find what's using port 5000
sudo lsof -i :5000

# Kill the process
sudo kill -9 <PID>

# Or use a different port
export FLASK_RUN_PORT=5001
python run.py
```

---

## Problem: Frontend shows blank page

**Cause:** Node modules not installed or build errors

**Solution:**
```powershell
# On Windows
cd C:\Users\nikhil.rokade_jadegl\Documents\InfraAnsible\frontend

# Reinstall dependencies
Remove-Item -Recurse -Force node_modules
npm install

# Clear Vite cache
Remove-Item -Recurse -Force node_modules\.vite

# Restart dev server
npm run dev
```

---

# ═══════════════════════════════════════════════════════════════
# SHUTDOWN PROCEDURE
# ═══════════════════════════════════════════════════════════════

## Normal Shutdown (End of Day)

### 1. Stop Frontend (Windows)
```
Press Ctrl + C in PowerShell terminal
```

### 2. Stop Celery Worker (Linux VM - Terminal 2)
```
Press Ctrl + C in Celery terminal
```

### 3. Stop Flask Backend (Linux VM - Terminal 1)
```
Press Ctrl + C in Flask terminal
```

### 4. Redis & Database
```bash
# Redis can stay running (recommended for faster restart)
# Database stays running (always-on service)

# If you want to stop them:
sudo systemctl stop redis     # Optional
sudo systemctl stop mariadb   # Not recommended
```

---

# ═══════════════════════════════════════════════════════════════
# QUICK REFERENCE
# ═══════════════════════════════════════════════════════════════

## Startup Order (Remember this!)

```
1. Database  ✅ (Always running)
2. Redis     ✅ sudo systemctl start redis
3. Backend   ✅ python run.py
4. Celery    ✅ celery -A app worker --loglevel=info
5. Frontend  ✅ npm run dev
```

## Key URLs

| Service  | URL                             | Location   |
|----------|---------------------------------|------------|
| Frontend | http://localhost:5173           | Windows    |
| Backend  | http://192.168.10.200:5000      | Linux VM   |
| Health   | http://192.168.10.200:5000/api/health | Linux VM |
| Database | mysql://192.168.10.200:3306     | Linux VM   |
| Redis    | redis://192.168.10.200:6379     | Linux VM   |

## Default Credentials

| Service  | Username/User | Password        |
|----------|---------------|-----------------|
| Admin    | admin         | admin123        |
| Database | infra_user    | infra_pass123   |
| Database | root          | (set by admin)  |

## Common Commands Cheat Sheet

```bash
# Linux VM - Quick Start
ssh NikhilRokade@192.168.10.200
redis-cli ping
cd ~/InfraAnsible/backend && source InfraAuto/bin/activate && python run.py

# Windows - Quick Start
cd C:\Users\nikhil.rokade_jadegl\Documents\InfraAnsible\frontend
npm run dev

# Database Quick Check
mysql -u infra_user -pinfra_pass123 infra_automation -e "SHOW TABLES;"

# View Backend Logs
cd ~/InfraAnsible/backend
tail -f app.log

# Test Backend API
curl http://192.168.10.200:5000/api/health
```

---

# ═══════════════════════════════════════════════════════════════
# USING TMUX FOR PERSISTENT SESSIONS (OPTIONAL BUT RECOMMENDED)
# ═══════════════════════════════════════════════════════════════

Tmux allows you to keep services running even after disconnecting SSH.

## Initial Setup

```bash
# SSH into Linux VM
ssh NikhilRokade@192.168.10.200

# Create new tmux session
tmux new -s infraapp

# Split into 2 panes
Ctrl+b then "   (split horizontally)

# Navigate between panes
Ctrl+b then arrow keys
```

## Running Services in Tmux

**Pane 1: Flask Backend**
```bash
cd ~/InfraAnsible/backend
source InfraAuto/bin/activate
python run.py
```

**Pane 2: Celery Worker**
```bash
cd ~/InfraAnsible/backend
source InfraAuto/bin/activate
celery -A app worker --loglevel=info
```

## Tmux Commands

```bash
# Detach from session (services keep running)
Ctrl+b then d

# List sessions
tmux ls

# Reattach to session
tmux attach -t infraapp

# Kill session (stops all services)
tmux kill-session -t infraapp
```

---

# ═══════════════════════════════════════════════════════════════
# PRODUCTION DEPLOYMENT NOTES
# ═══════════════════════════════════════════════════════════════

**⚠️ For production deployment, DO NOT use `python run.py`**

Use production-grade servers:

```bash
# Backend: Use Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"

# Celery: Use systemd service
sudo systemctl start celery-worker

# Frontend: Build and serve with Nginx
npm run build
# Copy dist/ folder to Nginx web root
```

Refer to production deployment documentation for details.

---

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════

## What Runs Where

**Linux VM (192.168.10.200):**
- ✅ MySQL/MariaDB Database (Port 3306)
- ✅ Redis Server (Port 6379)
- ✅ Flask Backend API (Port 5000)
- ✅ Celery Worker (Background Tasks)

**Windows PC:**
- ✅ React Frontend (Port 5173)

## Critical Configuration Files

**Backend (.env):**
- Database connection string
- Redis connection
- CORS origins (must include frontend URL)

**Frontend (.env):**
- VITE_API_URL (must point to Linux VM IP, not localhost)
- VITE_DEMO_MODE=false

## Remember

1. **Always start in order:** Database → Redis → Backend → Celery → Frontend
2. **Backend must run on Linux VM**, not Windows
3. **Frontend .env must have Linux VM IP**, not localhost
4. **Keep terminals open** for Backend and Celery
5. **Test with health endpoint** before using the app

---

**Need help? Check the Troubleshooting section above!**
