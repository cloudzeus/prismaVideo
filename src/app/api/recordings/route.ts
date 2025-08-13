import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company to filter recordings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build query based on user role
    let whereClause: any = {};
    
    if (user.role === 'Admin') {
      // Admins can see all recordings in their company
      whereClause = {
        call: {
          companyId: user.companyId
        }
      };
    } else {
      // Regular users can only see recordings of meetings they participated in
      whereClause = {
        call: {
          companyId: user.companyId,
          OR: [
            { createdById: session.user.id },
            { participants: { some: { userId: session.user.id } } }
          ]
        }
      };
    }

    const recordings = await prisma.recording.findMany({
      where: whereClause,
      include: {
        call: {
          select: {
            title: true,
            company: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      recordings: recordings.map(recording => ({
        id: recording.id,
        title: recording.title,
        description: recording.description,
        url: recording.url,
        bunnyCdnUrl: recording.bunnyCdnUrl,
        duration: recording.duration,
        fileSize: recording.fileSize,
        status: recording.status,
        createdAt: recording.createdAt,
        updatedAt: recording.updatedAt,
        callTitle: recording.call.title,
        companyName: recording.call.company.name
      }))
    });

  } catch (error) {
    console.error('Failed to fetch recordings:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch recordings' 
      },
      { status: 500 }
    );
  }
}
