import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prospect = await prisma.prospect.update({
      where: { id: params.id },
      data: { lastCalledAt: new Date() }
    });
    return NextResponse.json({ success: true, lastCalledAt: prospect.lastCalledAt });
  } catch (error) {
    console.error('Error updating call status:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
