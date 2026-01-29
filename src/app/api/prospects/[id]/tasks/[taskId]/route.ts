import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string; taskId: string } }) {
  try {
    const { completed } = await request.json();
    const task = await (prisma as any).task.update({
      where: { id: params.taskId },
      data: { 
        completed,
        completedAt: completed ? new Date() : null
      }
    });
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: 'Server error: ' + error }, { status: 500 });
  }
}
