import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        prospect: true,
        messages: { orderBy: { createdAt: 'asc' } },
        assignedTo: true
      }
    });
    
    if (!ticket) {
      return NextResponse.json({ error: 'Ikke funnet' }, { status: 404 });
    }
    
    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Failed to fetch ticket:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    
    const ticket = await prisma.ticket.update({
      where: { id: params.id },
      data: {
        status,
        closedAt: status === 'CLOSED' ? new Date() : null
      }
    });
    
    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Failed to update ticket:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
