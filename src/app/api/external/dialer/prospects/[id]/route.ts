import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, logApiCall, apiError, apiSuccess } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  const validation = await validateApiKey(request, 'dialer:read');
  if (!validation.valid) {
    return apiError(validation.error || 'Autentiseringsfeil', 401);
  }
  
  try {
    const prospect = await prisma.prospect.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        phone2: true,
        email: true,
        status: true,
        lastCalledAt: true,
        createdAt: true,
        updatedAt: true,
        companies: {
          select: {
            id: true,
            companyName: true,
            orgNumber: true,
            shareCapitalPaid: true
          }
        },
        notesList: {
          select: { id: true, content: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });
    
    if (!prospect) {
      return apiError('Prospect ikke funnet', 404);
    }
    
    await logApiCall(validation.apiKey!.id, '/api/external/dialer/prospects/' + params.id, 'GET', 200, request, Date.now() - startTime);
    
    return apiSuccess({
      id: prospect.id,
      name: prospect.firstName + ' ' + prospect.lastName,
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      phone: prospect.phone,
      phone2: prospect.phone2,
      email: prospect.email,
      status: prospect.status,
      lastCalledAt: prospect.lastCalledAt?.toISOString() || null,
      companies: prospect.companies.map(c => ({
        id: c.id,
        name: c.companyName,
        orgNumber: c.orgNumber,
        shareCapital: c.shareCapitalPaid ? Number(c.shareCapitalPaid) : null
      })),
      recentNotes: prospect.notesList.map(n => ({
        id: n.id,
        content: n.content,
        createdAt: n.createdAt.toISOString()
      }))
    });
    
  } catch (error) {
    console.error('Dialer API error:', error);
    return apiError('Intern serverfeil', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  const validation = await validateApiKey(request, 'dialer:write');
  if (!validation.valid) {
    return apiError(validation.error || 'Autentiseringsfeil', 401);
  }
  
  try {
    const body = await request.json();
    const { status, notes } = body;
    
    const existing = await prisma.prospect.findUnique({ where: { id: params.id } });
    if (!existing) {
      return apiError('Prospect ikke funnet', 404);
    }
    
    const validStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'IN_PROGRESS', 'STEP_1', 'STEP_2', 'STEP_3', 'STEP_4', 'STEP_5', 'STEP_6', 'CONVERTED', 'LOST'];
    if (status && !validStatuses.includes(status)) {
      return apiError('Ugyldig status', 400);
    }
    
    const updateData: any = {};
    if (status) updateData.status = status;
    
    const updated = await prisma.prospect.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, status: true, updatedAt: true }
    });
    
    if (notes && notes.trim()) {
      await prisma.prospectNote.create({
        data: {
          prospectId: params.id,
          content: '[Dialer: ' + validation.apiKey!.name + '] ' + notes.trim()
        }
      });
    }
    
    await logApiCall(validation.apiKey!.id, '/api/external/dialer/prospects/' + params.id, 'PATCH', 200, request, Date.now() - startTime);
    
    return apiSuccess({ id: updated.id, status: updated.status, updatedAt: updated.updatedAt.toISOString() });
    
  } catch (error) {
    console.error('Dialer API error:', error);
    return apiError('Intern serverfeil', 500);
  }
}
