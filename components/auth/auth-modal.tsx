// components/auth/auth-modal.tsx
'use client';

import { useCustomer } from '@/lib/shopify/customer-context';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, X } from 'lucide-react';
import { Fragment } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onCloseAction: () => void; // Переименовано из onClose
  title?: string;
  description?: string;
  redirectTo?: string; // URL для редиректа после входа
}

export default function AuthModal({ 
  isOpen, 
  onCloseAction, // Переименовано из onClose
  title = "Sign in to continue",
  description = "Create an account or sign in to access this feature"
}: AuthModalProps) {
  const { login } = useCustomer();

  const handleSignIn = () => {
    console.log('Sign In clicked');
    // Сохраняем URL для возврата после авторизации
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_redirect', window.location.pathname);
      console.log('Saved redirect path:', window.location.pathname);
    }
    console.log('Calling login function');
    login();
  };

  const handleSignUp = () => {
    // Можно добавить отдельную страницу регистрации
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_redirect', window.location.pathname);
    }
    login(); // Пока используем тот же flow
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onCloseAction} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-black shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
                  <Dialog.Title className="text-xl font-semibold">
                    {title}
                  </Dialog.Title>
                  <button
                    onClick={onCloseAction}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                      <UserPlus className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                      {description}
                    </p>
                    
                    <div className="space-y-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSignIn}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <LogIn className="w-5 h-5" />
                        Sign In
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSignUp}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                      >
                        <UserPlus className="w-5 h-5" />
                        Create Account
                      </motion.button>
                    </div>

                    <p className="mt-6 text-xs text-neutral-500">
                      By continuing, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}