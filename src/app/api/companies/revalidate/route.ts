import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    // Revalidate the companies cache
    revalidateTag('companies');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Companies cache revalidated successfully' 
    });
  } catch (error) {
    console.error('Error revalidating companies cache:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to revalidate companies cache' 
      },
      { status: 500 }
    );
  }
} 