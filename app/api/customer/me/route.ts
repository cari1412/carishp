// app/api/customer/me/route.ts
import { getCurrentCustomer } from '@/lib/shopify/customer-account';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const customer = await getCurrentCustomer();
    
    if (!customer) {
      return NextResponse.json({ customer: null }, { status: 200 });
    }

    return NextResponse.json({ customer }, { status: 200 });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer data' },
      { status: 500 }
    );
  }
}

// Отключаем кеширование для этого роута
export const dynamic = 'force-dynamic';
export const revalidate = 0;