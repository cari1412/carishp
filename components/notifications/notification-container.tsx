'use client';

import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { useNotificationStore } from 'store/notification';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info
};

const colors = {
  success: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
  error: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
  info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
};

const iconColors = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  info: 'text-blue-600 dark:text-blue-400'
};

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = icons[notification.type];
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className="pointer-events-auto mb-4"
            >
              <div
                className={clsx(
                  'flex items-start gap-3 min-w-[320px] max-w-md p-4 rounded-lg border shadow-lg backdrop-blur-sm',
                  colors[notification.type]
                )}
              >
                <Icon className={clsx('w-5 h-5 flex-shrink-0 mt-0.5', iconColors[notification.type])} />
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">{notification.title}</h4>
                  {notification.message && (
                    <p className="text-sm mt-1 opacity-90">{notification.message}</p>
                  )}
                </div>
                
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}