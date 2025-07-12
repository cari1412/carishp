// app/auth/callback/route.ts
import { exchangeCodeForTokens, setCustomerTokens } from '@/lib/shopify/customer-account';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('=== AUTH CALLBACK STARTED ===');
  
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  console.log('Callback params:', { code: !!code, state: !!state, error });

  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(new URL('/auth/error?error=' + error, request.url));
  }

  if (!code) {
    console.error('No authorization code received');
    return NextResponse.redirect(new URL('/auth/error?error=no_code', request.url));
  }

  try {
    const storedState = request.cookies.get('oauth_state')?.value;
    const codeVerifier = request.cookies.get('code_verifier')?.value;

    console.log('Stored values:', { 
      hasStoredState: !!storedState, 
      hasCodeVerifier: !!codeVerifier,
      stateMatch: storedState === state 
    });

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
    console.log('Exchange tokens with redirect URI:', redirectUri);
    
    const tokens = await exchangeCodeForTokens(code, redirectUri, codeVerifier);
    console.log('Tokens received:', { 
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token 
    });

    // Сохраняем токены
    await setCustomerTokens(tokens);
    console.log('Tokens saved to cookies');

    // Редирект с флагом успешной авторизации
    const response = NextResponse.redirect(new URL('/?auth=success', request.url));
    
    // Очищаем временные cookies
    response.cookies.delete('oauth_state');
    response.cookies.delete('code_verifier');

    console.log('=== AUTH CALLBACK COMPLETED ===');
    return response;
  } catch (error) {
    console.error('Error during token exchange:', error);
    return NextResponse.redirect(new URL('/auth/error?error=token_exchange_failed', request.url));
  }
}