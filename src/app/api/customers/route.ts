import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const customers = await prisma.prospect.findMany({
      where: { status: 'CONVERTED' },
      include: { companies: true },
      orderBy: { convertedAt: 'desc' }
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return NextResponse.json([]);
  }
}
