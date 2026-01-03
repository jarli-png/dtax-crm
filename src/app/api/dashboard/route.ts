import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalProspects, newThisWeek, step6Completed, activities] = await Promise.all([
      prisma.prospect.count(),
      prisma.prospect.count({
        where: { createdAt: { gte: oneWeekAgo } }
      }),
      prisma.prospect.count({
        where: { currentStep: 6 }
      }),
      prisma.activity.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { prospect: true }
      })
    ]);

    const stats = {
      totalProspects,
      newThisWeek,
      inProgress: 0,
      step6Completed,
      totalRevenue: 0,
      avgDealSize: 0,
    };

    const recentActivity = activities.map(a => ({
      id: a.id,
      type: a.type,
      prospect: a.prospect ? `${a.prospect.firstName} ${a.prospect.lastName}` : 'Ukjent',
      description: a.description,
      time: formatTimeAgo(a.createdAt)
    }));

    return NextResponse.json({ stats, recentActivity });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ 
      stats: {
        totalProspects: 0,
        newThisWeek: 0,
        inProgress: 0,
        step6Completed: 0,
        totalRevenue: 0,
        avgDealSize: 0,
      },
      recentActivity: []
    });
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} min siden`;
  if (diffHours < 24) return `${diffHours} timer siden`;
  return `${diffDays} dager siden`;
}
