# Job Execution and Monitoring

## Overview

The Job Execution and Monitoring module is the core automation engine of the Infra Automation Platform. It orchestrates the execution of Ansible playbooks against target servers, tracks execution progress in real-time, captures logs, and provides comprehensive monitoring capabilities.

## Key Features

### 1. **Asynchronous Job Execution**
- Background task processing using Celery
- Non-blocking API responses
- Real-time status updates
- Concurrent job execution support

### 2. **Comprehensive Job Tracking**
- Unique job IDs (UUID)
- Status transitions (pending → running → success/failed/cancelled)
- Execution timestamps
- Resource usage tracking

### 3. **Real-Time Log Streaming**
- Line-by-line log capture
- Log level categorization (INFO, WARNING, ERROR)
- Incremental log retrieval for live updates
- Parsed Ansible output

### 4. **Job Management**
- Job cancellation
- Job history and filtering
- Success/failure statistics
- Job-to-ticket conversion

## Job Data Model

```python
class Job:
    id: Integer (Primary Key)
    job_id: String(100) - UUID, Unique, Indexed
    playbook_id: Integer - Foreign Key to Playbook
    server_id: Integer - Foreign Key to Server
    user_id: Integer - Foreign Key to User
    status: Enum - 'pending', 'running', 'success', 'failed', 'cancelled'
    extra_vars: JSON - Runtime variables
    started_at: DateTime
    completed_at: DateTime
    exit_code: Integer - Ansible exit code
    artifacts_path: String(500) - Path to ansible-runner artifacts
    created_at: DateTime
    updated_at: DateTime
    
    # Relationships
    playbook: Playbook
    server: Server
    user: User
    logs: List[JobLog]
    ticket: Ticket (optional)

class JobLog:
    id: Integer (Primary Key)
    job_id: Integer - Foreign Key to Job
    line_number: Integer - Sequential line number
    content: Text - Log line content
    log_level: Enum - 'INFO', 'WARNING', 'ERROR', 'DEBUG'
    timestamp: DateTime
    
    # Indexes
    Index('idx_job_line', job_id, line_number)
```

## Core Components

### 1. **JobService** (`app/services/job_service.py`)

Business logic for job operations:

- **`create_job(playbook_id, server_id, user_id, extra_vars)`**: Create and queue new job
- **`get_job(job_id)`**: Retrieve job by internal ID
- **`get_job_by_uuid(job_uuid)`**: Retrieve job by UUID
- **`get_all_jobs(filters, page, per_page)`**: List jobs with filtering
- **`update_job_status(job_id, status, exit_code)`**: Update job execution status
- **`cancel_job(job_id, user_id)`**: Cancel running or pending job
- **`get_job_logs(job_id, start_line, limit)`**: Retrieve job logs
- **`create_log_entry(job_id, content, log_level)`**: Add log entry
- **`get_job_statistics(user_id)`**: Get execution statistics

### 2. **Celery Tasks** (`app/tasks.py`)

Asynchronous task execution:

- **`execute_playbook_task(job_id)`**: Main task for playbook execution
- **`cleanup_old_jobs_task()`**: Periodic cleanup of old job data
- **`send_job_notification_task(job_id, status)`**: Send job completion notifications

### 3. **Ansible Runner Integration** (`app/playbooks/run.py`)

Ansible execution wrapper:

- **`run_playbook(playbook_path, inventory, extra_vars, private_data_dir)`**: Execute Ansible playbook
- **`parse_ansible_output(output)`**: Parse and categorize Ansible output
- **`handle_execution_callback(event)`**: Process Ansible events

### 4. **Job API Endpoints** (`app/api/jobs.py`)

| Endpoint | Method | Description | Required Role |
|----------|--------|-------------|---------------|
| `/jobs` | GET | List all jobs | Viewer+ |
| `/jobs` | POST | Create and execute job | Operator+ |
| `/jobs/:id` | GET | Get job details | Viewer+ |
| `/jobs/:id/cancel` | POST | Cancel running job | Operator+ |
| `/jobs/:id/logs` | GET | Get job logs (streaming) | Viewer+ |
| `/jobs/:id/retry` | POST | Retry failed job | Operator+ |
| `/jobs/:id/ticket` | POST | Create ticket from job | Operator+ |
| `/jobs/statistics` | GET | Get job statistics | Viewer+ |

## Job Execution Workflow

```
┌─────────┐     ┌─────────┐     ┌────────┐     ┌──────────┐
│  User   │     │   API   │     │ Celery │     │  Ansible │
└────┬────┘     └────┬────┘     └───┬────┘     └────┬─────┘
     │               │               │               │
     │ 1. Create Job │               │               │
     ├──────────────>│               │               │
     │               │               │               │
     │               │ 2. Validate   │               │
     │               │    - Playbook │               │
     │               │    - Server   │               │
     │               │    - Permissions              │
     │               │               │               │
     │               │ 3. Create Job Record          │
     │               │    status: pending            │
     │               │               │               │
     │ 4. Job ID     │               │               │
     │<──────────────┤               │               │
     │               │               │               │
     │               │ 5. Queue Task │               │
     │               ├──────────────>│               │
     │               │               │               │
     │               │               │ 6. Start Job  │
     │               │               │    status: running
     │               │               │               │
     │               │               │ 7. Execute    │
     │               │               ├──────────────>│
     │               │               │               │
     │               │               │ 8. Stream Output
     │               │               │<──────────────┤
     │               │               │               │
     │               │               │ 9. Save Logs  │
     │               │               │    Line by line
     │               │               │               │
     │ 10. Poll Logs │               │               │
     ├──────────────>│               │               │
     │               │ 11. Fetch Logs│               │
     │               │    from DB    │               │
     │ 12. Logs      │               │               │
     │<──────────────┤               │               │
     │               │               │               │
     │               │               │ 13. Complete  │
     │               │               │<──────────────┤
     │               │               │               │
     │               │               │ 14. Update Status
     │               │               │    status: success/failed
     │               │               │    exit_code: 0/1
     │               │               │               │
     │ 15. Poll Status               │               │
     ├──────────────>│               │               │
     │ 16. Complete  │               │               │
     │<──────────────┤               │               │
     │               │               │               │
```

## Job Status Lifecycle

```
                    ┌─────────┐
                    │ PENDING │
                    └────┬────┘
                         │
                         │ Task picked by Celery
                         │
                    ┌────▼─────┐
           ┌────────┤ RUNNING  │────────┐
           │        └──────────┘        │
           │                            │
    cancel │                            │ completion
           │                            │
      ┌────▼────┐              ┌────────▼─────────┐
      │CANCELLED│              │SUCCESS or FAILED │
      └─────────┘              └──────────────────┘
```

### Status Descriptions

| Status | Description |
|--------|-------------|
| `pending` | Job created and queued, waiting for execution |
| `running` | Job currently executing on Celery worker |
| `success` | Job completed successfully (exit code 0) |
| `failed` | Job failed during execution (exit code != 0) |
| `cancelled` | Job cancelled by user before completion |

## API Examples

### Create and Execute Job

```bash
POST /jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "playbook_id": 1,
  "server_id": 2,
  "extra_vars": {
    "service_name": "nginx",
    "port": 8080,
    "enable_ssl": true
  }
}
```

### Response

```json
{
  "id": 42,
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "playbook": {
    "id": 1,
    "name": "Deploy Application"
  },
  "server": {
    "id": 2,
    "hostname": "web-server-01",
    "ip_address": "192.168.1.100"
  },
  "user": {
    "id": 1,
    "username": "admin"
  },
  "extra_vars": {
    "service_name": "nginx",
    "port": 8080,
    "enable_ssl": true
  },
  "created_at": "2024-01-08T10:00:00"
}
```

### Get Job Status

```bash
GET /jobs/42
Authorization: Bearer <token>
```

### Response

```json
{
  "id": 42,
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "playbook": {
    "id": 1,
    "name": "Deploy Application"
  },
  "server": {
    "id": 2,
    "hostname": "web-server-01",
    "ip_address": "192.168.1.100"
  },
  "user": {
    "id": 1,
    "username": "admin"
  },
  "started_at": "2024-01-08T10:00:05",
  "completed_at": null,
  "exit_code": null,
  "created_at": "2024-01-08T10:00:00"
}
```

### Get Job Logs (Streaming)

```bash
GET /jobs/42/logs?start_line=0&limit=50
Authorization: Bearer <token>
```

### Response

```json
{
  "job_id": 42,
  "logs": [
    {
      "id": 1,
      "line_number": 1,
      "content": "PLAY [Deploy Application] ********************************",
      "log_level": "INFO",
      "timestamp": "2024-01-08T10:00:05"
    },
    {
      "id": 2,
      "line_number": 2,
      "content": "TASK [Gathering Facts] ***********************************",
      "log_level": "INFO",
      "timestamp": "2024-01-08T10:00:06"
    },
    {
      "id": 3,
      "line_number": 3,
      "content": "ok: [web-server-01]",
      "log_level": "INFO",
      "timestamp": "2024-01-08T10:00:07"
    }
  ],
  "total_lines": 150,
  "returned_lines": 3,
  "has_more": true
}
```

### Poll for New Logs

```bash
# Client polls every 2 seconds for new logs
GET /jobs/42/logs?start_line=3&limit=50
Authorization: Bearer <token>
```

### List Jobs with Filtering

```bash
GET /jobs?status=running&playbook_id=1&page=1&per_page=20
Authorization: Bearer <token>
```

### Response

```json
{
  "items": [
    {
      "id": 42,
      "job_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "running",
      "playbook": {"id": 1, "name": "Deploy Application"},
      "server": {"id": 2, "hostname": "web-server-01"},
      "user": {"id": 1, "username": "admin"},
      "started_at": "2024-01-08T10:00:05",
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

### Cancel Job

```bash
POST /jobs/42/cancel
Authorization: Bearer <token>
```

### Response

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "cancelled",
  "message": "Job cancelled successfully"
}
```

### Get Job Statistics

```bash
GET /jobs/statistics
Authorization: Bearer <token>
```

### Response

```json
{
  "total": 1250,
  "pending": 5,
  "running": 3,
  "success": 1100,
  "failed": 140,
  "cancelled": 2,
  "success_rate": 88.0,
  "average_duration": 127.5,
  "by_playbook": [
    {
      "playbook_id": 1,
      "playbook_name": "Deploy Application",
      "total": 500,
      "success": 480,
      "failed": 20
    }
  ],
  "recent_failures": [
    {
      "job_id": 41,
      "playbook": "Deploy Application",
      "server": "web-server-01",
      "failed_at": "2024-01-08T09:30:00",
      "error": "Connection timeout"
    }
  ]
}
```

### Create Ticket from Failed Job

```bash
POST /jobs/41/ticket
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Deployment failed on web-server-01",
  "description": "Playbook execution failed due to connection timeout. Requires investigation.",
  "priority": "high"
}
```

## Log Parser

The log parser extracts structured information from Ansible output:

### Log Levels

| Level | Description | Examples |
|-------|-------------|----------|
| `INFO` | Normal execution | Task names, play names, ok status |
| `WARNING` | Non-critical issues | Deprecation warnings, changed status |
| `ERROR` | Failures | Task failures, fatal errors |
| `DEBUG` | Detailed information | Variable values, conditional results |

### Parsed Output Examples

**Ansible Output:**
```
PLAY [Deploy Application] *****************************************

TASK [Gathering Facts] *******************************************
ok: [web-server-01]

TASK [Install Nginx] *********************************************
changed: [web-server-01]

TASK [Start Nginx service] ***************************************
fatal: [web-server-01]: FAILED! => {"msg": "Service not found"}
```

**Parsed and Stored:**
```json
[
  {
    "line_number": 1,
    "content": "PLAY [Deploy Application] *****************************************",
    "log_level": "INFO"
  },
  {
    "line_number": 2,
    "content": "TASK [Gathering Facts] *******************************************",
    "log_level": "INFO"
  },
  {
    "line_number": 3,
    "content": "ok: [web-server-01]",
    "log_level": "INFO"
  },
  {
    "line_number": 4,
    "content": "TASK [Install Nginx] *********************************************",
    "log_level": "INFO"
  },
  {
    "line_number": 5,
    "content": "changed: [web-server-01]",
    "log_level": "WARNING"
  },
  {
    "line_number": 6,
    "content": "TASK [Start Nginx service] ***************************************",
    "log_level": "INFO"
  },
  {
    "line_number": 7,
    "content": "fatal: [web-server-01]: FAILED! => {\"msg\": \"Service not found\"}",
    "log_level": "ERROR"
  }
]
```

## Ansible Runner Integration

### Execution Configuration

```python
runner_config = {
    'private_data_dir': '/tmp/ansible-runner/job-{job_id}',
    'playbook': playbook.file_path,
    'inventory': {
        'all': {
            'hosts': {
                server.hostname: {
                    'ansible_host': server.ip_address,
                    'ansible_port': server.ssh_port,
                    'ansible_user': server.ssh_user,
                    'ansible_ssh_private_key_file': server.ssh_key_path
                }
            }
        }
    },
    'extravars': job.extra_vars,
    'verbosity': 1,
    'quiet': False,
    'suppress_env_files': True
}
```

### Artifact Storage

Ansible Runner stores artifacts in:
```
/tmp/ansible-runner/job-{uuid}/
├── artifacts/
│   ├── job_events/          # Detailed event data
│   ├── stdout               # Raw output
│   └── status               # Final status
├── inventory/
│   └── hosts                # Generated inventory
└── env/
    └── extravars            # Extra variables
```

These artifacts are:
- Stored temporarily during execution
- Used for detailed log parsing
- Cleaned up after job completion (configurable retention)

## Real-Time Monitoring

### Frontend Implementation

The frontend polls for updates:

```typescript
// Poll job status every 3 seconds
const pollJobStatus = async (jobId: number) => {
  const interval = setInterval(async () => {
    const job = await api.getJob(jobId);
    
    if (['success', 'failed', 'cancelled'].includes(job.status)) {
      clearInterval(interval);
      showNotification(`Job ${job.status}`);
    }
  }, 3000);
};

// Poll logs every 2 seconds
let lastLine = 0;
const pollJobLogs = async (jobId: number) => {
  const interval = setInterval(async () => {
    const logs = await api.getJobLogs(jobId, lastLine);
    
    if (logs.logs.length > 0) {
      appendLogs(logs.logs);
      lastLine = logs.logs[logs.logs.length - 1].line_number;
    }
    
    // Stop when job complete
    const job = await api.getJob(jobId);
    if (['success', 'failed', 'cancelled'].includes(job.status)) {
      clearInterval(interval);
    }
  }, 2000);
};
```

### WebSocket Support (Future Enhancement)

For true real-time updates without polling:
- WebSocket connection for live log streaming
- Server pushes logs as they're generated
- Reduced API load and latency

## Performance Considerations

### 1. **Concurrent Execution**

- Multiple Celery workers can run jobs in parallel
- Configurable concurrency per worker
- Job queue prioritization (future enhancement)

### 2. **Log Storage**

- Logs stored per-line for incremental retrieval
- Indexed by (job_id, line_number) for fast queries
- Optional: Archive old logs to object storage

### 3. **Cleanup Tasks**

Periodic cleanup of old data:
- Archive completed jobs after 90 days
- Delete cancelled jobs after 30 days
- Compress old log entries
- Clean up Ansible Runner artifacts

## Error Handling

### Common Job Failures

| Error Type | Cause | Resolution |
|------------|-------|------------|
| Connection timeout | SSH connection failed | Verify server is reachable |
| Authentication failed | Invalid SSH credentials | Check SSH key/password |
| Playbook syntax error | Invalid YAML | Validate playbook before upload |
| Task failure | Ansible task error | Review task logic and server state |
| Resource exhaustion | Out of memory/disk | Check server resources |

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success - all tasks completed without errors |
| 1 | Error - one or more tasks failed |
| 2 | Syntax error - playbook syntax is invalid |
| 3 | Connection error - could not connect to server |
| 4 | Timeout - execution exceeded timeout |
| 99 | Cancelled - job was cancelled by user |

## Security Considerations

### 1. **Execution Isolation**
- Each job runs in isolated Ansible Runner environment
- Separate working directories per job
- Cleanup after execution

### 2. **Credential Security**
- SSH keys never exposed via API
- Keys stored with restricted permissions
- Key paths validated before use

### 3. **Resource Limits**
- Maximum execution time (timeout)
- Memory limits per worker
- Concurrent job limits

### 4. **Audit Trail**
- Every job execution logged
- User attribution for all jobs
- Execution parameters recorded

## Best Practices

### For Operators

1. **Test First**: Test playbooks on dev/staging before production
2. **Monitor Progress**: Watch logs during execution for issues
3. **Handle Failures**: Review failed job logs immediately
4. **Use Extra Vars**: Pass runtime-specific variables via extra_vars
5. **Set Timeouts**: Use appropriate timeout values for long-running playbooks

### For Developers

1. **Idempotent Playbooks**: Ensure playbooks can be re-run safely
2. **Error Handling**: Include proper error handling in playbooks
3. **Logging**: Add debug output for troubleshooting
4. **Timeouts**: Set reasonable task-level timeouts
5. **Rollback**: Implement rollback procedures for failed deployments

## Monitoring and Alerts

### Metrics to Track

- Jobs per hour/day/week
- Success vs failure rates
- Average execution duration
- Longest running jobs
- Failed job patterns
- Resource usage trends

### Alert Conditions

- Job failure rate exceeds threshold
- Job execution time exceeds expected duration
- Multiple consecutive failures for same playbook
- Celery worker unavailable
- Queue backlog growing

## Troubleshooting

### Job Stuck in Pending

**Possible Causes:**
- No Celery workers running
- Worker busy with other jobs
- Redis connection issues

**Solutions:**
```bash
# Check Celery workers
celery -A app.celery inspect active

# Check Redis connection
redis-cli ping

# Restart Celery workers
sudo systemctl restart celery-worker
```

### Logs Not Appearing

**Possible Causes:**
- Database connection issue
- Log parsing error
- Permission issues

**Solutions:**
- Check database connectivity
- Review Celery worker logs
- Verify file permissions on artifacts directory

### Job Fails Immediately

**Possible Causes:**
- Invalid playbook path
- Server unreachable
- SSH key issues

**Solutions:**
- Verify playbook file exists
- Test server connectivity manually
- Check SSH key permissions and path

## Related Documentation

- [Playbook Management](./Playbook-Management.md)
- [Server Management](./Server-Management.md)
- [Audit and Logging](./Audit-and-Logging.md)
- [API Documentation](../backend/API_DOCS.md)
- [Celery Configuration](../backend/CELERY_CONFIG.md)
