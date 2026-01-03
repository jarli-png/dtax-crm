import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [converted, inProgress] = await Promise.all([
      prisma.prospect.count({
        where: {
          status: 'CONVERTED',
          convertedAt: { gte: startOfMonth }
        }
      }),
      prisma.prospect.count({
        where: {
          status: { in: ['IN_PROGRESS', 'STEP_1', 'STEP_2', 'STEP_3', 'STEP_4', 'STEP_5'] }
        }
      })
    ]);

    return NextResponse.json({ converted, inProgress });
  } catch (error) {
    console.error('Failed to fetch sidebar stats:', error);
    return NextResponse.json({ converted: 0, inProgress: 0 });
  }
}
