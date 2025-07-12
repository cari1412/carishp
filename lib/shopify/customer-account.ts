import { cookies } from 'next/headers';

const CLIENT_ID = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID!;
const CLIENT_SECRET = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET!;
const API_URL = process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_URL!;
const AUTH_URL = process.env.SHOPIFY_CUSTOMER_ACCOUNT_AUTH_URL!;
const TOKEN_URL = process.env.SHOPIFY_CUSTOMER_ACCOUNT_TOKEN_URL!;

export type CustomerAccountTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  id_token?: string;
};

export type Customer = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
};

// Генерация PKCE для безопасности
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Создание URL для авторизации
export async function getAuthorizationUrl(redirectUri: string): Promise<{
  authUrl: string;
  state: string;
  codeVerifier: string;
}> {
  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'openid email',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return {
    authUrl: `${AUTH_URL}?${params.toString()}`,
    state,
    codeVerifier,
  };
}

// Обмен кода на токены
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<CustomerAccountTokens> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens');
  }

  return response.json();
}

// Обновление токенов
export async function refreshTokens(refreshToken: string): Promise<CustomerAccountTokens> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh tokens');
  }

  return response.json();
}

// GraphQL запрос к Customer Account API
export async function customerAccountFetch<T>(
  query: string,
  variables: any = {},
  accessToken: string
): Promise<T> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Customer Account API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`GraphQL error: ${data.errors[0]?.message}`);
  }

  return data;
}

// Получение данных клиента
export async function getCustomer(accessToken: string): Promise<Customer | null> {
  const query = `
    query getCustomer {
      customer {
        id
        email
        firstName
        lastName
        phone
        createdAt
        updatedAt
      }
    }
  `;

  try {
    const response = await customerAccountFetch<{
      data: { customer: Customer };
    }>(query, {}, accessToken);

    return response.data.customer;
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

// Утилиты для работы с cookies
export async function getCustomerTokens(): Promise<CustomerAccountTokens | null> {
  const cookieStore = await cookies();
  const tokensString = cookieStore.get('customer_tokens')?.value;
  
  if (!tokensString) {
    return null;
  }

  try {
    return JSON.parse(tokensString);
  } catch {
    return null;
  }
}

export async function setCustomerTokens(tokens: CustomerAccountTokens): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('customer_tokens', JSON.stringify(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: tokens.expires_in,
  });
}

export async function clearCustomerTokens(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('customer_tokens');
}

// Проверка авторизации клиента
export async function isCustomerLoggedIn(): Promise<boolean> {
  const tokens = await getCustomerTokens();
  return !!tokens?.access_token;
}

// Получение текущего клиента (с автоматическим обновлением токенов)
export async function getCurrentCustomer(): Promise<Customer | null> {
  let tokens = await getCustomerTokens();
  
  if (!tokens) {
    return null;
  }

  // Проверяем, не истекли ли токены
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + tokens.expires_in;
  
  if (expiresAt < now + 300) { // Обновляем за 5 минут до истечения
    try {
      tokens = await refreshTokens(tokens.refresh_token);
      await setCustomerTokens(tokens);
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      await clearCustomerTokens();
      return null;
    }
  }

  return getCustomer(tokens.access_token);
}