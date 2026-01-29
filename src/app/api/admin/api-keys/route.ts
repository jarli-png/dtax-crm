import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateApiKey } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        isActive: true,
        expiresAt: true,
        lastUsedAt: true,
        usageCount: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      data: apiKeys.map(k => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        permissions: k.permissions,
        isActive: k.isActive,
        expiresAt: k.expiresAt?.toISOString() || null,
        lastUsedAt: k.lastUsedAt?.toISOString() || null,
        usageCount: k.usageCount,
        createdAt: k.createdAt.toISOString()
      }))
    });
    
  } catch (error) {
    console.error('API keys list error:', error);
    return NextResponse.json({ success: false, error: 'Kunne ikke hente API-nokler' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, permissions, expiresAt } = body;
    
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Navn er pakrevd (minst 2 tegn)' }, { status: 400 });
    }
    
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json({ success: false, error: 'Minst en tillatelse er pakrevd' }, { status: 400 });
    }
    
    const { key, prefix, hash } = generateApiKey();
    
    const apiKey = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        keyHash: hash,
        keyPrefix: prefix,
        permissions,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        expiresAt: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'API-nokkel opprettet. VIKTIG: Lagre nokkelen na!',
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: key,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt?.toISOString() || null,
        createdAt: apiKey.createdAt.toISOString()
      }
    });
    
  } catch (error) {
    console.error('API key creation error:', error);
    return NextResponse.json({ success: false, error: 'Kunne ikke opprette API-nokkel' }, { status: 500 });
  }
}
