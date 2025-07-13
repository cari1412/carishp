// app/api/customer/addresses/[id]/default/route.ts
import {
    customerAccountFetch,
    getCustomerTokensV2,
    UPDATE_DEFAULT_ADDRESS
} from '@/lib/shopify/customer-account';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokens = await getCustomerTokensV2();
    
    if (!tokens) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const response = await customerAccountFetch<{
      data: {
        customerDefaultAddressUpdate: {
          customer?: {
            defaultAddress: { id: string };
          };
          userErrors: Array<{ field: string[]; message: string }>;
        };
      };
    }>(UPDATE_DEFAULT_ADDRESS, { addressId: params.id }, tokens.access_token);

    const userErrors = response.data?.customerDefaultAddressUpdate?.userErrors;
    if (userErrors && userErrors.length > 0) {
      return NextResponse.json(
        { error: 'Failed to set default address', errors: userErrors.map(e => e.message) },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error setting default address:', error);
    return NextResponse.json(
      { error: 'Failed to set default address' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';