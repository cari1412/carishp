// lib/shopify/customer-account.ts
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
 token_type?: string;
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
   const errorText = await response.text();
   console.error('Token exchange failed:', errorText);
   throw new Error('Failed to exchange code for tokens');
 }

 const tokens = await response.json();
 console.log('Received tokens:', {
   access_token_prefix: tokens.access_token?.substring(0, 10),
   has_refresh_token: !!tokens.refresh_token,
   expires_in: tokens.expires_in
 });
 
 return tokens;
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
   const errorText = await response.text();
   console.error('Token refresh failed:', errorText);
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
 console.log('Making GraphQL request to:', API_URL);
 console.log('Access token prefix:', accessToken.substring(0, 10));
 
 // Пробуем разные варианты заголовков
 const headers: HeadersInit = {
   'Content-Type': 'application/json',
   'Authorization': accessToken, // Без "Bearer"
 };
 
 console.log('Request headers:', headers);
 
 const response = await fetch(API_URL, {
   method: 'POST',
   headers,
   body: JSON.stringify({
     query,
     variables,
   }),
 });

 console.log('GraphQL response status:', response.status);
 console.log('Response headers:', Object.fromEntries(response.headers.entries()));
 
 const responseText = await response.text();
 console.log('GraphQL response:', responseText);

 if (!response.ok) {
   // Если не работает без Bearer, пробуем с Bearer
   if (response.status === 401) {
     console.log('Trying with Bearer prefix...');
     const response2 = await fetch(API_URL, {
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
     
     const responseText2 = await response2.text();
     console.log('Second attempt response:', response2.status, responseText2);
     
     if (!response2.ok) {
       throw new Error(`Customer Account API error: ${response2.statusText} - ${responseText2}`);
     }
     
     const data2 = JSON.parse(responseText2);
     if (data2.errors) {
       throw new Error(`GraphQL error: ${data2.errors[0]?.message}`);
     }
     return data2;
   }
   
   throw new Error(`Customer Account API error: ${response.statusText} - ${responseText}`);
 }

 const data = JSON.parse(responseText);
 
 if (data.errors) {
   console.error('GraphQL errors:', data.errors);
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
   console.log('Fetching customer data...');
   const response = await customerAccountFetch<{
     data: { customer: Customer };
   }>(query, {}, accessToken);

   console.log('Customer response:', JSON.stringify(response, null, 2));
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
   console.log('No customer_tokens cookie found');
   return null;
 }

 try {
   // Декодируем URL-encoded строку
   const decodedString = decodeURIComponent(tokensString);
   const tokens = JSON.parse(decodedString);
   
   console.log('Tokens found:', {
     access_token_prefix: tokens.access_token?.substring(0, 10),
     hasRefreshToken: !!tokens.refresh_token,
     expiresIn: tokens.expires_in
   });
   
   return tokens;
 } catch (error) {
   console.error('Error parsing tokens:', error);
   return null;
 }
}

export async function setCustomerTokens(tokens: CustomerAccountTokens): Promise<void> {
 const cookieStore = await cookies();
 
 // Сохраняем токены по отдельности, чтобы избежать проблем с экранированием
 cookieStore.set('customer_access_token', tokens.access_token, {
   httpOnly: true,
   secure: process.env.NODE_ENV === 'production',
   sameSite: 'lax',
   maxAge: tokens.expires_in,
 });
 
 cookieStore.set('customer_refresh_token', tokens.refresh_token, {
   httpOnly: true,
   secure: process.env.NODE_ENV === 'production',
   sameSite: 'lax',
   maxAge: 30 * 24 * 60 * 60, // 30 дней
 });
 
 cookieStore.set('customer_token_expires', tokens.expires_in.toString(), {
   httpOnly: true,
   secure: process.env.NODE_ENV === 'production',
   sameSite: 'lax',
   maxAge: tokens.expires_in,
 });
 
 if (tokens.id_token) {
   cookieStore.set('customer_id_token', tokens.id_token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax',
     maxAge: tokens.expires_in,
   });
 }
}

export async function clearCustomerTokens(): Promise<void> {
 const cookieStore = await cookies();
 cookieStore.delete('customer_tokens');
 cookieStore.delete('customer_access_token');
 cookieStore.delete('customer_refresh_token');
 cookieStore.delete('customer_token_expires');
 cookieStore.delete('customer_id_token');
}

// Получение токенов из раздельных cookies
export async function getCustomerTokensV2(): Promise<CustomerAccountTokens | null> {
 const cookieStore = await cookies();
 
 const accessToken = cookieStore.get('customer_access_token')?.value;
 const refreshToken = cookieStore.get('customer_refresh_token')?.value;
 const expiresIn = cookieStore.get('customer_token_expires')?.value;
 const idToken = cookieStore.get('customer_id_token')?.value;
 
 if (!accessToken || !refreshToken) {
   // Пробуем старый формат
   return getCustomerTokens();
 }
 
 console.log('Found separate tokens:', {
   access_token_prefix: accessToken?.substring(0, 10),
   has_refresh_token: !!refreshToken,
   expires_in: expiresIn
 });
 
 return {
   access_token: accessToken,
   refresh_token: refreshToken,
   expires_in: parseInt(expiresIn || '3600'),
   id_token: idToken,
 };
}

// Проверка авторизации клиента
export async function isCustomerLoggedIn(): Promise<boolean> {
 const tokens = await getCustomerTokensV2();
 return !!tokens?.access_token;
}

// Получение текущего клиента (с автоматическим обновлением токенов)
export async function getCurrentCustomer(): Promise<Customer | null> {
 let tokens = await getCustomerTokensV2();
 
 if (!tokens) {
   console.log('No tokens found, user not authenticated');
   return null;
 }

 try {
   // Сначала пробуем получить данные с текущим токеном
   const customer = await getCustomer(tokens.access_token);
   if (customer) {
     return customer;
   }
   
   // Если не получилось, пробуем обновить токены
   console.log('Customer fetch failed, trying to refresh tokens...');
   tokens = await refreshTokens(tokens.refresh_token);
   await setCustomerTokens(tokens);
   
   // Пробуем еще раз с новыми токенами
   return await getCustomer(tokens.access_token);
 } catch (error) {
   console.error('Failed to get customer:', error);
   
   // Если токены невалидны, очищаем их
   await clearCustomerTokens();
   return null;
 }
}