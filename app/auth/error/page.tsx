import Link from 'next/link';

interface AuthErrorPageProps {
  searchParams: {
    error?: string;
  };
}

const errorMessages: Record<string, string> = {
  no_code: 'Код авторизации не получен',
  invalid_state: 'Неверный параметр состояния',
  no_verifier: 'Код верификации не найден',
  token_exchange_failed: 'Не удалось обменять код на токены',
  login_failed: 'Ошибка при инициации входа',
  access_denied: 'Доступ запрещен',
  default: 'Произошла ошибка авторизации',
};

export default function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const errorCode = searchParams.error || 'default';
  const errorMessage = errorMessages[errorCode] || errorMessages.default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-600">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Ошибка авторизации
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {errorMessage}
          </p>
          {errorCode && (
            <p className="mt-1 text-xs text-gray-500">
              Код ошибки: {errorCode}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/login"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Попробовать снова
          </Link>
          
          <Link
            href="/"
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Вернуться на главную
          </Link>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Если проблема повторяется, обратитесь в поддержку
          </p>
        </div>
      </div>
    </div>
  );
}