import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'Ingen fil' }, { status: 400 });
    
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    const columns = rows.length > 0 ? Object.keys(rows[0] as object) : [];
    
    return NextResponse.json({ columns, rows, total: rows.length });
  } catch (error) {
    return NextResponse.json({ error: 'Kunne ikke lese fil: ' + error }, { status: 500 });
  }
}
