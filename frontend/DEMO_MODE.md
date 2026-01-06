# 🎭 Demo Mode - For Presentations & Meetings

## Quick Start (No Backend Required!)

### Step 1: Enable Demo Mode

```powershell
cd frontend
Copy-Item .env.demo .env -Force
```

### Step 2: Start Frontend

```powershell
npm run dev
```

### Step 3: Open Browser

Go to: http://localhost:5173

### Step 4: Login

- **Username**: `admin`
- **Password**: `admin123`

## ✅ What Works in Demo Mode

- ✅ **Login** - Full authentication flow with mock JWT
- ✅ **Dashboard** - Shows realistic statistics and data
  - 3 Servers (web, database, dev)
  - 3 Playbooks (deploy, update, backup)
  - 4 Jobs (success, running, failed statuses)
  - 83.33% success rate
- ✅ **Navigation** - All sidebar links work
- ✅ **UI Components** - All visual elements display properly
- ✅ **Data Display** - Tables, cards, badges all functional

## 🎯 Perfect For

- ✅ Client demonstrations
- ✅ Stakeholder meetings
- ✅ UI/UX showcases
- ✅ Feature presentations
- ✅ Training sessions

## 💡 Demo Data Includes

### Servers (3)
1. **web-server-01** (Production) - 192.168.1.10
2. **db-server-01** (Production) - 192.168.1.20
3. **dev-server-01** (Development) - 192.168.1.30

### Playbooks (3)
1. **deploy-webapp** - Web application deployment
2. **system-update** - Security patches
3. **backup-database** - Automated S3 backup

### Jobs (4)
1. ✅ Successful deployment (5 min runtime)
2. ✅ Successful system update (15 min runtime)
3. 🔄 Running backup (in progress)
4. ❌ Failed deployment (connection timeout)

### Statistics
- Total Jobs: 15
- Success Rate: 83.33%
- Running: 1
- Pending: 2

## 🔄 Switch Back to Real Backend

```powershell
# Use the regular .env file
Copy-Item .env.example .env -Force
# Edit .env to point to your backend
notepad .env
```

## 📝 Notes

- Mock data is defined in `src/api/mockApi.ts`
- Network delays are simulated (200-500ms)
- No actual API calls are made
- All data resets on page refresh
- Login always succeeds with admin/admin123

## 🚀 Meeting Ready!

Your application is now ready to showcase with:
- Professional UI
- Realistic data
- Smooth interactions
- Zero dependencies
- No backend needed!
