"""
Development Server for Windows Testing
Minimal Flask server that handles auth without ansible_runner
USE ONLY FOR TESTING LOGIN/UI - NO JOB EXECUTION
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import jwt
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv
import bcrypt

load_dotenv()

app = Flask(__name__)
CORS(app, origins=['http://localhost:5173'])

# Configuration
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-change-in-production')
DB_CONFIG = {
    'host': 'localhost',
    'user': 'infra_user',
    'password': 'infra_pass123',
    'database': 'infra_automation'
}

def get_db_connection():
    """Get MySQL database connection"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Database connection error: {e}")
        return None

def verify_password(stored_password, provided_password):
    """Simple password verification"""
    try:
        return bcrypt.checkpw(provided_password.encode('utf-8'), stored_password.encode('utf-8'))
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'mode': 'DEVELOPMENT',
        'warning': 'Mock server - login only, no job execution'
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login endpoint"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, username, email, role, password_hash FROM users WHERE username = %s",
            (username,)
        )
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Verify password
        if not verify_password(user['password_hash'], password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Generate JWT tokens
        access_token = jwt.encode(
            {
                'user_id': user['id'],
                'username': user['username'],
                'role': user['role'],
                'exp': datetime.utcnow() + timedelta(hours=1)
            },
            app.config['SECRET_KEY'],
            algorithm='HS256'
        )
        
        refresh_token = jwt.encode(
            {
                'user_id': user['id'],
                'exp': datetime.utcnow() + timedelta(days=30)
            },
            app.config['SECRET_KEY'],
            algorithm='HS256'
        )
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role']
            }
        })
        
    except Error as e:
        print(f"Database error: {e}")
        return jsonify({'error': 'Database error'}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    """Get current user info"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'No token provided'}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, username, email, role FROM users WHERE id = %s",
            (user_id,)
        )
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user)
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/servers', methods=['GET'])
def get_servers():
    """Mock servers endpoint"""
    return jsonify({
        'items': [],
        'total': 0,
        'page': 1,
        'per_page': 20,
        'pages': 0
    })

@app.route('/api/playbooks', methods=['GET'])
def get_playbooks():
    """Mock playbooks endpoint"""
    return jsonify({
        'items': [],
        'total': 0,
        'page': 1,
        'per_page': 20,
        'pages': 0
    })

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    """Mock jobs endpoint"""
    return jsonify({
        'items': [],
        'total': 0,
        'page': 1,
        'per_page': 20,
        'pages': 0
    })

@app.route('/api/jobs/statistics', methods=['GET'])
def get_job_statistics():
    """Mock job statistics endpoint"""
    return jsonify({
        'total_jobs': 0,
        'pending': 0,
        'running': 0,
        'completed': 0,
        'failed': 0,
        'success_rate': 0.0
    })

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 DEVELOPMENT SERVER FOR WINDOWS TESTING")
    print("="*60)
    print("⚠️  WARNING: This is a minimal mock server")
    print("✅ Login/Auth: WORKS")
    print("✅ Dashboard: WORKS (empty data)")
    print("❌ Job Execution: NOT SUPPORTED")
    print("❌ Ansible: NOT SUPPORTED")
    print("\n📋 Use this ONLY to test login and UI components")
    print("🐧 For full functionality, deploy to Linux VM")
    print("="*60 + "\n")
    
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)
