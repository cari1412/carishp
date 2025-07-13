// app/api/customer/addresses/route.ts
import {
    createCustomerAddress,
    getCustomerAddresses,
    getCustomerTokensV2
} from '@/lib/shopify/customer-account';
import { NextRequest, NextResponse } from 'next/server';

// GET - получение всех адресов
export async function GET() {
  try {
    const tokens = await getCustomerTokensV2();
    
    if (!tokens) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const addressesData = await getCustomerAddresses(tokens.access_token);
    
    if (!addressesData) {
      return NextResponse.json(
        { addresses: [], defaultAddressId: null },
        { status: 200 }
      );
    }

    return NextResponse.json(addressesData, { status: 200 });
  } catch (error) {
    console.error('Error fetching customer addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

// POST - создание нового адреса
export async function POST(request: NextRequest) {
  try {
    const tokens = await getCustomerTokensV2();
    
    if (!tokens) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = await createCustomerAddress(tokens.access_token, body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to create address', errors: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;