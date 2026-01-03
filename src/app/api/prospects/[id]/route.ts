import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const prospect = await prisma.prospect.findUnique({
      where: { id: params.id },
      include: {
        companies: true,
        activities: { orderBy: { createdAt: 'desc' } }
      }
    });
    
    if (!prospect) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    return NextResponse.json(prospect);
  } catch (error) {
    console.error('Failed to fetch prospect:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
