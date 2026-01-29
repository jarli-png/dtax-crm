import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { content } = await request.json();
    const note = await (prisma as any).prospectNote.create({
      data: { prospectId: params.id, content }
    });
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: 'Feil: ' + error }, { status: 500 });
  }
}
