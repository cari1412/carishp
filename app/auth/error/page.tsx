'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'login_failed':
        return 'Failed to initiate login process. Please try again.';
      case 'no_code':
        return 'Authorization code not received. Please try logging in again.';
      case 'invalid_state':
        return 'Security validation failed. Please try logging in again.';
      case 'no_verifier':
        return 'Authentication verification failed. Please try logging in again.';
      case 'token_exchange_failed':
        return 'Failed to complete authentication. Please try again.';
      default:
        return 'An unexpected error occurred during authentication.';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full bg-white dark:bg-black rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {getErrorMessage(error)}
        </p>
        {error && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            Error code: {error}
          </p>
        )}
        <div className="space-y-4">
          <Link 
            href="/auth/login"
            className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </Link>
          <Link 
            href="/"
            className="block w-full text-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}