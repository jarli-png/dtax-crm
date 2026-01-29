import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { message, toEmail, fromEmail, direction } = await request.json();
    
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id }
    });
    
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket ikke funnet' }, { status: 404 });
    }
    
    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: params.id,
        direction: direction || 'OUTBOUND',
        fromEmail: fromEmail || 'kundeservice@dtax.no',
        toEmail,
        subject: `Re: ${ticket.subject}`,
        bodyText: message,
        bodyHtml: message.replace(/\n/g, '<br>')
      }
    });
    
    // Oppdater ticket timestamp
    await prisma.ticket.update({
      where: { id: params.id },
      data: { updatedAt: new Date() }
    });
    
    return NextResponse.json(ticketMessage);
  } catch (error) {
    console.error('Failed to add message:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
