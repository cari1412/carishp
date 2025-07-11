// components/notification.tsx
'use client';

import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useEffect } from 'react';
import { useNotificationStore } from '../store/notification';

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotificationStore();

  // Автоматически удаляем уведомления через 3 секунды
  useEffect(() => {
    const firstNotification = notifications[0];
    if (firstNotification) {
      const timer = setTimeout(() => {
        removeNotification(firstNotification.id);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notifications, removeNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="animate-in slide-in-from-top fade-in duration-300"
        >
          <div className="bg-black text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3">
            {/* Иконка успеха */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            
            {/* Контент */}
            <div className="flex-1">
              <div className="font-semibold text-base">This is a success alert</div>
              <div className="text-sm text-gray-300 mt-0.5">
                {notification.title || 'Added to cart!'} has been added to your cart.
              </div>
            </div>
            
            {/* Кнопка закрытия */}
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}