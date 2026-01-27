/**
 * Notifications Component
 * Toast notifications displayed at top-right of screen
 */

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import type { NotificationType } from '../../store/uiStore';

const iconMap: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
};

const colorMap: Record<NotificationType, string> = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
  info: 'bg-blue-50 border-blue-200',
};

export const Notifications: React.FC = () => {
  const { notifications, removeNotification } = useUIStore();

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${colorMap[notification.type]} border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slideIn`}
          role="alert"
        >
          <div className="flex-shrink-0 mt-0.5">{iconMap[notification.type]}</div>
          <div className="flex-1 text-sm text-gray-800">{notification.message}</div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
