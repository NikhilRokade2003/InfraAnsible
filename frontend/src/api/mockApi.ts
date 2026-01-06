/**
 * Mock API for Demo/Presentation Mode
 * Returns fake data to showcase UI without backend
 */

import type {
  LoginRequest,
  LoginResponse,
  User,
  Server,
  Playbook,
  Job,
  JobStatistics,
  PaginatedResponse,
} from '../types';

// Mock user data
const mockUser: User = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  role: 'admin',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock servers
const mockServers: Server[] = [
  {
    id: 1,
    hostname: 'web-server-01',
    ip_address: '192.168.1.10',
    os_type: 'ubuntu',
    os_version: '22.04',
    ssh_port: 22,
    ssh_user: 'ansible',
    environment: 'production',
    description: 'Main web application server',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    hostname: 'db-server-01',
    ip_address: '192.168.1.20',
    os_type: 'ubuntu',
    os_version: '20.04',
    ssh_port: 22,
    ssh_user: 'ansible',
    environment: 'production',
    description: 'Primary database server',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    hostname: 'dev-server-01',
    ip_address: '192.168.1.30',
    os_type: 'centos',
    os_version: '8',
    ssh_port: 22,
    ssh_user: 'ansible',
    environment: 'development',
    description: 'Development testing server',
    status: 'active',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

// Mock playbooks
const mockPlaybooks: Playbook[] = [
  {
    id: 1,
    name: 'deploy-webapp',
    file_path: '/playbooks/deploy-webapp.yml',
    description: 'Deploy web application with zero downtime',
    tags: { category: 'deployment', priority: 'high' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'system-update',
    file_path: '/playbooks/system-update.yml',
    description: 'Update system packages and security patches',
    tags: { category: 'maintenance', priority: 'medium' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'backup-database',
    file_path: '/playbooks/backup-database.yml',
    description: 'Automated database backup to S3',
    tags: { category: 'backup', priority: 'high' },
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

// Mock jobs
const mockJobs: Job[] = [
  {
    id: 1,
    playbook_id: 1,
    server_id: 1,
    status: 'success',
    triggered_by: 1,
    started_at: '2024-01-05T10:00:00Z',
    completed_at: '2024-01-05T10:05:00Z',
    result: { return_code: 0, output: 'Deployment successful' },
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-05T10:05:00Z',
  },
  {
    id: 2,
    playbook_id: 2,
    server_id: 2,
    status: 'success',
    triggered_by: 1,
    started_at: '2024-01-05T09:30:00Z',
    completed_at: '2024-01-05T09:45:00Z',
    result: { return_code: 0, output: 'System updated successfully' },
    created_at: '2024-01-05T09:30:00Z',
    updated_at: '2024-01-05T09:45:00Z',
  },
  {
    id: 3,
    playbook_id: 3,
    server_id: 2,
    status: 'running',
    triggered_by: 1,
    started_at: '2024-01-05T11:00:00Z',
    created_at: '2024-01-05T11:00:00Z',
    updated_at: '2024-01-05T11:00:00Z',
  },
  {
    id: 4,
    playbook_id: 1,
    server_id: 3,
    status: 'failed',
    triggered_by: 1,
    started_at: '2024-01-04T15:00:00Z',
    completed_at: '2024-01-04T15:02:00Z',
    result: { return_code: 1, output: 'Connection timeout' },
    created_at: '2024-01-04T15:00:00Z',
    updated_at: '2024-01-04T15:02:00Z',
  },
];

// Mock statistics
const mockStatistics: JobStatistics = {
  total_jobs: 15,
  pending: 2,
  running: 1,
  completed: 10,
  failed: 2,
  success_rate: 83.33,
};

export const mockApi = {
  auth: {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
      
      if (credentials.username === 'admin' && credentials.password === 'admin123') {
        return {
          access_token: 'mock-access-token-' + Date.now(),
          refresh_token: 'mock-refresh-token-' + Date.now(),
          user: mockUser,
        };
      }
      throw new Error('Invalid credentials');
    },

    getCurrentUser: async (): Promise<User> => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockUser;
    },

    logout: async (): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    },
  },

  servers: {
    list: async (): Promise<PaginatedResponse<Server>> => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        items: mockServers,
        total: mockServers.length,
        page: 1,
        per_page: 20,
        pages: 1,
      };
    },

    get: async (id: number): Promise<Server> => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const server = mockServers.find((s) => s.id === id);
      if (!server) throw new Error('Server not found');
      return server;
    },
  },

  playbooks: {
    list: async (): Promise<PaginatedResponse<Playbook>> => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        items: mockPlaybooks,
        total: mockPlaybooks.length,
        page: 1,
        per_page: 20,
        pages: 1,
      };
    },

    get: async (id: number): Promise<Playbook> => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const playbook = mockPlaybooks.find((p) => p.id === id);
      if (!playbook) throw new Error('Playbook not found');
      return playbook;
    },
  },

  jobs: {
    list: async (): Promise<PaginatedResponse<Job>> => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        items: mockJobs,
        total: mockJobs.length,
        page: 1,
        per_page: 20,
        pages: 1,
      };
    },

    get: async (id: number): Promise<Job> => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const job = mockJobs.find((j) => j.id === id);
      if (!job) throw new Error('Job not found');
      return job;
    },

    getStatistics: async (): Promise<JobStatistics> => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return mockStatistics;
    },
  },

  health: async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      status: 'healthy',
      mode: 'DEMO',
      message: 'Running in demo mode with mock data',
    };
  },
};
