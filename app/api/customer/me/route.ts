// app/api/customer/me/route.ts
import { getCurrentCustomer, getCustomerTokens } from '@/lib/shopify/customer-account';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const tokens = await getCustomerTokens();
    
    if (!tokens) {
      return NextResponse.json({ customer: null }, { status: 200 });
    }

    const customer = await getCurrentCustomer();
    
    return NextResponse.json({ customer }, { status: 200 });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer data' },
      { status: 500 }
    );
  }
}