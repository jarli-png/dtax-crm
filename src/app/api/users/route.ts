import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// GET - List all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
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
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Kunne ikke hente brukere' }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { email, password, name, role, isSuperAdmin, resellerId } = data;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'E-post, passord og navn er påkrevd' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'E-postadressen er allerede i bruk' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: role || 'ADMIN',
        isSuperAdmin: isSuperAdmin || false,
        resellerId: resellerId || null,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isSuperAdmin: true,
        resellerId: true,
        createdAt: true
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Kunne ikke opprette bruker' }, { status: 500 });
  }
}
