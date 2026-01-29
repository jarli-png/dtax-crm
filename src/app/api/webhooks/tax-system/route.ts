// API Route: Webhook fra tax.salestext.no
// Mottar hendelser når brukere fullfører steg i skatteprosessen

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { taxSystemAPI, invoiceSystemAPI, emailService } from '@/lib/integrations';

const prisma = new PrismaClient();

// Webhook event typer fra tax.salestext.no
interface TaxWebhookEvent {
  type: 'user.created' | 'case.created' | 'step.completed' | 'case.submitted' | 'contract.signed';
  data: {
    userId: string;
    caseId?: string;
    step?: number;
    taxBenefit?: number;
    signatureRef?: string;
    timestamp: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const event: TaxWebhookEvent = await request.json();
    
    // Verifiser webhook-signatur (TODO: implementer)
    // const signature = request.headers.get('x-webhook-signature');
    
    console.log(`Mottok webhook fra tax.salestext.no: ${event.type}`);

    switch (event.type) {
      case 'user.created':
        await handleUserCreated(event.data);
        break;
        
      case 'case.created':
        await handleCaseCreated(event.data);
        break;
        
      case 'step.completed':
        await handleStepCompleted(event.data);
        break;
        
      case 'case.submitted':
        // SUKSESS! Steg 6 er fullført
        await handleCaseSubmitted(event.data);
        break;
        
      case 'contract.signed':
        await handleContractSigned(event.data);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleUserCreated(data: TaxWebhookEvent['data']) {
  // Oppdater prospect med tax system bruker-ID
  const prospect = await prisma.prospect.findFirst({
    where: { taxSystemUserId: data.userId },
  });

  if (prospect) {
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { 
        taxSystemStatus: 'REGISTERED',
        status: 'IN_PROGRESS',
      },
    });

    await prisma.activity.create({
      data: {
        prospectId: prospect.id,
        type: 'SYSTEM_EVENT',
        subject: 'Bruker opprettet i tax.salestext.no',
        description: `Bruker-ID: ${data.userId}`,
      },
    });
  }
}

async function handleCaseCreated(data: TaxWebhookEvent['data']) {
  const prospect = await prisma.prospect.findFirst({
    where: { taxSystemUserId: data.userId },
  });

  if (prospect) {
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { 
        taxSystemStatus: 'CASE_CREATED',
        status: 'STEP_1',
        currentStep: 1,
      },
    });

    await prisma.activity.create({
      data: {
        prospectId: prospect.id,
        type: 'STATUS_CHANGE',
        subject: 'Sak opprettet',
        description: `Sak-ID: ${data.caseId}`,
      },
    });
  }
}

async function handleStepCompleted(data: TaxWebhookEvent['data']) {
  const prospect = await prisma.prospect.findFirst({
    where: { taxSystemUserId: data.userId },
  });

  if (prospect && data.step) {
    const stepStatus = `STEP_${data.step}` as any;
    
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { 
        status: stepStatus,
        currentStep: data.step,
      },
    });

    await prisma.activity.create({
      data: {
        prospectId: prospect.id,
        type: 'STATUS_CHANGE',
        subject: `Steg ${data.step} fullført`,
        description: getStepDescription(data.step),
      },
    });
  }
}

async function handleCaseSubmitted(data: TaxWebhookEvent['data']) {
  // DETTE ER SUKSESS - Skattemelding sendt til Skatteetaten!
  const prospect = await prisma.prospect.findFirst({
    where: { taxSystemUserId: data.userId },
  });

  if (prospect) {
    // Oppdater status til STEP_6 og deretter CONVERTED
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { 
        status: 'STEP_6',
        taxSystemStatus: 'SUBMITTED',
        currentStep: 6,
        convertedAt: new Date(),
      },
    });

    // Logg suksess-aktivitet
    await prisma.activity.create({
      data: {
        prospectId: prospect.id,
        type: 'TAX_SUBMITTED',
        subject: '🎉 Skattemelding sendt til Skatteetaten!',
        description: `Sak ${data.caseId} er sendt. Skattefordel: ${data.taxBenefit ? `${data.taxBenefit.toLocaleString('nb-NO')} kr` : 'Beregnes'}`,
      },
    });

    // Trigger fakturering hvis skattefordel er beregnet
    if (data.taxBenefit && data.taxBenefit > 0) {
      try {
        const taxCase = await taxSystemAPI.getCase(data.caseId!);
        await invoiceSystemAPI.createInvoiceFromTaxCase(prospect.id, taxCase);
        
        // Oppdater til CONVERTED
        await prisma.prospect.update({
          where: { id: prospect.id },
          data: { status: 'CONVERTED' },
        });
      } catch (error) {
        console.error('Feil ved oppretting av faktura:', error);
      }
    }

    // Send bekreftelse på e-post til intern adresse
    if (prospect.email) {
      await emailService.sendEmail({
        to: 'jgl@salestext.no',
        subject: `🎉 Ny konvertering: ${prospect.firstName} ${prospect.lastName}`,
        bodyHtml: `
          <h2>Steg 6 fullført!</h2>
          <p><strong>Kunde:</strong> ${prospect.firstName} ${prospect.lastName}</p>
          <p><strong>Skattefordel:</strong> ${data.taxBenefit?.toLocaleString('nb-NO')} kr</p>
          <p><strong>Sak-ID:</strong> ${data.caseId}</p>
          <p>Faktura er opprettet automatisk.</p>
        `,
        prospectId: prospect.id,
      });
    }
  }
}

async function handleContractSigned(data: TaxWebhookEvent['data']) {
  const prospect = await prisma.prospect.findFirst({
    where: { taxSystemUserId: data.userId },
  });

  if (prospect) {
    await prisma.activity.create({
      data: {
        prospectId: prospect.id,
        type: 'CONTRACT_SIGNED',
        subject: 'Kontrakt signert med BankID',
        description: `Signaturreferanse: ${data.signatureRef}`,
      },
    });

    // Synkroniser kontrakter fra tax-systemet
    const { documentService } = await import('@/lib/integrations');
    await documentService.syncContractsFromTaxSystem(prospect.id);
  }
}

function getStepDescription(step: number): string {
  const descriptions: Record<number, string> = {
    1: 'Kontrakt og samtykke godkjent',
    2: 'Dokumenter lastet opp',
    3: 'AI-analyse fullført',
    4: 'Gjennomgang av forslag',
    5: 'Klar for innsending',
    6: 'Sendt til Skatteetaten',
  };
  return descriptions[step] || `Steg ${step} fullført`;
}
