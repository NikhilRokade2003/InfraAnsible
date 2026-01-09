# Server Management

## Overview

The Server Management module provides comprehensive inventory management for infrastructure servers. It allows users to register, configure, monitor, and organize servers that will be targeted by Ansible playbook executions.

## Key Features

### 1. **Server Inventory**
- Centralized repository for all managed servers
- Support for both IPv4 and IPv6 addresses
- Flexible metadata storage with tags
- Environment-based organization (dev, staging, production)

### 2. **Server Configuration**
- SSH connection parameters (port, user, key path)
- Operating system details (type, version)
- Custom tags for organization and filtering
- Detailed descriptions

### 3. **Search and Filtering**
- Search by hostname, IP address, or description
- Filter by environment, OS type, and active status
- Pagination support for large inventories
- Advanced query capabilities

### 4. **Server Status Management**
- Active/Inactive status tracking
- Soft delete capability (admin only)
- Last updated timestamps

## Server Data Model

```python
class Server:
    id: Integer (Primary Key)
    hostname: String(255) - Unique, Indexed
    ip_address: String(45) - Indexed, IPv4/IPv6 support
    os_type: String(50) - e.g., ubuntu, centos, rhel, debian
    os_version: String(50)
    ssh_port: Integer (default: 22)
    ssh_user: String(50) (default: 'root')
    ssh_key_path: String(500) - Path to private SSH key
    tags: JSON - Flexible metadata
    environment: String(50) - dev, staging, production
    description: Text
    is_active: Boolean (default: True)
    created_at: DateTime
    updated_at: DateTime
```

### Database Indexes

For optimal query performance:
- `hostname` - Unique index
- `ip_address` - Index for quick lookups
- `(is_active, environment)` - Composite index for common filters

## Core Components

### 1. **ServerService** (`app/services/server_service.py`)

Business logic for server operations:

- **`create_server(data, user_id)`**: Add new server to inventory
- **`get_server(server_id)`**: Retrieve server by ID
- **`get_all_servers(filters, page, per_page)`**: List servers with filtering/pagination
- **`update_server(server_id, data, user_id)`**: Modify server configuration
- **`delete_server(server_id, user_id, hard_delete)`**: Remove server (soft/hard)
- **`test_connection(server_id)`**: Verify SSH connectivity
- **`get_server_statistics()`**: Aggregate server counts and metrics

### 2. **Server API Endpoints** (`app/api/servers.py`)

| Endpoint | Method | Description | Required Role |
|----------|--------|-------------|---------------|
| `/servers` | GET | List all servers | Viewer+ |
| `/servers` | POST | Create new server | Operator+ |
| `/servers/:id` | GET | Get server details | Viewer+ |
| `/servers/:id` | PUT | Update server | Operator+ |
| `/servers/:id` | DELETE | Delete server | Admin |
| `/servers/:id/test` | POST | Test SSH connection | Operator+ |
| `/servers/statistics` | GET | Get server statistics | Viewer+ |

## Workflows

### 1. **Adding a New Server**

```
┌─────────┐                              ┌─────────────┐
│ Client  │                              │   Backend   │
└────┬────┘                              └──────┬──────┘
     │                                          │
     │  1. POST /servers                        │
     │  {                                       │
     │    hostname: "web-server-01",            │
     │    ip_address: "192.168.1.100",         │
     │    os_type: "ubuntu",                    │
     │    ssh_user: "ubuntu",                   │
     │    environment: "production"             │
     │  }                                       │
     ├──────────────────────────────────────────>│
     │                                          │
     │  2. Validate Data                        │
     │     - Check hostname uniqueness          │
     │     - Check IP uniqueness                │
     │     - Validate required fields           │
     │                                          │
     │  3. Create Server Record                 │
     │     - Insert into database               │
     │     - Generate timestamps                │
     │     - Create audit log                   │
     │                                          │
     │  4. Response                             │
     │  {                                       │
     │    id: 1,                                │
     │    hostname: "web-server-01",            │
     │    status: "created",                    │
     │    created_at: "2024-01-08T10:00:00"     │
     │  }                                       │
     │<──────────────────────────────────────────┤
     │                                          │
```

### 2. **Server Connection Test**

```
┌─────────┐                              ┌─────────────┐
│ Client  │                              │   Backend   │
└────┬────┘                              └──────┬──────┘
     │                                          │
     │  1. POST /servers/1/test                 │
     ├──────────────────────────────────────────>│
     │                                          │
     │  2. Retrieve Server Config               │
     │     - Get SSH parameters                 │
     │     - Get credentials                    │
     │                                          │
     │  3. Attempt SSH Connection               │
     │     - Connect to server                  │
     │     - Execute test command               │
     │     - Verify response                    │
     │                                          │
     │  4. Response                             │
     │  {                                       │
     │    success: true,                        │
     │    message: "Connection successful",     │
     │    os_info: "Ubuntu 22.04 LTS",         │
     │    uptime: "3 days, 2 hours"            │
     │  }                                       │
     │<──────────────────────────────────────────┤
     │                                          │
```

## API Examples

### Create Server

```bash
POST /servers
Authorization: Bearer <token>
Content-Type: application/json

{
  "hostname": "web-server-01",
  "ip_address": "192.168.1.100",
  "os_type": "ubuntu",
  "os_version": "22.04",
  "ssh_user": "ubuntu",
  "ssh_port": 22,
  "ssh_key_path": "/home/ansible/.ssh/id_rsa",
  "environment": "production",
  "tags": {
    "tier": "web",
    "region": "us-east-1",
    "team": "platform"
  },
  "description": "Production web server for main application"
}
```

### Response

```json
{
  "id": 1,
  "hostname": "web-server-01",
  "ip_address": "192.168.1.100",
  "os_type": "ubuntu",
  "os_version": "22.04",
  "ssh_port": 22,
  "ssh_user": "ubuntu",
  "ssh_key_path": "/home/ansible/.ssh/id_rsa",
  "environment": "production",
  "tags": {
    "tier": "web",
    "region": "us-east-1",
    "team": "platform"
  },
  "description": "Production web server for main application",
  "is_active": true,
  "created_at": "2024-01-08T10:00:00",
  "updated_at": "2024-01-08T10:00:00"
}
```

### List Servers with Filtering

```bash
GET /servers?environment=production&os_type=ubuntu&is_active=true&page=1&per_page=20
Authorization: Bearer <token>
```

### Response

```json
{
  "items": [
    {
      "id": 1,
      "hostname": "web-server-01",
      "ip_address": "192.168.1.100",
      "os_type": "ubuntu",
      "environment": "production",
      "is_active": true
    },
    {
      "id": 2,
      "hostname": "web-server-02",
      "ip_address": "192.168.1.101",
      "os_type": "ubuntu",
      "environment": "production",
      "is_active": true
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 2,
    "pages": 1
  }
}
```

### Search Servers

```bash
GET /servers?search=web&page=1
Authorization: Bearer <token>
```

Search looks through:
- Hostname
- IP address
- Description

### Update Server

```bash
PUT /servers/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Updated description",
  "tags": {
    "tier": "web",
    "region": "us-east-1",
    "team": "platform",
    "maintenance": "scheduled"
  },
  "is_active": true
}
```

### Delete Server

```bash
# Soft delete (default)
DELETE /servers/1
Authorization: Bearer <token>

# Hard delete (permanent)
DELETE /servers/1?hard=true
Authorization: Bearer <token>
```

## Server Tags

Tags provide flexible metadata for organizing servers:

### Common Tag Patterns

```json
{
  "environment": "production",
  "tier": "web|app|db|cache",
  "region": "us-east-1|us-west-2|eu-west-1",
  "team": "platform|devops|engineering",
  "cost_center": "engineering|sales|marketing",
  "maintenance_window": "sunday-2am",
  "monitoring": "enabled",
  "backup": "daily|weekly",
  "compliance": "pci|hipaa|sox"
}
```

### Using Tags for Bulk Operations

Tags can be used to:
- Filter servers for bulk playbook execution
- Group servers for monitoring dashboards
- Apply consistent configurations
- Generate inventory reports

## Validation Rules

### Required Fields
- `hostname` - Must be unique, 1-255 characters
- `ip_address` - Valid IPv4 or IPv6 address
- `os_type` - Must be a recognized OS (ubuntu, centos, rhel, debian, etc.)
- `ssh_user` - Valid username, 1-50 characters

### Optional Fields
- `os_version` - OS version string
- `ssh_port` - Valid port number (1-65535), default: 22
- `ssh_key_path` - File system path to SSH private key
- `environment` - Arbitrary string (recommended: dev, staging, production)
- `tags` - Valid JSON object
- `description` - Text description

### Uniqueness Constraints
- `hostname` - Must be globally unique
- `ip_address` - Should be unique (warning if duplicate)

## Security Considerations

### 1. **SSH Key Management**
- Store private keys securely on the backend server
- Use read-only permissions (0400 or 0600)
- Rotate keys periodically
- Never transmit private keys over API

### 2. **Access Control**
- Viewers can only read server information
- Operators can create and update servers
- Only admins can delete servers
- SSH keys visible only to operators and admins

### 3. **Credential Encryption**
- SSH key paths stored in database
- Actual keys stored on filesystem with restricted permissions
- Option to use SSH agent for key management

### 4. **Audit Trail**
All server operations are logged:
- Server creation (who, when, what)
- Configuration changes (before/after values)
- Deletion events
- Connection test attempts

## Integration with Job Execution

When executing jobs:
1. Job references server by ID
2. System retrieves server configuration
3. Ansible playbook executed with server parameters
4. Results logged and associated with server

```python
# Job creation references server
job = Job(
    playbook_id=1,
    server_id=2,  # References server in inventory
    user_id=1,
    extra_vars={}
)
```

## Best Practices

### For Administrators

1. **Consistent Naming**: Use standardized hostname conventions
   - `<type>-<env>-<number>` (e.g., web-prod-01)
   
2. **Tag Strategy**: Define and document tag schema
   - Consistent key names across all servers
   - Hierarchical tagging (region > datacenter > rack)

3. **Environment Segregation**: Clearly separate environments
   - Different SSH keys per environment
   - Network-level isolation

4. **Regular Audits**: Review server inventory
   - Remove decommissioned servers
   - Update outdated configurations
   - Verify SSH connectivity

5. **Documentation**: Maintain server descriptions
   - Purpose of each server
   - Dependencies and relationships
   - Special configuration notes

### For Operators

1. **Verify Before Adding**: Check server accessibility before registration
2. **Complete Information**: Fill all relevant fields and tags
3. **Test Connectivity**: Use the test endpoint after adding servers
4. **Update Regularly**: Keep OS versions and descriptions current

## Troubleshooting

### Common Issues

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Duplicate hostname error | Server already exists | Use unique hostname or update existing |
| Connection test fails | SSH key invalid | Verify key path and permissions |
| Server not appearing in list | Marked as inactive | Check `is_active` status |
| Permission denied on delete | Insufficient role | Only admins can delete servers |

## Related Documentation

- [Job Execution and Monitoring](./Job-Execution-and-Monitoring.md)
- [Playbook Management](./Playbook-Management.md)
- [API Documentation](../backend/API_DOCS.md)
- [Database Design](../backend/DATABASE_DESIGN.md)
