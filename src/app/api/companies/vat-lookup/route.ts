import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { AFM } = await request.json();

    if (!AFM) {
      return NextResponse.json(
        { error: 'VAT number (AFM) is required' },
        { status: 400 }
      );
    }

    // Make request to Greek government service
    const response = await fetch('https://vat.wwa.gr/afm2info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ afm: AFM }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Helper function to safely extract values
    const safeExtract = (value: any): string => {
      if (!value) {
        return '';
      }
      if (typeof value === 'string') {
        return value;
      }
      if (value.$ && value.$.xsi && value.$.xsi.nil === 'true') {
        return '';
      }
      if (typeof value === 'object') {
        return '';
      }
      return String(value);
    };

    // Map the response to our form fields
    const mappedData = {
      IRSDATA: safeExtract(data.basic_rec?.doy_descr),
      JOBTYPE: safeExtract(data.basic_rec?.commer_title),
      name: safeExtract(data.basic_rec?.onomasia),
      address: `${safeExtract(data.basic_rec?.postal_address)} ${safeExtract(data.basic_rec?.postal_address_no)}`.trim(),
      ZIP: safeExtract(data.basic_rec?.postal_zip_code),
      city: safeExtract(data.basic_rec?.postal_area_description),
    };

    // Filter out empty values
    const filteredData = Object.fromEntries(
      Object.entries(mappedData).filter(([, value]) => value && value.trim() !== '')
    );

    return NextResponse.json(filteredData);
  } catch (error) {
    console.error('VAT lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup VAT number' },
      { status: 500 }
    );
  }
} 