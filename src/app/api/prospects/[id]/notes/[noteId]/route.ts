import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: { id: string; noteId: string } }) {
  try {
    await (prisma as any).prospectNote.delete({ where: { id: params.noteId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Feil: ' + error }, { status: 500 });
  }
}
