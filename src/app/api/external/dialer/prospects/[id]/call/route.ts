import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey, logApiCall, apiError, apiSuccess } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  const validation = await validateApiKey(request, 'dialer:call');
  if (!validation.valid) {
    return apiError(validation.error || 'Autentiseringsfeil', 401);
  }
  
  try {
    const body = await request.json();
    const { outcome, duration, notes, callbackAt, newStatus } = body;
    
    const validOutcomes = ['ANSWERED', 'NO_ANSWER', 'BUSY', 'VOICEMAIL', 'INVALID_NUMBER', 'CALLBACK'];
    if (!outcome || !validOutcomes.includes(outcome)) {
      return apiError('outcome er pakrevd. Gyldige verdier: ' + validOutcomes.join(', '), 400);
    }
    
    const existing = await prisma.prospect.findUnique({ where: { id: params.id } });
    if (!existing) {
      return apiError('Prospect ikke funnet', 404);
    }
    
    let noteContent = '[Samtale via ' + validation.apiKey!.name + '] Utfall: ' + outcome;
    if (duration) noteContent += ' | Varighet: ' + duration + 's';
    if (notes && notes.trim()) noteContent += '\n' + notes.trim();
    
    const updateData: any = { lastCalledAt: new Date() };
    
    if (existing.status === 'NEW' && outcome === 'ANSWERED') {
      updateData.status = newStatus || 'CONTACTED';
    } else if (newStatus) {
      updateData.status = newStatus;
    }
    
    const [updated, note] = await prisma.$transaction([
      prisma.prospect.update({
        where: { id: params.id },
        data: updateData,
        select: { id: true, status: true, lastCalledAt: true }
      }),
      prisma.prospectNote.create({
        data: { prospectId: params.id, content: noteContent }
      })
    ]);
    
    if (outcome === 'CALLBACK' && callbackAt) {
      await prisma.task.create({
        data: {
          prospectId: params.id,
          title: 'Ring tilbake',
          description: 'Callback planlagt fra dialer. ' + (notes || ''),
          dueDate: new Date(callbackAt)
        }
      });
    }
    
    await logApiCall(validation.apiKey!.id, '/api/external/dialer/prospects/' + params.id + '/call', 'POST', 200, request, Date.now() - startTime);
    
    return apiSuccess({
      id: updated.id,
      status: updated.status,
      lastCalledAt: updated.lastCalledAt?.toISOString(),
      outcome,
      noteId: note.id
    });
    
  } catch (error) {
    console.error('Dialer API error:', error);
    return apiError('Intern serverfeil', 500);
  }
}
