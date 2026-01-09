# Playbook Management

## Overview

The Playbook Management module handles the upload, storage, organization, and lifecycle of Ansible playbooks. It provides a centralized repository for automation scripts that can be executed against managed servers.

## Key Features

### 1. **Playbook Upload and Storage**
- Secure file upload via API
- File integrity verification (SHA-256 hashing)
- Organized filesystem storage
- Version control support (future enhancement)

### 2. **Playbook Metadata**
- Name and description
- Tags for categorization
- Default variables
- File integrity tracking

### 3. **Playbook Organization**
- Search and filtering capabilities
- Tag-based categorization
- Active/Inactive status management
- Usage statistics

### 4. **Security Features**
- File type validation (only .yml and .yaml)
- Secure filename generation
- File permission management
- Access control based on user roles

## Playbook Data Model

```python
class Playbook:
    id: Integer (Primary Key)
    name: String(255) - Unique, Indexed
    description: Text
    file_path: String(500) - Linux filesystem path
    file_hash: String(64) - SHA256 checksum
    tags: JSON - Flexible categorization
    variables: JSON - Default variables for execution
    is_active: Boolean (default: True)
    created_at: DateTime
    updated_at: DateTime
    
    # Relationships
    jobs: List[Job] - Jobs using this playbook
```

## Core Components

### 1. **PlaybookService** (`app/services/playbook_service.py`)

Business logic for playbook operations:

- **`create_playbook()`**: Upload and register new playbook
- **`get_playbook(playbook_id)`**: Retrieve playbook by ID
- **`get_all_playbooks(filters, page, per_page)`**: List playbooks with filtering
- **`update_playbook(playbook_id, data, user_id)`**: Update playbook metadata
- **`delete_playbook(playbook_id, user_id)`**: Remove playbook (soft/hard)
- **`get_playbook_content(playbook_id)`**: Read playbook file content
- **`validate_playbook(file_path)`**: Validate YAML syntax
- **`get_playbook_statistics()`**: Aggregate usage metrics

### 2. **Playbook API Endpoints** (`app/api/playbooks.py`)

| Endpoint | Method | Description | Required Role |
|----------|--------|-------------|---------------|
| `/playbooks` | GET | List all playbooks | Viewer+ |
| `/playbooks/upload` | POST | Upload new playbook | Operator+ |
| `/playbooks/:id` | GET | Get playbook details | Viewer+ |
| `/playbooks/:id` | PUT | Update playbook metadata | Operator+ |
| `/playbooks/:id` | DELETE | Delete playbook | Admin |
| `/playbooks/:id/content` | GET | Get playbook file content | Operator+ |
| `/playbooks/:id/validate` | POST | Validate playbook syntax | Operator+ |

## Workflows

### 1. **Uploading a Playbook**

```
┌─────────┐                              ┌─────────────┐
│ Client  │                              │   Backend   │
└────┬────┘                              └──────┬──────┘
     │                                          │
     │  1. POST /playbooks/upload               │
     │  Form Data:                              │
     │    - file: playbook.yml                  │
     │    - name: "System Health Check"         │
     │    - description: "Checks system..."     │
     │    - tags: {"category": "monitoring"}    │
     │    - variables: {"timeout": 300}         │
     ├──────────────────────────────────────────>│
     │                                          │
     │  2. Validate Upload                      │
     │     - Check file type (.yml/.yaml)       │
     │     - Check file size                    │
     │     - Check name uniqueness              │
     │     - Validate YAML syntax               │
     │                                          │
     │  3. Store File                           │
     │     - Generate secure filename           │
     │     - Save to upload directory           │
     │     - Set file permissions (0640)        │
     │     - Calculate SHA-256 hash             │
     │                                          │
     │  4. Create Database Record               │
     │     - Insert playbook metadata           │
     │     - Store file path and hash           │
     │     - Create audit log                   │
     │                                          │
     │  5. Response                             │
     │  {                                       │
     │    id: 1,                                │
     │    name: "System Health Check",          │
     │    file_path: "/uploads/...",            │
     │    file_hash: "abc123...",               │
     │    created_at: "2024-01-08T10:00:00"     │
     │  }                                       │
     │<──────────────────────────────────────────┤
     │                                          │
```

### 2. **Executing a Playbook**

```
┌─────────┐       ┌─────────────┐       ┌───────────┐
│ Client  │       │   Backend   │       │  Celery   │
└────┬────┘       └──────┬──────┘       └─────┬─────┘
     │                   │                     │
     │  1. POST /jobs    │                     │
     │  {                │                     │
     │    playbook_id: 1,│                     │
     │    server_id: 2   │                     │
     │  }                │                     │
     ├───────────────────>│                     │
     │                   │                     │
     │  2. Validate      │                     │
     │     - Check playbook exists & active    │
     │     - Check server exists & active      │
     │     - Verify permissions                │
     │                   │                     │
     │  3. Create Job    │                     │
     │     - Generate job ID                   │
     │     - Set status: pending               │
     │     - Store metadata                    │
     │                   │                     │
     │  4. Queue Task    │  5. Execute Playbook│
     │                   ├─────────────────────>│
     │                   │                     │
     │  6. Response      │     6. Read playbook file
     │  {                │     7. Run ansible-playbook
     │    job_id: "...", │     8. Capture output
     │    status: "pending"│   9. Update job status
     │  }                │                     │
     │<───────────────────┤                     │
     │                   │                     │
```

## API Examples

### Upload Playbook

```bash
POST /playbooks/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

# Form Data:
file: @system_health_check.yml
name: System Health Check
description: Comprehensive system health monitoring playbook
tags: {"category": "monitoring", "priority": "high"}
variables: {"timeout": 300, "retries": 3}
```

### Response

```json
{
  "id": 1,
  "name": "System Health Check",
  "description": "Comprehensive system health monitoring playbook",
  "file_path": "/var/lib/infraauto/playbooks/system_health_check_a7f3d92e.yml",
  "file_hash": "a7f3d92e8b4f5c1d2e9f3a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
  "tags": {
    "category": "monitoring",
    "priority": "high"
  },
  "variables": {
    "timeout": 300,
    "retries": 3
  },
  "is_active": true,
  "created_at": "2024-01-08T10:00:00",
  "updated_at": "2024-01-08T10:00:00"
}
```

### List Playbooks

```bash
GET /playbooks?is_active=true&search=health&page=1&per_page=20
Authorization: Bearer <token>
```

### Response

```json
{
  "items": [
    {
      "id": 1,
      "name": "System Health Check",
      "description": "Comprehensive system health monitoring playbook",
      "tags": {
        "category": "monitoring",
        "priority": "high"
      },
      "is_active": true,
      "created_at": "2024-01-08T10:00:00"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 1,
    "pages": 1
  }
}
```

### Get Playbook Content

```bash
GET /playbooks/1/content
Authorization: Bearer <token>
```

### Response

```json
{
  "playbook_id": 1,
  "name": "System Health Check",
  "content": "---\n- name: System Health Check\n  hosts: all\n  gather_facts: yes\n  tasks:\n    - name: Check disk space\n      command: df -h\n      register: disk_space\n    \n    - name: Check memory usage\n      command: free -m\n      register: memory_usage\n"
}
```

### Update Playbook Metadata

```bash
PUT /playbooks/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Updated: Comprehensive system health monitoring with alerts",
  "tags": {
    "category": "monitoring",
    "priority": "high",
    "alerts": "enabled"
  },
  "variables": {
    "timeout": 600,
    "retries": 5,
    "alert_email": "ops@example.com"
  }
}
```

### Validate Playbook

```bash
POST /playbooks/1/validate
Authorization: Bearer <token>
```

### Response

```json
{
  "valid": true,
  "message": "Playbook syntax is valid",
  "details": {
    "plays": 1,
    "tasks": 2,
    "handlers": 0
  }
}
```

## Playbook Structure

### Recommended Playbook Format

```yaml
---
- name: Descriptive Playbook Name
  hosts: all
  become: yes  # If root privileges needed
  gather_facts: yes
  
  vars:
    # Default variables (can be overridden by extra_vars)
    timeout: 300
    retries: 3
  
  tasks:
    - name: Task 1 - Descriptive name
      command: echo "Hello"
      register: result
    
    - name: Task 2 - Another task
      debug:
        msg: "{{ result.stdout }}"
  
  handlers:
    - name: Restart service
      service:
        name: apache2
        state: restarted
```

### Best Practices for Playbooks

1. **Clear Naming**: Use descriptive names for plays and tasks
2. **Idempotency**: Ensure playbooks can be run multiple times safely
3. **Variables**: Use variables for configurable values
4. **Error Handling**: Include error handling and recovery
5. **Documentation**: Add comments explaining complex logic
6. **Modularity**: Break complex playbooks into roles
7. **Testing**: Test playbooks in non-production environments first

## Playbook Tags

Tags help organize and categorize playbooks:

### Common Tag Patterns

```json
{
  "category": "monitoring|deployment|configuration|security|backup",
  "priority": "low|medium|high|critical",
  "environment": "all|dev|staging|production",
  "os": "ubuntu|centos|rhel|debian",
  "team": "platform|devops|security",
  "frequency": "daily|weekly|monthly|ondemand",
  "duration": "short|medium|long",
  "impact": "none|low|medium|high"
}
```

## Variables

### Default Variables

Stored in playbook metadata:

```json
{
  "timeout": 300,
  "retries": 3,
  "verbosity": 1,
  "check_mode": false
}
```

### Runtime Variables (extra_vars)

Provided when executing job:

```json
{
  "target_port": 8080,
  "service_name": "nginx",
  "config_file": "/etc/nginx/nginx.conf"
}
```

### Variable Precedence

1. extra_vars (highest priority) - Provided at job execution
2. Playbook variables - Defined in playbook file
3. Default variables - Stored in playbook metadata

## File Management

### Upload Directory Structure

```
/var/lib/infraauto/playbooks/
├── system_health_check_a7f3d92e.yml
├── deploy_application_b8e4c93f.yml
├── security_audit_c9f5d04a.yml
└── backup_database_d0a6e15b.yml
```

### File Naming Convention

- Base name from original filename
- Unique identifier appended (8 chars)
- Original extension preserved (.yml or .yaml)

### File Permissions

- Owner: `ansible` user
- Group: `ansible` group  
- Permissions: `0640` (rw-r-----)
- Ensures only authorized processes can read playbooks

### File Integrity

- SHA-256 hash calculated on upload
- Hash stored in database
- Can verify file hasn't been tampered with
- Re-calculate hash periodically for verification

## Security Considerations

### 1. **Upload Security**
- File type validation (whitelist: .yml, .yaml only)
- File size limits (configurable, default: 10MB)
- Filename sanitization (prevent directory traversal)
- Virus scanning (optional integration)

### 2. **Access Control**
- Viewers: Can only list and view metadata
- Operators: Can upload, update metadata, view content
- Admins: Full control including deletion

### 3. **Content Security**
- YAML syntax validation before acceptance
- Optional: Scan for dangerous Ansible modules
- Optional: Require approval workflow for production use

### 4. **Storage Security**
- Files stored outside web root
- Strict file permissions
- Regular backup of playbook directory
- Encryption at rest (optional)

## Integration with Job System

Playbooks are referenced when creating jobs:

```python
# Creating a job with a playbook
job = Job(
    playbook_id=1,  # References playbook in database
    server_id=2,
    user_id=1,
    extra_vars={"custom_var": "value"}
)

# Job execution reads playbook file
playbook = Playbook.query.get(job.playbook_id)
playbook_path = playbook.file_path  # /var/lib/infraauto/playbooks/...

# Execute with ansible-runner
runner.run(
    private_data_dir='/tmp/ansible',
    playbook=playbook_path,
    inventory={'hosts': [server.ip_address]},
    extravars=job.extra_vars
)
```

## Validation

### Automatic Validation

On upload, the system validates:
1. File extension (.yml or .yaml)
2. YAML syntax correctness
3. Basic Ansible playbook structure
4. Required fields (name, hosts, tasks)

### Manual Validation

Use the validate endpoint to check:
- YAML syntax
- Ansible-specific syntax
- Deprecated module usage
- Best practice violations

## Troubleshooting

### Common Issues

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Upload fails | Invalid file type | Ensure file has .yml or .yaml extension |
| Syntax error | Invalid YAML | Validate YAML syntax locally first |
| Duplicate name | Playbook already exists | Use unique name or update existing |
| Permission denied | Insufficient role | Operators and admins can upload |
| File not found | File deleted from disk | Re-upload playbook |
| Hash mismatch | File modified | Re-upload to recalculate hash |

## Monitoring and Metrics

### Playbook Statistics

Track important metrics:
- Total playbooks
- Active vs inactive count
- Usage frequency (jobs per playbook)
- Success/failure rates
- Average execution time
- Most/least used playbooks

### Usage Reports

Generate reports showing:
- Top 10 most executed playbooks
- Playbooks with highest failure rates
- Unused playbooks (candidates for archival)
- Playbook execution trends over time

## Best Practices

### For Administrators

1. **Naming Convention**: Establish standard naming scheme
   - `<category>_<action>_<target>` (e.g., system_update_webservers)

2. **Organization**: Use consistent tagging strategy
   - Define allowed tag keys and values
   - Document tag meanings

3. **Review Process**: Implement playbook review workflow
   - Peer review before production use
   - Security review for sensitive operations

4. **Lifecycle Management**:
   - Archive unused playbooks
   - Version important playbooks
   - Document major changes

5. **Testing**: Test all playbooks before production
   - Use test servers
   - Implement dry-run capability

### For Operators

1. **Descriptive Names**: Use clear, self-explanatory names
2. **Complete Metadata**: Fill description and tags thoroughly
3. **Variables**: Document required and optional variables
4. **Error Handling**: Include proper error handling in playbooks
5. **Documentation**: Add inline comments for complex logic

## Future Enhancements

- **Version Control**: Track playbook versions and changes
- **Approval Workflow**: Require approval before production use
- **Playbook Library**: Public/shared playbook repository
- **Syntax Highlighting**: In-browser playbook editor
- **Template System**: Playbook templates for common tasks
- **Dependency Management**: Track role and collection dependencies

## Related Documentation

- [Job Execution and Monitoring](./Job-Execution-and-Monitoring.md)
- [Server Management](./Server-Management.md)
- [API Documentation](../backend/API_DOCS.md)
- [Ansible Best Practices](https://docs.ansible.com/ansible/latest/user_guide/playbooks_best_practices.html)
