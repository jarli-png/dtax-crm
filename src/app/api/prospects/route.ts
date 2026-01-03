import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const prospects = await prisma.prospect.findMany({
      include: { companies: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(prospects);
  } catch (error) {
    console.error('Failed to fetch prospects:', error);
    return NextResponse.json([]);
  }
}
