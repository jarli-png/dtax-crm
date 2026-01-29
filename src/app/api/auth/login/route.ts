import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-post og passord er påkrevd' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json({ error: 'Ugyldig e-post eller passord' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Kontoen er deaktivert' }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Ugyldig e-post eller passord' }, { status: 401 });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Return user data (excluding password)
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      resellerId: user.resellerId
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Innlogging feilet' }, { status: 500 });
  }
}
