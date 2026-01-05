import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const prospect = await prisma.prospect.findUnique({
      where: { id: params.id },
      include: { 
        companies: true,
        activities: { orderBy: { createdAt: 'desc' }, take: 20 }
      }
    });
    if (!prospect) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    let tasks: any[] = [];
    let notesList: any[] = [];
    try {
      tasks = await (prisma as any).task.findMany({ where: { prospectId: params.id }, orderBy: { dueDate: 'asc' } });
      notesList = await (prisma as any).prospectNote.findMany({ where: { prospectId: params.id }, orderBy: { createdAt: 'desc' } });
    } catch (e) {}
    
    return NextResponse.json({ ...prospect, tasks, notesList });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const prospect = await prisma.prospect.update({
      where: { id: params.id },
      data: body
    });
    return NextResponse.json(prospect);
  } catch (error) {
    return NextResponse.json({ error: 'Update failed: ' + error }, { status: 500 });
  }
}
