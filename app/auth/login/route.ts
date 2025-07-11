import { getAuthorizationUrl } from '@/lib/shopify/customer-account';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const redirectUri = new URL('/auth/callback', request.url).toString();
    const { authUrl, state, codeVerifier } = await getAuthorizationUrl(redirectUri);

    // Создаем ответ с редиректом на Shopify OAuth
    const response = NextResponse.redirect(authUrl);

    // Сохраняем state и codeVerifier в cookies для проверки в callback
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 минут
    });

    response.cookies.set('code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 минут
    });

    return response;
  } catch (error) {
    console.error('Error during login initiation:', error);
    return NextResponse.redirect(new URL('/auth/error?error=login_failed', request.url));
  }
}

export async function POST(request: NextRequest) {
  // Поддержка POST запросов для форм входа
  return GET(request);
}