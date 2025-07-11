import { clearCustomerTokens } from '@/lib/shopify/customer-account';
import { NextRequest, NextResponse } from 'next/server';

const LOGOUT_URL = process.env.SHOPIFY_CUSTOMER_ACCOUNT_LOGOUT_URL || 'https://shopify.com/authentication/96288604509/oauth/logout';

export async function GET(request: NextRequest) {
  try {
    // Очищаем токены из cookies
    await clearCustomerTokens();

    // Перенаправляем на главную страницу
    const response = NextResponse.redirect(new URL('/', request.url));

    // Дополнительно очищаем все связанные cookies
    response.cookies.delete('customer_tokens');
    response.cookies.delete('oauth_state');
    response.cookies.delete('code_verifier');

    return response;
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    // Очищаем токены
    await clearCustomerTokens();

    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}