import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const converted = await prisma.prospect.count({
      where: { status: 'CONVERTED', updatedAt: { gte: monthStart } }
    });
    
    const inProgress = await prisma.prospect.count({
      where: { status: { in: ['IN_PROGRESS', 'STEP_1', 'STEP_2', 'STEP_3', 'STEP_4', 'STEP_5', 'STEP_6'] } }
    });
    
    let overdueTasks = 0;
    try {
      overdueTasks = await (prisma as any).task.count({
        where: { completed: false, dueDate: { lt: now } }
      });
    } catch (e) {}
    
    return NextResponse.json({ converted, inProgress, overdueTasks });
  } catch (error) {
    return NextResponse.json({ converted: 0, inProgress: 0, overdueTasks: 0 });
  }
}
