import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseExcelDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value === 'number') {
    return new Date((value - 25569) * 86400 * 1000);
  }
  // Prøv dd.mm.yyyy format
  if (typeof value === 'string' && value.includes('.')) {
    const [d, m, y] = value.split('.');
    return new Date(`${y}-${m}-${d}`);
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function parseNumber(value: any): number | null {
  if (!value) return null;
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''));
  return isNaN(num) ? null : num;
}

export async function POST(request: Request) {
  try {
    const { rows, mapping } = await request.json();
    if (!rows || !mapping) return NextResponse.json({ error: 'Mangler data' }, { status: 400 });
    
    let imported = 0;
    for (const row of rows) {
      let firstName = '', lastName = '';
      
      if (mapping.name && row[mapping.name]) {
        const parts = row[mapping.name].toString().trim().split(' ');
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ') || '';
      }
      if (mapping.firstName && row[mapping.firstName]) firstName = row[mapping.firstName].toString();
      if (mapping.lastName && row[mapping.lastName]) lastName = row[mapping.lastName].toString();
      
      if (!firstName && !lastName) continue;
      
      const company = mapping.company && row[mapping.company] ? row[mapping.company].toString() : null;
      const shareCapitalPaid = parseNumber(mapping.shareCapital && row[mapping.shareCapital]);
      const deletedDate = parseExcelDate(mapping.deletedDate && row[mapping.deletedDate]);
      
      await prisma.prospect.create({
        data: {
          firstName, lastName,
          email: mapping.email && row[mapping.email] ? row[mapping.email].toString() : null,
          phone: mapping.phone && row[mapping.phone] ? row[mapping.phone].toString() : null,
          phone2: mapping.phone2 && row[mapping.phone2] ? row[mapping.phone2].toString() : null,
          address: mapping.address && row[mapping.address] ? row[mapping.address].toString() : null,
          postalCode: mapping.postalCode && row[mapping.postalCode] ? row[mapping.postalCode].toString() : null,
          city: mapping.city && row[mapping.city] ? row[mapping.city].toString() : null,
          status: 'NEW', source: 'import',
          companies: company ? {
            create: {
              companyName: company,
              orgNumber: mapping.orgNumber && row[mapping.orgNumber] ? row[mapping.orgNumber].toString() : '',
              role: mapping.role && row[mapping.role] ? row[mapping.role].toString() : null,
              shareCapitalPaid,
              deletedDate,
              deletionReason: mapping.deletionReason && row[mapping.deletionReason] ? row[mapping.deletionReason].toString() : null,
              brrregUrl: mapping.brrregUrl && row[mapping.brrregUrl] ? row[mapping.brrregUrl].toString() : null
            }
          } : undefined
        }
      });
      imported++;
    }
    
    return NextResponse.json({ success: true, imported, total: rows.length });
  } catch (error) {
    return NextResponse.json({ error: 'Import feilet: ' + error }, { status: 500 });
  }
}
