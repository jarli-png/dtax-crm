import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { to, subject, body, bcc, ticketId } = await request.json();
    
    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Mangler påkrevde felt' }, { status: 400 });
    }
    
    const brevoSetting = await prisma.setting.findUnique({
      where: { key: 'brevo_api_key' }
    });
    
    if (!brevoSetting?.value) {
      return NextResponse.json({ error: 'Brevo API-nøkkel ikke konfigurert' }, { status: 400 });
    }

    const prospect = await prisma.prospect.findFirst({
      where: { email: to }
    });

    // SMTP transport uten List-Unsubscribe header
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: 'jarli@jarli.no',
        pass: brevoSetting.value
      }
    });

    const mailOptions: nodemailer.SendMailOptions = {
      from: '"dTax Kundeservice" <kundeservice@dtax.no>',
      to: to,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
    };
    
    if (bcc) {
      mailOptions.bcc = bcc;
    }

    const info = await transporter.sendMail(mailOptions);

    // Håndter ticket
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
          messageId: info.messageId
        }
      });
      
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() }
      });
    } else {
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
              messageId: info.messageId
            }
          }
        }
      });
    }

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json({ error: 'Server error: ' + error }, { status: 500 });
  }
}
