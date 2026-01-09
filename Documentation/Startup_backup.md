IMPORTANT CONTEXT

Backend + Celery + Redis → Linux VM
                
Frontend → Windows

Order matters

==========================================
## PART 1: Start Everything on the Linux VM 
==========================================
# 1) Login to Linux VM
-- ssh NikhilRokade@<VM-IP>

=====================================================================

# 2) Start Redis (FIRST – mandatory)

-- Redis must be running before Celery.

-- sudo systemctl start redis
-- sudo systemctl enable redis

Verify:
-- redis-cli ping

✅ Expected:
PONG

=====================================================================

# 3) Start Flask Backend (Terminal 1)
-- cd ~/InfraAnsible/backend
-- source venv/bin/activate
-- python run.py

✅ Expected:
Running on http://0.0.0.0:5000

=====================================================================
⚠️ Keep this terminal OPEN
=====================================================================

# 4) Start Celery Worker (Terminal 2)
Open another PuTTY window (or use screen/tmux).

-- cd ~/InfraAnsible/backend
-- source venv/bin/activate
-- celery -A app worker --loglevel=info

✅ Expected:
[INFO/MainProcess] celery@jgpnabhi ready.

=====================================================================
⚠️ Keep this terminal OPEN
=====================================================================

===================================
## PART 2: Start Frontend on Windows
===================================
# 5) Open Windows Terminal / PowerShell
-- cd C:\Users\nikhil.rokade_jadegl\Documents\InfraAnsible\frontend

=====================================================================

# 6) Ensure backend URL is correct
Open or verify:
-- frontend\.env

VITE_API_URL=http://<LINUX_VM_IP>:5000/api

=====================================================================
⚠️ Must be Linux VM IP, not localhost
=====================================================================

# 7) Start Frontend
-- npm run dev

✅ Expected:
Local: http://localhost:5173

====================================================================

# 8) Open Application in Browser
Open: http://localhost:5173

Login:-   Username: admin
          Password: admin123

===================================================================


## FINAL VERIFICATION CHECKLIST
After everything is running, confirm:

# Backend
curl http://localhost:5000/api/health

Expected:
{"status":"healthy"}
===================================================================
# Celery
Shows “ready”
No Redis connection errors
===================================================================
# Frontend
Login works
Dashboard loads
No API errors in browser console
===================================================================
# NORMAL SHUTDOWN (when done)
Stop Frontend
-- Ctrl + C

Stop Celery
-- Ctrl + C

Stop Backend
-- Ctrl + C

Redis can stay running (recommended).

=================================================================

## One-line memory trick

Redis → Backend → Celery → Frontend

Always start in this order.

=================================================================

## DATABASE ACCESS AND VERIFICATION

### Connect to Database on Linux VM

After starting the backend, you can access the database to verify data:

#### Option 1: From Linux VM (Direct)

```bash
# SSH into your Linux VM first
ssh NikhilRokade@<VM-IP>

# Connect to MySQL/MariaDB
mysql -u infra_user -p
# Enter password: infra_pass123
```

#### Option 2: From Windows (Remote)

```bash
# If MySQL client is installed on Windows
mysql -h <LINUX_VM_IP> -u infra_user -p infra_automation
# Enter password: infra_pass123
```

### Essential Database Commands

Once connected to MySQL, run these commands:

```sql
-- Switch to the database
USE infra_automation;

-- Show all tables
SHOW TABLES;

-- View table structures
DESCRIBE users;
DESCRIBE servers;
DESCRIBE playbooks;
DESCRIBE jobs;
DESCRIBE job_logs;
DESCRIBE audit_logs;

-- Check data in tables
SELECT * FROM users;
SELECT * FROM servers;
SELECT * FROM playbooks;
SELECT * FROM jobs;

-- Count records
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM servers;
SELECT COUNT(*) FROM jobs;

-- Check specific user
SELECT id, username, email, role, is_active, created_at 
FROM users 
WHERE username = 'admin';

-- View recent jobs
SELECT j.id, j.job_id, j.status, p.name as playbook, s.hostname as server, j.created_at
FROM jobs j
JOIN playbooks p ON j.playbook_id = p.id
JOIN servers s ON j.server_id = s.id
ORDER BY j.created_at DESC
LIMIT 10;

-- View audit logs
SELECT id, user_id, action, resource_type, timestamp
FROM audit_logs
ORDER BY timestamp DESC
LIMIT 20;

-- Exit MySQL
EXIT;
```

### Quick Database Health Check Script

Create a quick check script on Linux VM:

```bash
# Create check script
cat > ~/check_db.sh << 'EOF'
#!/bin/bash
echo "=== Database Connection Test ==="
mysql -u infra_user -pinfra_pass123 -e "SELECT 'Connected successfully!' as status;"

echo -e "\n=== Tables in infra_automation ==="
mysql -u infra_user -pinfra_pass123 infra_automation -e "SHOW TABLES;"

echo -e "\n=== Table Row Counts ==="
mysql -u infra_user -pinfra_pass123 infra_automation -e "
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'servers', COUNT(*) FROM servers
UNION ALL
SELECT 'playbooks', COUNT(*) FROM playbooks
UNION ALL
SELECT 'jobs', COUNT(*) FROM jobs
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs;"

echo -e "\n=== Admin User(s) ==="
mysql -u infra_user -pinfra_pass123 infra_automation -e "
SELECT id, username, email, role, is_active, created_at 
FROM users 
WHERE role = 'admin' 
ORDER BY created_at DESC;"
EOF

chmod +x ~/check_db.sh

# Run the check
./check_db.sh
```

### Database Troubleshooting

If you cannot connect to the database:

```bash
# Check if MySQL/MariaDB is running
sudo systemctl status mariadb
# or
sudo systemctl status mysql

# Verify MySQL is listening
sudo netstat -tlnp | grep 3306

# Check database exists
mysql -u infra_user -pinfra_pass123 -e "SHOW DATABASES;"

# View MySQL error log
sudo tail -f /var/log/mysql/error.log
```

### GUI Option: MySQL Workbench (Windows)

For a graphical interface:

1. **Install MySQL Workbench** on Windows
2. **Create new connection**:
   - Connection Name: `Infra Automation DB`
   - Hostname: `<LINUX_VM_IP>`
   - Port: `3306`
   - Username: `infra_user`
   - Password: `infra_pass123`
   - Default Schema: `infra_automation`
3. **Connect** and browse tables visually

=================================================================