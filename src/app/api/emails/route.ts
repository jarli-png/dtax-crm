import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const emails = await prisma.emailLog.findMany({
      include: { prospect: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return NextResponse.json(emails);
  } catch (error) {
    console.error('Failed to fetch emails:', error);
    return NextResponse.json([]);
  }
}
