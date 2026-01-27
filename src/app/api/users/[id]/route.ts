import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PATCH - Oppdater bruker (f.eks. toggle aktiv status)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: data.isActive },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        isActive: true,
        createdAt: true 
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Kunne ikke oppdatere bruker' }, { status: 500 });
  }
}

// DELETE - Slett bruker
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Forhindre sletting av egen bruker
    if (session.user.id === params.id) {
      return NextResponse.json({ error: 'Kan ikke slette egen bruker' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Kunne ikke slette bruker' }, { status: 500 });
  }
}
