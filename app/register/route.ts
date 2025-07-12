import { redirect } from 'next/navigation';

// В Customer Account API (OAuth flow) регистрация и вход обрабатываются 
// на стороне Shopify через единый процесс аутентификации
export async function GET() {
  redirect('/auth/login');
}

export async function POST() {
  redirect('/auth/login');
}