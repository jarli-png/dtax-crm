import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// GET - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isSuperAdmin: true,
        resellerId: true,
        createdAt: true,
        lastLogin: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Bruker ikke funnet' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Kunne ikke hente bruker' }, { status: 500 });
  }
}

// PATCH - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { email, password, name, role, isActive, isSuperAdmin, resellerId } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Bruker ikke funnet' }, { status: 404 });
    }

    // If email is being changed, check it's not already in use
    if (email && email.toLowerCase() !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
      if (emailInUse) {
        return NextResponse.json({ error: 'E-postadressen er allerede i bruk' }, { status: 400 });
      }
    }

    // Build update data
    const updateData: any = {};
    if (email) updateData.email = email.toLowerCase();
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (typeof isSuperAdmin === 'boolean') updateData.isSuperAdmin = isSuperAdmin;
    if (resellerId !== undefined) updateData.resellerId = resellerId || null;

    // Hash new password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isSuperAdmin: true,
        resellerId: true,
        createdAt: true,
        lastLogin: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Kunne ikke oppdatere bruker' }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Kunne ikke slette bruker' }, { status: 500 });
  }
}
