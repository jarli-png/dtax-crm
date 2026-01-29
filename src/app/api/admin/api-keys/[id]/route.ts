import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: params.id },
      include: {
        apiLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            endpoint: true,
            method: true,
            statusCode: true,
            requestIp: true,
            responseTime: true,
            createdAt: true
          }
        }
      }
    });
    
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API-nokkel ikke funnet' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        isActive: apiKey.isActive,
        expiresAt: apiKey.expiresAt?.toISOString() || null,
        lastUsedAt: apiKey.lastUsedAt?.toISOString() || null,
        usageCount: apiKey.usageCount,
        createdAt: apiKey.createdAt.toISOString(),
        recentLogs: apiKey.apiLogs.map(log => ({
          id: log.id,
          endpoint: log.endpoint,
          method: log.method,
          statusCode: log.statusCode,
          ip: log.requestIp,
          responseTime: log.responseTime,
          timestamp: log.createdAt.toISOString()
        }))
      }
    });
    
  } catch (error) {
    console.error('API key fetch error:', error);
    return NextResponse.json({ success: false, error: 'Kunne ikke hente API-nokkel' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { isActive, name, permissions } = body;
    
    const existing = await prisma.apiKey.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'API-nokkel ikke funnet' }, { status: 404 });
    }
    
    const updateData: any = {};
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (name && name.trim().length >= 2) updateData.name = name.trim();
    if (Array.isArray(permissions)) updateData.permissions = permissions;
    
    const updated = await prisma.apiKey.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, name: true, keyPrefix: true, permissions: true, isActive: true, updatedAt: true }
    });
    
    return NextResponse.json({ success: true, data: updated });
    
  } catch (error) {
    console.error('API key update error:', error);
    return NextResponse.json({ success: false, error: 'Kunne ikke oppdatere API-nokkel' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.apiKey.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'API-nokkel ikke funnet' }, { status: 404 });
    }
    
    await prisma.apiKey.delete({ where: { id: params.id } });
    
    return NextResponse.json({ success: true, message: 'API-nokkel slettet: ' + existing.name });
    
  } catch (error) {
    console.error('API key delete error:', error);
    return NextResponse.json({ success: false, error: 'Kunne ikke slette API-nokkel' }, { status: 500 });
  }
}
