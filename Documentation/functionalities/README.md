# Infra Automation Platform - Functionality Overview

## Introduction

This directory contains comprehensive documentation for each major functionality of the Infra Automation Platform. Each document provides detailed information about a specific module, including its purpose, features, APIs, workflows, and best practices.

## Table of Contents

### Core Functionalities

1. [Authentication and Authorization](#1-authentication-and-authorization)
2. [User Management](#2-user-management)
3. [Server Management](#3-server-management)
4. [Playbook Management](#4-playbook-management)
5. [Job Execution and Monitoring](#5-job-execution-and-monitoring)
6. [Audit and Logging](#6-audit-and-logging)

---

## 1. Authentication and Authorization

**File**: [Authentication-and-Authorization.md](./Authentication-and-Authorization.md)

### Overview
Secure access control system using JWT tokens with role-based permissions (Admin, Operator, Viewer).

### Key Features
- JWT-based authentication with access and refresh tokens
- Three-tier role hierarchy
- Bcrypt password hashing
- Session management
- Permission matrix for all resources

### Primary Use Cases
- User login and logout
- Token refresh for long-running sessions
- Role-based access control enforcement
- Security auditing of authentication events

### Quick Links
- [Authentication Flow](./Authentication-and-Authorization.md#authentication-flow)
- [Permission Matrix](./Authentication-and-Authorization.md#permission-matrix)
- [API Examples](./Authentication-and-Authorization.md#api-examples)

---

## 2. User Management

**File**: [User-Management.md](./User-Management.md)

### Overview
Comprehensive user account administration including creation, modification, role assignment, and lifecycle management.

### Key Features
- User registration and profile management
- Role assignment (Admin, Operator, Viewer)
- Password management with strength requirements
- Account activation/deactivation
- User activity tracking

### Primary Use Cases
- Creating new user accounts
- Updating user roles and permissions
- Managing user lifecycle (activate/deactivate)
- Self-service profile updates
- User activity reporting

### Quick Links
- [User Roles](./User-Management.md#user-roles)
- [Password Management](./User-Management.md#password-management)
- [API Examples](./User-Management.md#api-examples)

---

## 3. Server Management

**File**: [Server-Management.md](./Server-Management.md)

### Overview
Centralized inventory system for managing infrastructure servers that will be targeted by Ansible playbooks.

### Key Features
- Server registration with SSH connection details
- IPv4/IPv6 support
- Flexible tagging and metadata
- Environment-based organization (dev, staging, production)
- Search and filtering capabilities
- Connection testing

### Primary Use Cases
- Adding servers to automation inventory
- Organizing servers by tags and environments
- Testing SSH connectivity
- Searching for specific servers
- Managing server lifecycle

### Quick Links
- [Server Data Model](./Server-Management.md#server-data-model)
- [Workflows](./Server-Management.md#workflows)
- [API Examples](./Server-Management.md#api-examples)

---

## 4. Playbook Management

**File**: [Playbook-Management.md](./Playbook-Management.md)

### Overview
Repository for storing, organizing, and managing Ansible playbooks that define automation tasks.

### Key Features
- Secure playbook upload via API
- File integrity verification (SHA-256)
- Metadata management (tags, variables)
- YAML syntax validation
- Playbook content retrieval
- Search and categorization

### Primary Use Cases
- Uploading automation playbooks
- Organizing playbooks with tags
- Setting default variables
- Validating playbook syntax
- Managing playbook lifecycle

### Quick Links
- [Upload Workflow](./Playbook-Management.md#workflows)
- [Playbook Structure](./Playbook-Management.md#playbook-structure)
- [API Examples](./Playbook-Management.md#api-examples)

---

## 5. Job Execution and Monitoring

**File**: [Job-Execution-and-Monitoring.md](./Job-Execution-and-Monitoring.md)

### Overview
The core automation engine that executes Ansible playbooks against target servers with real-time monitoring and logging.

### Key Features
- Asynchronous job execution via Celery
- Real-time log streaming
- Job status tracking (pending, running, success, failed, cancelled)
- Ansible Runner integration
- Job cancellation
- Execution statistics

### Primary Use Cases
- Executing playbooks against servers
- Monitoring job progress in real-time
- Viewing execution logs
- Cancelling running jobs
- Analyzing job success/failure rates
- Creating support tickets from failed jobs

### Quick Links
- [Job Execution Workflow](./Job-Execution-and-Monitoring.md#job-execution-workflow)
- [Job Status Lifecycle](./Job-Execution-and-Monitoring.md#job-status-lifecycle)
- [Real-Time Monitoring](./Job-Execution-and-Monitoring.md#real-time-monitoring)
- [API Examples](./Job-Execution-and-Monitoring.md#api-examples)

---

## 6. Audit and Logging

**File**: [Audit-and-Logging.md](./Audit-and-Logging.md)

### Overview
Comprehensive audit trail system that tracks all user actions, system events, and resource changes for compliance and security.

### Key Features
- Immutable audit trail
- Detailed event logging (who, what, when, where)
- Security event monitoring
- Failed login tracking
- Resource change history
- Export and reporting capabilities

### Primary Use Cases
- Security investigations
- Compliance auditing
- Troubleshooting resource changes
- User activity review
- Detecting suspicious patterns

### Quick Links
- [Logged Events](./Audit-and-Logging.md#logged-events)
- [Audit Log Structure](./Audit-and-Logging.md#audit-log-structure)
- [Use Cases](./Audit-and-Logging.md#use-cases)
- [API Examples](./Audit-and-Logging.md#audit-log-api)

---

## How the Components Work Together

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Dashboard │  │ Servers  │  │Playbooks │  │   Jobs   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/REST API
                        │ JWT Authentication
┌───────────────────────▼─────────────────────────────────────┐
│                  Backend (Flask API)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Authentication & Authorization (JWT, RBAC)          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌────────┐  ┌────────┐  ┌──────────┐  ┌────────────┐    │
│  │ Users  │  │Servers │  │Playbooks │  │    Jobs    │    │
│  │ API    │  │  API   │  │   API    │  │    API     │    │
│  └────┬───┘  └───┬────┘  └────┬─────┘  └─────┬──────┘    │
│       │          │             │              │            │
│  ┌────▼──────────▼─────────────▼──────────────▼────────┐  │
│  │          Service Layer (Business Logic)              │  │
│  └────┬──────────┬─────────────┬──────────────┬────────┘  │
│       │          │             │              │            │
│  ┌────▼──────────▼─────────────▼──────────────▼────────┐  │
│  │              Database (MySQL)                        │  │
│  │  Users | Servers | Playbooks | Jobs | AuditLogs     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Celery Workers (Async Task Processing)              │  │
│  │  ├─ Execute Ansible Playbooks                        │  │
│  │  ├─ Capture Real-time Logs                           │  │
│  │  └─ Update Job Status                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Audit Logger (All Actions)                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Typical Workflow

```
1. User logs in → Authentication validates credentials
                ↓
2. User creates/updates resources → Audit log created
                ↓
3. User uploads playbook → Playbook stored with metadata
                ↓
4. User adds servers → Server inventory updated
                ↓
5. User executes job → Job queued to Celery
                ↓
6. Celery worker picks up job → Ansible playbook executed
                ↓
7. Logs streamed in real-time → Job status updated
                ↓
8. Job completes → Audit log created, statistics updated
```

## Cross-Functionality Features

### Security
- **Authentication**: JWT tokens for all API requests
- **Authorization**: Role-based access control on all endpoints
- **Audit Trail**: Every action logged with user attribution
- **Encryption**: Passwords hashed, sensitive data protected

### Data Flow
- **Users** create **Jobs** that execute **Playbooks** on **Servers**
- **Jobs** generate **Logs** that are parsed and stored
- All actions create **Audit Logs** for compliance
- **Statistics** aggregated from Jobs and Audit Logs

### Integration Points

| From | To | Purpose |
|------|-----|---------|
| Authentication | All Modules | Verify user identity and permissions |
| User Management | Jobs | Track who created each job |
| Server Management | Jobs | Provide target servers for execution |
| Playbook Management | Jobs | Provide automation scripts |
| Jobs | Audit Logs | Record execution events |
| All Modules | Audit Logs | Record all user actions |

## Common Patterns

### API Request Flow

```
Client Request
    ↓
[1] Authentication Middleware
    - Verify JWT token
    - Extract user info
    ↓
[2] Authorization Check
    - Verify user role
    - Check permissions
    ↓
[3] Request Validation
    - Validate input data
    - Check constraints
    ↓
[4] Service Layer
    - Execute business logic
    - Database operations
    ↓
[5] Audit Logging
    - Record action
    - Store details
    ↓
[6] Response
    - Format data
    - Return to client
```

### Error Handling

All modules follow consistent error handling:

```json
{
  "error": "error_code",
  "message": "Human-readable message",
  "details": {
    "field": "Additional context"
  }
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication failed)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Getting Started

### For New Users

1. **Learn Authentication**: Start with [Authentication and Authorization](./Authentication-and-Authorization.md)
2. **Understand Roles**: Review [User Management](./User-Management.md) for role capabilities
3. **Set Up Infrastructure**: Read [Server Management](./Server-Management.md) to add servers
4. **Create Automation**: Review [Playbook Management](./Playbook-Management.md) for playbook upload
5. **Execute Tasks**: Follow [Job Execution](./Job-Execution-and-Monitoring.md) to run playbooks

### For Administrators

1. Create user accounts with appropriate roles
2. Set up server inventory
3. Review audit logs regularly
4. Monitor job success rates
5. Manage system security

### For Operators

1. Add and organize servers
2. Upload and manage playbooks
3. Execute jobs on target servers
4. Monitor job execution
5. Create tickets for failures

### For Viewers

1. Monitor job execution
2. View server inventory
3. Review playbook library
4. Analyze job statistics

## Best Practices

### Security
- Use strong passwords (see [User Management](./User-Management.md))
- Assign minimum required permissions
- Review audit logs regularly (see [Audit and Logging](./Audit-and-Logging.md))
- Rotate credentials periodically

### Operations
- Test playbooks in dev/staging before production
- Use tags to organize resources
- Monitor job success rates
- Handle failed jobs promptly
- Document playbook purposes

### Development
- Follow RESTful API conventions
- Implement proper error handling
- Log all significant actions
- Write idempotent playbooks
- Use meaningful names and descriptions

## Troubleshooting Guide

### Common Issues

| Issue | Module | Solution Link |
|-------|--------|---------------|
| Cannot login | Authentication | [Authentication Troubleshooting](./Authentication-and-Authorization.md#error-handling) |
| Permission denied | User Management | [Role Permissions](./User-Management.md#user-roles) |
| Server not reachable | Server Management | [Connection Testing](./Server-Management.md#workflows) |
| Playbook upload fails | Playbook Management | [Validation Rules](./Playbook-Management.md#validation) |
| Job stuck in pending | Job Execution | [Troubleshooting](./Job-Execution-and-Monitoring.md#troubleshooting) |
| Missing audit logs | Audit and Logging | [Troubleshooting](./Audit-and-Logging.md#troubleshooting) |

## Additional Resources

### Backend Documentation
- [API Documentation](../backend/API_DOCS.md) - Complete API reference
- [Database Design](../backend/DATABASE_DESIGN.md) - Database schema
- [Architecture](./ARCHITECTURE_EXPLAINED.md) - System architecture

### Setup Guides
- [Project Setup](./PROJECT_SETUP.md) - Initial setup instructions
- [Startup Guide](./Startup.md) - How to start the application
- [System Components](./SYSTEM_COMPONENTS.md) - Component overview

## Support and Contributions

### Getting Help
- Review this documentation first
- Check the troubleshooting sections
- Review audit logs for error details
- Contact system administrator

### Reporting Issues
- Document the exact error message
- Include relevant audit log entries
- Describe steps to reproduce
- Specify which module is affected

### Contributing
- Follow existing code patterns
- Document new features
- Include audit logging
- Test thoroughly
- Update relevant documentation

---

## Document Maintenance

**Last Updated**: January 8, 2026  
**Version**: 1.0.0  
**Maintained By**: Development Team

For questions or suggestions about this documentation, please contact the platform administrators.
