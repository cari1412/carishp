// app/auth/login/route.ts
import { getAuthorizationUrl } from '@/lib/shopify/customer-account';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Генерируем URL для авторизации
    const redirectUri = new URL('/auth/callback', request.url).toString();
    const { authUrl, state, codeVerifier } = await getAuthorizationUrl(redirectUri);

    // Создаем ответ с редиректом на Shopify
    const response = NextResponse.redirect(authUrl);

    // Сохраняем state и codeVerifier в cookies для проверки при callback
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
      maxAge: 600,
    });

    return response;
  } catch (error) {
    console.error('Error generating authorization URL:', error);
    return NextResponse.redirect(new URL('/auth/error?error=auth_init_failed', request.url));
  }
}