// app/auth/callback/route.ts
import { exchangeCodeForTokens, setCustomerTokens } from '@/lib/shopify/customer-account';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Проверяем наличие ошибок
  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(new URL('/auth/error?error=' + error, request.url));
  }

  // Проверяем наличие кода авторизации
  if (!code) {
    console.error('No authorization code received');
    return NextResponse.redirect(new URL('/auth/error?error=no_code', request.url));
  }

  try {
    // Получаем state и codeVerifier из cookies
    const storedState = request.cookies.get('oauth_state')?.value;
    const codeVerifier = request.cookies.get('code_verifier')?.value;

    // Проверяем state для защиты от CSRF
    if (!storedState || storedState !== state) {
      console.error('Invalid state parameter');
      return NextResponse.redirect(new URL('/auth/error?error=invalid_state', request.url));
    }

    if (!codeVerifier) {
      console.error('No code verifier found');
      return NextResponse.redirect(new URL('/auth/error?error=no_verifier', request.url));
    }

    // Обмениваем код на токены
    const redirectUri = new URL('/auth/callback', request.url).toString();
    const tokens = await exchangeCodeForTokens(code, redirectUri, codeVerifier);

    // Сохраняем токены в cookies
    await setCustomerTokens(tokens);

    // Получаем сохраненный URL для редиректа
    const response = NextResponse.redirect(new URL('/', request.url));
    
    // Устанавливаем cookie для триггера обновления состояния
    response.cookies.set('auth_completed', 'true', {
      httpOnly: false, // Важно! Чтобы JS мог прочитать
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10, // 10 секунд достаточно
    });

    // Очищаем временные cookies
    response.cookies.delete('oauth_state');
    response.cookies.delete('code_verifier');

    return response;
  } catch (error) {
    console.error('Error during token exchange:', error);
    return NextResponse.redirect(new URL('/auth/error?error=token_exchange_failed', request.url));
  }
}