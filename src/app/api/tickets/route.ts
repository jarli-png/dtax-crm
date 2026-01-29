import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Generer ticket-nummer
async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const lastTicket = await prisma.ticket.findFirst({
    where: { ticketNumber: { startsWith: `TKT-${year}-` } },
    orderBy: { ticketNumber: 'desc' }
  });
  
  let nextNum = 1;
  if (lastTicket) {
    const lastNum = parseInt(lastTicket.ticketNumber.split('-')[2]);
    nextNum = lastNum + 1;
  }
  
  return `TKT-${year}-${nextNum.toString().padStart(4, '0')}`;
}

export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        prospect: true,
        messages: { orderBy: { createdAt: 'asc' } },
        assignedTo: true
      },
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const { prospectId, subject, message, toEmail, fromEmail } = await request.json();
    
    const ticketNumber = await generateTicketNumber();
    
    // Opprett ticket med første melding
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        prospectId: prospectId || null,
        subject,
        status: 'OPEN',
        messages: {
          create: {
            direction: 'OUTBOUND',
            fromEmail: fromEmail || 'kundeservice@dtax.no',
            toEmail,
            subject,
            bodyText: message,
            bodyHtml: message.replace(/\n/g, '<br>')
          }
        }
      },
      include: { messages: true, prospect: true }
    });
    
    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Failed to create ticket:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
