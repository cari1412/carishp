import { getCollections } from 'lib/shopify';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const collections = await getCollections();
    // Filter out "All" collection
    const filteredCollections = collections.filter(col => col.handle !== '');
    
    return NextResponse.json({ collections: filteredCollections });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}