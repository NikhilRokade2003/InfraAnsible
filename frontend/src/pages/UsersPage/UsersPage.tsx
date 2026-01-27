import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { usersApi } from '../../api/api';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../types';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.list({ page: 1, per_page: 100 });
      setUsers(response.items);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: number, username: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This will also delete all jobs created by this user.`)) {
      return;
    }

    try {
      await usersApi.delete(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super_admin':
        return 'bg-red-100 text-red-700';
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'user':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const canDeleteUser = (targetUser: User) => {
    // Only super_admin can delete users
    if (!isSuperAdmin) return false;
    
    // Cannot delete yourself
    if (targetUser.id === currentUser?.id) return false;
    
    return true;
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super_admin':
        return <Shield className="h-4 w-4" />;
      case 'admin':
        return <Shield className="w-3 h-3 inline mr-1" />;
      case 'user':
        return <UserIcon className="w-3 h-3 inline mr-1" />;
      default:
        return <UserIcon className="w-3 h-3 inline mr-1" />;
    }
  };

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return 'Never';
    const date = new Date(lastLogin);
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getInitials = (username: string) => {
    return username.substring(0, 1).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">User Management</h1>
        </div>
        <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2 shadow-glow-sm hover:shadow-glow">
          <Plus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-primary-200 shadow-glow rounded-lg shadow-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                User
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                Role
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                Last Login
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                {/* User Info */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {getInitials(user.username)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                  </div>
                </td>

                {/* Role Badge */}
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {getRoleIcon(user.role)}
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>

                {/* Last Login */}
                <td className="px-6 py-4 text-sm text-gray-700">
                  {formatLastLogin(user.last_login)}
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {isAdmin && (
                      <button
                        className="text-gray-600 hover:text-primary-600 transition-colors"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canDeleteUser(user) && (
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        className="text-gray-600 hover:text-error-600 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            No users found
          </div>
        )}
      </div>
    </div>
  );
};
