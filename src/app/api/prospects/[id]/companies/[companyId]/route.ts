import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string; companyId: string } }) {
  try {
    const body = await request.json();
    const company = await prisma.prospectCompany.update({
      where: { id: params.companyId },
      data: {
        companyName: body.companyName,
        orgNumber: body.orgNumber,
        role: body.role,
        shareCapitalPaid: body.shareCapitalPaid,
        deletedDate: body.deletedDate ? new Date(body.deletedDate) : null,
        deletionReason: body.deletionReason,
        brrregUrl: body.brrregUrl
      }
    });
    return NextResponse.json(company);
  } catch (error) {
    return NextResponse.json({ error: 'Feil: ' + error }, { status: 500 });
  }
}
