// API Route: Opprett bruker i tax.salestext.no
// Kalles fra CRM når vi vil registrere en prospect som bruker

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { taxSystemAPI, emailService, CONFIG } from '@/lib/integrations';

const prisma = new PrismaClient();

interface CreateUserRequest {
  prospectId: string;
  sendWelcomeEmail: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json();
    const { prospectId, sendWelcomeEmail } = body;

    // Hent prospect
    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
      include: { companies: true },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect ikke funnet' }, { status: 404 });
    }

    if (!prospect.email) {
      return NextResponse.json({ error: 'Prospect mangler e-postadresse' }, { status: 400 });
    }

    if (prospect.taxSystemUserId) {
      return NextResponse.json({ error: 'Bruker finnes allerede i tax.salestext.no' }, { status: 400 });
    }

    // Opprett bruker i tax.salestext.no
    const taxUser = await taxSystemAPI.createUser({
      email: prospect.email,
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      phone: prospect.phone || undefined,
      source: 'crm_import',
      prospectId: prospect.id,
      sendWelcomeEmail,
      bccEmail: CONFIG.EMAIL.BCC_EMAIL,
    });

    // Oppdater prospect med tax system bruker-ID
    await prisma.prospect.update({
      where: { id: prospectId },
      data: {
        taxSystemUserId: taxUser.id,
        taxSystemStatus: 'REGISTERED',
        status: 'IN_PROGRESS',
      },
    });

    // Logg aktivitet
    await prisma.activity.create({
      data: {
        prospectId,
        type: 'SYSTEM_EVENT',
        subject: 'Bruker opprettet i tax.salestext.no',
        description: `E-post sendt til ${prospect.email}. Bruker-ID: ${taxUser.id}`,
      },
    });

    // Send intern varsling
    await emailService.sendEmail({
      to: 'jgl@salestext.no',
      subject: `Ny bruker registrert: ${prospect.firstName} ${prospect.lastName}`,
      bodyHtml: `
        <h2>Ny bruker i tax.salestext.no</h2>
        <p><strong>Navn:</strong> ${prospect.firstName} ${prospect.lastName}</p>
        <p><strong>E-post:</strong> ${prospect.email}</p>
        <p><strong>Telefon:</strong> ${prospect.phone || 'Ikke oppgitt'}</p>
        <p><strong>Selskap:</strong> ${prospect.companies[0]?.companyName || 'Ikke angitt'}</p>
        <p><strong>Aksjekapital:</strong> ${prospect.companies[0]?.shareCapitalPaid ? Number(prospect.companies[0].shareCapitalPaid).toLocaleString('nb-NO') : 'Ikke oppgitt'} kr</p>
        <hr>
        <p><a href="https://crm.dtax.no/prospects/${prospect.id}">Åpne i CRM</a></p>
        <p><a href="https://tax.salestext.no/admin/users/${taxUser.id}">Åpne i tax.salestext.no</a></p>
      `,
    });

    return NextResponse.json({
      success: true,
      taxSystemUserId: taxUser.id,
      message: 'Bruker opprettet i tax.salestext.no',
    });
  } catch (error) {
    console.error('Feil ved oppretting av bruker:', error);
    return NextResponse.json(
      { error: 'Kunne ikke opprette bruker', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Hent status for en bruker i tax.salestext.no
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prospectId = searchParams.get('prospectId');

    if (!prospectId) {
      return NextResponse.json({ error: 'prospectId er påkrevd' }, { status: 400 });
    }

    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
    });

    if (!prospect?.taxSystemUserId) {
      return NextResponse.json({ registered: false });
    }

    // Hent status fra tax.salestext.no
    const taxUser = await taxSystemAPI.getUser(prospect.taxSystemUserId);
    const cases = await taxSystemAPI.getUserCases(prospect.taxSystemUserId);

    return NextResponse.json({
      registered: true,
      taxSystemUserId: prospect.taxSystemUserId,
      taxSystemStatus: prospect.taxSystemStatus,
      currentStep: prospect.currentStep,
      user: taxUser,
      cases,
    });
  } catch (error) {
    console.error('Feil ved henting av bruker:', error);
    return NextResponse.json(
      { error: 'Kunne ikke hente brukerstatus' },
      { status: 500 }
    );
  }
}
