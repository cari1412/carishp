// app/api/customer/orders/route.ts
import { getCustomerOrders, getCustomerTokensV2 } from '@/lib/shopify/customer-account';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const tokens = await getCustomerTokensV2();
    
    if (!tokens) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Получаем параметры пагинации из query params
    const { searchParams } = new URL(request.url);
    const first = parseInt(searchParams.get('first') || '10');
    const after = searchParams.get('after') || undefined;

    const ordersData = await getCustomerOrders(tokens.access_token, first, after);
    
    if (!ordersData) {
      return NextResponse.json(
        { orders: [], hasNextPage: false },
        { status: 200 }
      );
    }

    return NextResponse.json(ordersData, { status: 200 });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;