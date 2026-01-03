import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { to, subject, body, bcc, ticketId } = await request.json();
    
    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Mangler påkrevde felt' }, { status: 400 });
    }
    
    // Hent Brevo API-nøkkel
    const brevoSetting = await prisma.setting.findUnique({
      where: { key: 'brevo_api_key' }
    });
    
    if (!brevoSetting?.value) {
      return NextResponse.json({ error: 'Brevo API-nøkkel ikke konfigurert' }, { status: 400 });
    }

    // Finn prospect basert på e-post
    const prospect = await prisma.prospect.findFirst({
      where: { email: to }
    });

    // Send via Brevo
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoSetting.value,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'dTax', email: 'kundeservice@dtax.no' },
        to: [{ email: to }],
        bcc: bcc ? [{ email: bcc }] : undefined,
        subject,
        htmlContent: body.replace(/\n/g, '<br>')
      })
    });

    if (!brevoResponse.ok) {
      const error = await brevoResponse.text();
      console.error('Brevo error:', error);
      return NextResponse.json({ error: 'Kunne ikke sende e-post: ' + error }, { status: 500 });
    }

    const brevoData = await brevoResponse.json();

    // Hvis ticketId finnes, legg til melding på eksisterende ticket
    if (ticketId) {
      await prisma.ticketMessage.create({
        data: {
          ticketId,
          direction: 'OUTBOUND',
          fromEmail: 'kundeservice@dtax.no',
          toEmail: to,
          subject,
          bodyText: body,
          bodyHtml: body.replace(/\n/g, '<br>'),
          messageId: brevoData.messageId
        }
      });
      
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() }
      });
    } else {
      // Opprett ny ticket
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
      const ticketNumber = `TKT-${year}-${nextNum.toString().padStart(4, '0')}`;
      
      await prisma.ticket.create({
        data: {
          ticketNumber,
          prospectId: prospect?.id || null,
          subject,
          status: 'OPEN',
          messages: {
            create: {
              direction: 'OUTBOUND',
              fromEmail: 'kundeservice@dtax.no',
              toEmail: to,
              subject,
              bodyText: body,
              bodyHtml: body.replace(/\n/g, '<br>'),
              messageId: brevoData.messageId
            }
          }
        }
      });
    }

    return NextResponse.json({ success: true, messageId: brevoData.messageId });
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json({ error: 'Server error: ' + error }, { status: 500 });
  }
}
