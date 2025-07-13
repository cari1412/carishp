// lib/shopify/customer-account.ts
import { cookies } from 'next/headers';

const CLIENT_ID = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID!;
const CLIENT_SECRET = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET!;
const API_URL = process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_URL!;
const AUTH_URL = process.env.SHOPIFY_CUSTOMER_ACCOUNT_AUTH_URL!;
const TOKEN_URL = process.env.SHOPIFY_CUSTOMER_ACCOUNT_TOKEN_URL!;

// === TYPES ===

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

export type CustomerOrder = {
  id: string;
  name: string; // Номер заказа (#1001)
  processedAt: string;
  fulfillmentStatus: 'FULFILLED' | 'UNFULFILLED' | 'PARTIALLY_FULFILLED';
  financialStatus: 'PAID' | 'PENDING' | 'PARTIALLY_PAID' | 'REFUNDED' | 'VOIDED';
  totalPrice: {
    amount: string;
    currencyCode: string;
  };
  lineItems: {
    edges: Array<{
      node: {
        title: string;
        quantity: number;
        image?: {
          url: string;
          altText: string;
        };
        variant?: {
          price: {
            amount: string;
            currencyCode: string;
          };
        };
      };
    }>;
  };
};

export type CustomerAddress = {
  id: string;
  formatted: string[];
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  provinceCode?: string;
  country?: string;
  countryCode?: string;
  zip?: string;
  phone?: string;
  isDefault: boolean;
};

// === PKCE HELPERS ===

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

// === AUTH FUNCTIONS ===

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
    scope: 'customer-account-api:full',
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

// === GRAPHQL FUNCTION ===

export async function customerAccountFetch<T>(
  query: string,
  variables: any = {},
  accessToken: string
): Promise<T> {
  console.log('Making GraphQL request to:', API_URL);
  console.log('Access token prefix:', accessToken.substring(0, 10));
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': accessToken,
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
    throw new Error(`Customer Account API error: ${response.statusText} - ${responseText}`);
  }

  const data = JSON.parse(responseText);
  
  if (data.errors) {
    console.error('GraphQL errors:', data.errors);
    throw new Error(`GraphQL error: ${data.errors[0]?.message}`);
  }

  return data;
}

// === GRAPHQL QUERIES ===

export const GET_CUSTOMER = `
  query getCustomer {
    customer {
      id
      emailAddress {
        emailAddress
      }
      firstName
      lastName
      phoneNumber {
        phoneNumber
      }
    }
  }
`;

export const GET_CUSTOMER_ORDERS = `
  query getCustomerOrders($first: Int = 10, $after: String) {
    customer {
      orders(first: $first, after: $after, reverse: true) {
        edges {
          cursor
          node {
            id
            name
            processedAt
            fulfillmentStatus
            financialStatus
            totalPrice {
              amount
              currencyCode
            }
            lineItems(first: 5) {
              edges {
                node {
                  title
                  quantity
                  image {
                    url
                    altText
                  }
                  variant {
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
      }
    }
  }
`;

export const GET_CUSTOMER_ADDRESSES = `
  query getCustomerAddresses {
    customer {
      addresses {
        id
        formatted
        firstName
        lastName
        company
        address1
        address2
        city
        province
        provinceCode
        country
        countryCode
        zip
        phone
        isDefault
      }
      defaultAddress {
        id
      }
    }
  }
`;

// === GRAPHQL MUTATIONS ===

export const CREATE_ADDRESS = `
  mutation customerAddressCreate($address: CustomerAddressInput!) {
    customerAddressCreate(address: $address) {
      address {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_ADDRESS = `
  mutation customerAddressUpdate($id: ID!, $address: CustomerAddressInput!) {
    customerAddressUpdate(id: $id, address: $address) {
      address {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const DELETE_ADDRESS = `
  mutation customerAddressDelete($id: ID!) {
    customerAddressDelete(id: $id) {
      deletedAddressId
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_DEFAULT_ADDRESS = `
  mutation customerDefaultAddressUpdate($addressId: ID!) {
    customerDefaultAddressUpdate(addressId: $addressId) {
      customer {
        defaultAddress {
          id
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// === CUSTOMER DATA FUNCTIONS ===

export async function getCustomer(accessToken: string): Promise<Customer | null> {
  try {
    console.log('Fetching customer data...');
    const response = await customerAccountFetch<{
      data: { customer: any };
    }>(GET_CUSTOMER, {}, accessToken);

    console.log('Customer response:', JSON.stringify(response, null, 2));
    
    if (response.data?.customer) {
      const customer = response.data.customer;
      return {
        id: customer.id,
        email: customer.emailAddress?.emailAddress || '',
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phoneNumber?.phoneNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

export async function getCustomerOrders(
  accessToken: string,
  first: number = 10,
  after?: string
): Promise<{ orders: CustomerOrder[]; hasNextPage: boolean } | null> {
  try {
    const response = await customerAccountFetch<{
      data: {
        customer: {
          orders: {
            edges: Array<{ cursor: string; node: CustomerOrder }>;
            pageInfo: { hasNextPage: boolean };
          };
        };
      };
    }>(GET_CUSTOMER_ORDERS, { first, after }, accessToken);

    if (response.data?.customer?.orders) {
      return {
        orders: response.data.customer.orders.edges.map(edge => edge.node),
        hasNextPage: response.data.customer.orders.pageInfo.hasNextPage
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return null;
  }
}

export async function getCustomerAddresses(
  accessToken: string
): Promise<{ addresses: CustomerAddress[]; defaultAddressId?: string } | null> {
  try {
    const response = await customerAccountFetch<{
      data: {
        customer: {
          addresses: CustomerAddress[];
          defaultAddress?: { id: string };
        };
      };
    }>(GET_CUSTOMER_ADDRESSES, {}, accessToken);

    if (response.data?.customer) {
      return {
        addresses: response.data.customer.addresses,
        defaultAddressId: response.data.customer.defaultAddress?.id
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching customer addresses:', error);
    return null;
  }
}

export async function createCustomerAddress(
  accessToken: string,
  address: Omit<CustomerAddress, 'id' | 'formatted' | 'isDefault'>
): Promise<{ success: boolean; errors?: string[] }> {
  try {
    const response = await customerAccountFetch<{
      data: {
        customerAddressCreate: {
          address?: { id: string };
          userErrors: Array<{ field: string[]; message: string }>;
        };
      };
    }>(CREATE_ADDRESS, { address }, accessToken);

    const userErrors = response.data?.customerAddressCreate?.userErrors;
    if (userErrors && userErrors.length > 0) {
      return {
        success: false,
        errors: userErrors.map(error => error.message)
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating address:', error);
    return {
      success: false,
      errors: ['Failed to create address']
    };
  }
}

// === TOKEN MANAGEMENT ===

export async function getCustomerTokens(): Promise<CustomerAccountTokens | null> {
  const cookieStore = await cookies();
  const tokensString = cookieStore.get('customer_tokens')?.value;
  
  if (!tokensString) {
    console.log('No customer_tokens cookie found');
    return null;
  }

  try {
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
    maxAge: 30 * 24 * 60 * 60,
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

export async function getCustomerTokensV2(): Promise<CustomerAccountTokens | null> {
  const cookieStore = await cookies();
  
  const accessToken = cookieStore.get('customer_access_token')?.value;
  const refreshToken = cookieStore.get('customer_refresh_token')?.value;
  const expiresIn = cookieStore.get('customer_token_expires')?.value;
  const idToken = cookieStore.get('customer_id_token')?.value;
  
  if (!accessToken || !refreshToken) {
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

export async function isCustomerLoggedIn(): Promise<boolean> {
  const tokens = await getCustomerTokensV2();
  return !!tokens?.access_token;
}

export async function getCurrentCustomer(): Promise<Customer | null> {
  let tokens = await getCustomerTokensV2();
  
  if (!tokens) {
    console.log('No tokens found, user not authenticated');
    return null;
  }

  try {
    const customer = await getCustomer(tokens.access_token);
    if (customer) {
      return customer;
    }
    
    console.log('Customer fetch failed, trying to refresh tokens...');
    tokens = await refreshTokens(tokens.refresh_token);
    await setCustomerTokens(tokens);
    
    return await getCustomer(tokens.access_token);
  } catch (error) {
    console.error('Failed to get customer:', error);
    await clearCustomerTokens();
    return null;
  }
}