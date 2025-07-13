// app/api/customer/addresses/[id]/route.ts
import {
  customerAccountFetch,
  DELETE_ADDRESS,
  getCustomerTokensV2,
  UPDATE_ADDRESS
} from '@/lib/shopify/customer-account';
import { NextRequest, NextResponse } from 'next/server';

// DELETE - удаление адреса
export async function DELETE(
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
        customerAddressDelete: {
          deletedAddressId?: string;
          userErrors: Array<{ field: string[]; message: string }>;
        };
      };
    }>(DELETE_ADDRESS, { id: params.id }, tokens.access_token);

    const userErrors = response.data?.customerAddressDelete?.userErrors;
    if (userErrors && userErrors.length > 0) {
      return NextResponse.json(
        { error: 'Failed to delete address', errors: userErrors.map(e => e.message) },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}

// PUT - обновление адреса
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

    const body = await request.json();
    
    const response = await customerAccountFetch<{
      data: {
        customerAddressUpdate: {
          address?: { id: string };
          userErrors: Array<{ field: string[]; message: string }>;
        };
      };
    }>(UPDATE_ADDRESS, { id: params.id, address: body }, tokens.access_token);

    const userErrors = response.data?.customerAddressUpdate?.userErrors;
    if (userErrors && userErrors.length > 0) {
      return NextResponse.json(
        { error: 'Failed to update address', errors: userErrors.map(e => e.message) },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';