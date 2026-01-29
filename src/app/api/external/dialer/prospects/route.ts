import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, logApiCall, apiError, apiSuccess } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  const validation = await validateApiKey(request, 'dialer:read');
  if (!validation.valid) {
    return apiError(validation.error || 'Autentiseringsfeil', 401);
  }
  
  try {
    const { searchParams } = new URL(request.url);
    
    const statusFilter = searchParams.get('status')?.split(',').map(s => s.trim().toUpperCase());
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');
    const hasPhone = searchParams.get('hasPhone') === 'true';
    const notCalledSince = searchParams.get('notCalledSince');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';
    
    const where: any = {};
    
    if (statusFilter && statusFilter.length > 0) {
      where.status = { in: statusFilter };
    }
    
    if (hasPhone) {
      where.phone = { not: null };
    }
    
    if (notCalledSince) {
      where.OR = [
        { lastCalledAt: null },
        { lastCalledAt: { lt: new Date(notCalledSince) } }
      ];
    }
    
    if (!statusFilter) {
      where.status = { notIn: ['LOST', 'CONVERTED'] };
    }
    
    const validSortFields = ['createdAt', 'lastCalledAt', 'updatedAt', 'firstName', 'lastName'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    
    const [prospects, total] = await Promise.all([
      prisma.prospect.findMany({
        where,
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
              companyName: true,
              orgNumber: true,
              shareCapitalPaid: true
            }
          }
        },
        orderBy: { [orderByField]: sortOrder },
        take: limit,
        skip: offset
      }),
      prisma.prospect.count({ where })
    ]);
    
    const formattedProspects = prospects.map(p => ({
      id: p.id,
      name: p.firstName + ' ' + p.lastName,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      phone2: p.phone2,
      email: p.email,
      status: p.status,
      lastCalledAt: p.lastCalledAt?.toISOString() || null,
      createdAt: p.createdAt.toISOString(),
      companies: p.companies.map(c => ({
        name: c.companyName,
        orgNumber: c.orgNumber,
        shareCapital: c.shareCapitalPaid ? Number(c.shareCapitalPaid) : null
      }))
    }));
    
    await logApiCall(validation.apiKey!.id, '/api/external/dialer/prospects', 'GET', 200, request, Date.now() - startTime);
    
    return apiSuccess({
      prospects: formattedProspects,
      pagination: { total, limit, offset, hasMore: offset + prospects.length < total }
    });
    
  } catch (error) {
    console.error('Dialer API error:', error);
    return apiError('Intern serverfeil', 500);
  }
}
