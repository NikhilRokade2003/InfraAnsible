# Audit and Logging

## Overview

The Audit and Logging system provides comprehensive tracking and accountability for all actions performed within the Infra Automation Platform. It maintains a detailed record of user activities, system events, and resource changes to support compliance, security monitoring, and troubleshooting.

## Key Features

### 1. **Comprehensive Activity Tracking**
- All CRUD operations on resources
- User authentication events
- Job execution lifecycle
- System configuration changes

### 2. **Detailed Audit Records**
- Who performed the action
- What action was performed
- When it occurred
- What resource was affected
- Before/after values for updates
- IP address and user agent

### 3. **Security Monitoring**
- Failed login attempts
- Unauthorized access attempts
- Privilege escalations
- Suspicious activity patterns

### 4. **Compliance Support**
- Tamper-proof audit trail
- Retention policies
- Export capabilities
- Chain of custody

## Audit Log Data Model

```python
class AuditLog:
    id: Integer (Primary Key)
    user_id: Integer - Foreign Key to User (nullable for system events)
    action: String(50) - Action type (CREATE, UPDATE, DELETE, LOGIN, etc.)
    resource_type: String(50) - Type of resource (user, server, playbook, job)
    resource_id: Integer - ID of affected resource (nullable)
    details: JSON - Additional contextual information
    ip_address: String(45) - Client IP address
    user_agent: String(500) - Client user agent
    timestamp: DateTime - When the action occurred
    
    # Relationships
    user: User - User who performed action
    
    # Indexes
    Index('idx_audit_user', user_id, timestamp)
    Index('idx_audit_resource', resource_type, resource_id)
    Index('idx_audit_action', action, timestamp)
    Index('idx_audit_timestamp', timestamp)
```

## Logged Events

### 1. **Authentication Events**

| Action | Description | Details Captured |
|--------|-------------|------------------|
| `LOGIN` | Successful login | username, ip_address, user_agent |
| `LOGIN_FAILED` | Failed login attempt | username, reason, ip_address |
| `LOGOUT` | User logout | username, session_duration |
| `TOKEN_REFRESH` | Access token refreshed | username |
| `PASSWORD_CHANGE` | Password changed | username, changed_by |

### 2. **User Management Events**

| Action | Description | Details Captured |
|--------|-------------|------------------|
| `USER_CREATE` | New user created | username, role, created_by |
| `USER_UPDATE` | User details modified | username, changed_fields, old_values, new_values |
| `USER_DEACTIVATE` | User deactivated | username, reason, deactivated_by |
| `USER_REACTIVATE` | User reactivated | username, reactivated_by |
| `ROLE_CHANGE` | User role modified | username, old_role, new_role |

### 3. **Server Management Events**

| Action | Description | Details Captured |
|--------|-------------|------------------|
| `SERVER_CREATE` | Server added | hostname, ip_address, created_by |
| `SERVER_UPDATE` | Server modified | hostname, changed_fields, old_values, new_values |
| `SERVER_DELETE` | Server removed | hostname, ip_address, hard_delete |
| `SERVER_TEST` | Connection test performed | hostname, success, error_message |

### 4. **Playbook Management Events**

| Action | Description | Details Captured |
|--------|-------------|------------------|
| `PLAYBOOK_UPLOAD` | Playbook uploaded | name, file_hash, uploaded_by |
| `PLAYBOOK_UPDATE` | Playbook metadata updated | name, changed_fields |
| `PLAYBOOK_DELETE` | Playbook removed | name, file_path, deleted_by |
| `PLAYBOOK_VALIDATE` | Playbook validated | name, valid, errors |

### 5. **Job Execution Events**

| Action | Description | Details Captured |
|--------|-------------|------------------|
| `JOB_CREATE` | Job created | job_id, playbook, server, created_by |
| `JOB_START` | Job execution started | job_id, worker_id |
| `JOB_COMPLETE` | Job completed | job_id, status, exit_code, duration |
| `JOB_CANCEL` | Job cancelled | job_id, cancelled_by, reason |
| `JOB_RETRY` | Job retried | job_id, original_job_id, retried_by |

### 6. **Ticket Events**

| Action | Description | Details Captured |
|--------|-------------|------------------|
| `TICKET_CREATE` | Ticket created | ticket_id, title, priority, created_by |
| `TICKET_UPDATE` | Ticket updated | ticket_id, changed_fields |
| `TICKET_CLOSE` | Ticket closed | ticket_id, resolution, closed_by |

## Audit Log Structure

### Example Audit Log Entry

```json
{
  "id": 12345,
  "user_id": 5,
  "action": "SERVER_CREATE",
  "resource_type": "server",
  "resource_id": 42,
  "details": {
    "hostname": "web-server-05",
    "ip_address": "192.168.1.105",
    "environment": "production",
    "os_type": "ubuntu"
  },
  "ip_address": "10.0.1.50",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "timestamp": "2024-01-08T10:15:30.123456"
}
```

### Update Event with Before/After

```json
{
  "id": 12346,
  "user_id": 3,
  "action": "USER_UPDATE",
  "resource_type": "user",
  "resource_id": 8,
  "details": {
    "username": "john.doe",
    "changed_fields": ["role", "email"],
    "old_values": {
      "role": "operator",
      "email": "john@old.com"
    },
    "new_values": {
      "role": "admin",
      "email": "john@new.com"
    },
    "updated_by": "admin_user"
  },
  "ip_address": "10.0.1.45",
  "user_agent": "Mozilla/5.0 ...",
  "timestamp": "2024-01-08T11:20:15.789012"
}
```

### Failed Login Attempt

```json
{
  "id": 12347,
  "user_id": null,
  "action": "LOGIN_FAILED",
  "resource_type": "user",
  "resource_id": null,
  "details": {
    "username": "attacker",
    "reason": "invalid_credentials",
    "attempt_number": 5
  },
  "ip_address": "192.168.100.50",
  "user_agent": "curl/7.68.0",
  "timestamp": "2024-01-08T12:30:45.000000"
}
```

## Audit Log API

### Endpoints

| Endpoint | Method | Description | Required Role |
|----------|--------|-------------|---------------|
| `/audit-logs` | GET | List audit logs | Admin |
| `/audit-logs/:id` | GET | Get specific log entry | Admin |
| `/audit-logs/export` | GET | Export logs to file | Admin |
| `/audit-logs/statistics` | GET | Get audit statistics | Admin |
| `/audit-logs/user/:id` | GET | Get logs for specific user | Admin |
| `/audit-logs/resource/:type/:id` | GET | Get logs for specific resource | Admin |

### List Audit Logs with Filtering

```bash
GET /audit-logs?action=LOGIN_FAILED&start_date=2024-01-01&end_date=2024-01-08&page=1&per_page=50
Authorization: Bearer <admin_token>
```

### Query Parameters

- `user_id` - Filter by user
- `action` - Filter by action type
- `resource_type` - Filter by resource type
- `resource_id` - Filter by specific resource
- `start_date` - Start of date range
- `end_date` - End of date range
- `ip_address` - Filter by IP address
- `page` - Page number
- `per_page` - Items per page (max: 100)

### Response

```json
{
  "items": [
    {
      "id": 12345,
      "user": {
        "id": 5,
        "username": "john.doe"
      },
      "action": "SERVER_CREATE",
      "resource_type": "server",
      "resource_id": 42,
      "details": {
        "hostname": "web-server-05",
        "ip_address": "192.168.1.105"
      },
      "ip_address": "10.0.1.50",
      "timestamp": "2024-01-08T10:15:30"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 15234,
    "pages": 305
  }
}
```

### Export Audit Logs

```bash
GET /audit-logs/export?format=csv&start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <admin_token>
```

Supported formats:
- `csv` - Comma-separated values
- `json` - JSON array
- `xlsx` - Excel spreadsheet (future)

### Get Audit Statistics

```bash
GET /audit-logs/statistics?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <admin_token>
```

### Response

```json
{
  "period": {
    "start": "2024-01-01T00:00:00",
    "end": "2024-01-31T23:59:59"
  },
  "total_events": 45678,
  "by_action": {
    "LOGIN": 1234,
    "LOGIN_FAILED": 89,
    "SERVER_CREATE": 156,
    "JOB_CREATE": 2890,
    "JOB_COMPLETE": 2750
  },
  "by_user": [
    {
      "user_id": 5,
      "username": "john.doe",
      "event_count": 3456
    },
    {
      "user_id": 3,
      "username": "admin",
      "event_count": 2890
    }
  ],
  "failed_logins": {
    "total": 89,
    "unique_ips": 12,
    "unique_usernames": 8
  },
  "high_activity_ips": [
    {
      "ip_address": "10.0.1.50",
      "event_count": 5678
    }
  ]
}
```

### Get User Activity

```bash
GET /audit-logs/user/5?start_date=2024-01-01&page=1&per_page=50
Authorization: Bearer <admin_token>
```

Returns all audit logs for a specific user.

### Get Resource History

```bash
GET /audit-logs/resource/server/42
Authorization: Bearer <admin_token>
```

Returns complete history for a specific resource (e.g., all changes to server #42).

## Security Features

### 1. **Immutable Audit Trail**

- Audit logs cannot be modified after creation
- No DELETE endpoint for audit logs
- Database triggers prevent direct modifications
- Append-only storage

### 2. **Comprehensive Capture**

All operations captured:
- Successful and failed operations
- User-initiated and system-initiated events
- API requests and background tasks
- Configuration changes

### 3. **Sensitive Data Protection**

Never logged:
- Passwords (plain or hashed)
- SSH private keys
- API tokens
- Credit card numbers
- Other secrets

### 4. **Chain of Custody**

Each audit log includes:
- Exact timestamp (microsecond precision)
- User attribution
- Source IP and user agent
- Complete context in details field

## Implementation

### Creating Audit Log Entries

```python
# Example: Creating audit log in server service
def create_server(data, user_id):
    # Create server
    server = Server(**data)
    db.session.add(server)
    db.session.commit()
    
    # Create audit log
    audit = AuditLog(
        user_id=user_id,
        action='SERVER_CREATE',
        resource_type='server',
        resource_id=server.id,
        details={
            'hostname': server.hostname,
            'ip_address': server.ip_address,
            'environment': server.environment
        },
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent'),
        timestamp=datetime.utcnow()
    )
    db.session.add(audit)
    db.session.commit()
    
    return server
```

### Automatic Audit Logging Decorator

```python
def audit_action(action, resource_type):
    """Decorator to automatically create audit logs"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            
            # Create audit log
            create_audit_log(
                user_id=get_current_user_id(),
                action=action,
                resource_type=resource_type,
                resource_id=getattr(result, 'id', None),
                details=serialize_for_audit(result),
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
            
            return result
        return wrapper
    return decorator

# Usage
@audit_action('SERVER_CREATE', 'server')
def create_server(data, user_id):
    # ... implementation
    pass
```

## Monitoring and Alerting

### Security Alerts

Trigger alerts for:
- Multiple failed login attempts from same IP
- Multiple failed login attempts for same username
- Privilege escalation (role changes)
- Resource deletion by non-admin
- Access from unusual IP addresses
- High volume of activity from single user

### Alert Configuration Example

```python
ALERT_RULES = {
    'failed_logins': {
        'threshold': 5,
        'window': '5 minutes',
        'action': 'email_admin'
    },
    'privilege_escalation': {
        'action': 'email_admin_immediately'
    },
    'unusual_ip': {
        'threshold': 'never_seen_before',
        'action': 'require_2fa'
    }
}
```

## Compliance and Retention

### Retention Policies

Different retention periods by event type:

| Event Type | Retention Period | Reason |
|------------|------------------|--------|
| Authentication | 90 days | Security monitoring |
| User changes | 7 years | Compliance (SOX, etc.) |
| Resource CRUD | 1 year | Operational history |
| Job execution | 90 days | Troubleshooting |
| System events | 30 days | Debugging |

### Archival Process

1. **Identify Old Logs**: Query logs older than retention period
2. **Export to Archive**: Export to long-term storage (S3, etc.)
3. **Compress**: Gzip or similar compression
4. **Verify**: Ensure archive is readable
5. **Delete from DB**: Remove from active database
6. **Document**: Record archive location

### Data Protection

- **Encryption at Rest**: Encrypt database and archives
- **Access Control**: Restrict audit log access to admins only
- **Backup**: Regular backups of audit logs
- **Geographic Redundancy**: Replicate to multiple locations

## Use Cases

### 1. **Security Investigation**

**Scenario**: Suspicious activity detected

```bash
# Find all actions by suspicious user
GET /audit-logs?user_id=15&start_date=2024-01-08

# Find all failed logins
GET /audit-logs?action=LOGIN_FAILED&start_date=2024-01-08

# Find activity from suspicious IP
GET /audit-logs?ip_address=192.168.100.50
```

### 2. **Compliance Audit**

**Scenario**: Auditor requests access to all privilege changes

```bash
# Get all role changes
GET /audit-logs?action=ROLE_CHANGE&start_date=2024-01-01&end_date=2024-12-31

# Export for auditor
GET /audit-logs/export?format=csv&action=ROLE_CHANGE&start_date=2024-01-01
```

### 3. **Troubleshooting**

**Scenario**: Server configuration issue

```bash
# Get all changes to specific server
GET /audit-logs/resource/server/42

# See who modified it
```

Response shows:
```json
{
  "items": [
    {
      "action": "SERVER_UPDATE",
      "user": {"username": "admin"},
      "details": {
        "changed_fields": ["ssh_key_path"],
        "old_values": {"ssh_key_path": "/old/key.pem"},
        "new_values": {"ssh_key_path": "/new/key.pem"}
      },
      "timestamp": "2024-01-08T09:30:00"
    }
  ]
}
```

### 4. **User Activity Review**

**Scenario**: Manager wants to review team member's activity

```bash
# Get all activity for user
GET /audit-logs/user/8?start_date=2024-01-01&end_date=2024-01-07
```

## Reporting

### Pre-Built Reports

1. **User Activity Report**
   - Actions per user
   - Most active users
   - Inactive users

2. **Security Report**
   - Failed login attempts
   - Privilege changes
   - Unusual access patterns

3. **Resource Change Report**
   - All changes to servers
   - All changes to playbooks
   - Deletion events

4. **Job Execution Report**
   - Jobs per user
   - Success/failure rates
   - Most executed playbooks

### Custom Reports

Administrators can create custom reports by combining filters:

```bash
# Example: All admin actions in production
GET /audit-logs?user_role=admin&resource_details.environment=production&start_date=2024-01-01
```

## Best Practices

### For Administrators

1. **Regular Review**: Review audit logs weekly for anomalies
2. **Set Up Alerts**: Configure alerts for critical events
3. **Retention Compliance**: Ensure retention policies meet regulations
4. **Access Control**: Restrict audit log access to authorized personnel
5. **Export Regularly**: Export logs for long-term archival

### For Developers

1. **Log Everything**: Better to log too much than too little
2. **Structured Details**: Use consistent JSON structure in details field
3. **No Secrets**: Never log passwords, keys, or tokens
4. **Async Logging**: Use background tasks for logging to avoid performance impact
5. **Error Handling**: Ensure logging failures don't break main functionality

### For Security Teams

1. **Monitor Patterns**: Look for unusual patterns, not just individual events
2. **Correlate Events**: Combine audit logs with system logs
3. **Baseline Normal**: Establish baseline of normal activity
4. **Automate Detection**: Use automated tools for anomaly detection

## Performance Considerations

### 1. **Indexing Strategy**

Critical indexes:
- `(user_id, timestamp)` - User activity queries
- `(resource_type, resource_id)` - Resource history
- `(action, timestamp)` - Action-based queries
- `(timestamp)` - Time-range queries

### 2. **Query Optimization**

- Use indexes effectively
- Limit result sets with pagination
- Use date ranges to reduce scan size
- Consider read replicas for reporting

### 3. **Storage Management**

- Archive old logs regularly
- Compress archived logs
- Use partitioning for large tables
- Monitor database size

## Troubleshooting

### Missing Audit Logs

**Possible Causes:**
- Logging code not called
- Database transaction rolled back
- Logging service unavailable

**Solution:**
- Verify logging code is executed
- Check for exceptions in logs
- Ensure database connectivity

### Performance Degradation

**Possible Causes:**
- Missing indexes
- Table too large
- Inefficient queries

**Solution:**
- Verify indexes exist
- Archive old logs
- Optimize query patterns

## Future Enhancements

- **Real-Time Streaming**: WebSocket-based live audit log viewing
- **Advanced Analytics**: Machine learning for anomaly detection
- **SIEM Integration**: Export to Security Information and Event Management systems
- **Blockchain Verification**: Cryptographic verification of audit trail integrity
- **Geographic Tracking**: Enhanced location tracking with GeoIP
- **Behavioral Analytics**: User behavior profiling and anomaly detection

## Related Documentation

- [Authentication and Authorization](./Authentication-and-Authorization.md)
- [User Management](./User-Management.md)
- [Security Best Practices](../backend/SECURITY.md)
- [Database Design](../backend/DATABASE_DESIGN.md)
