# Start Development Server for Windows Testing
# Run this script from the backend directory

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Starting Development Server..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Set working directory
Set-Location $PSScriptRoot

# Set environment variables
$env:FLASK_ENV = "development"
$env:PYTHONUNBUFFERED = "1"

# Start the server
Write-Host "📍 Working Directory: $PSScriptRoot" -ForegroundColor Yellow
Write-Host "🚀 Starting Flask server on http://localhost:5000" -ForegroundColor Green
Write-Host "⚠️  Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

& ".\InfraAuto\Scripts\python.exe" "dev_server.py"
