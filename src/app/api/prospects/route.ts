import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const prospects = await prisma.prospect.findMany({
      include: { companies: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(prospects);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, phone2, address, postalCode, city, company } = body;
    
    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'Fornavn og etternavn er påkrevd' }, { status: 400 });
    }
    
    const prospect = await prisma.prospect.create({
      data: {
        firstName, lastName,
        email: email || null,
        phone: phone || null,
        phone2: phone2 || null,
        address: address || null,
        postalCode: postalCode || null,
        city: city || null,
        status: 'NEW',
        source: 'manual',
        companies: company?.companyName ? {
          create: {
            companyName: company.companyName,
            orgNumber: company.orgNumber || '',
            role: company.role || null,
            shareCapitalPaid: company.shareCapitalPaid || null,
            deletedDate: company.deletedDate ? new Date(company.deletedDate) : null,
            deletionReason: company.deletionReason || null
          }
        } : undefined
      },
      include: { companies: true }
    });
    
    return NextResponse.json(prospect);
  } catch (error) {
    return NextResponse.json({ error: 'Feil: ' + error }, { status: 500 });
  }
}
