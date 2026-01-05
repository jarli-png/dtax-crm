import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { title, dueDate, description } = await request.json();
    const task = await (prisma as any).task.create({
      data: {
        prospectId: params.id,
        title,
        dueDate: new Date(dueDate),
        description
      }
    });
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: 'Server error: ' + error }, { status: 500 });
  }
}
