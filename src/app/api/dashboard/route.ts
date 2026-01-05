import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const prospects = await prisma.prospect.findMany({ include: { companies: true } });
    
    // Stats
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const stats = {
      totalProspects: prospects.length,
      newThisWeek: prospects.filter(p => new Date(p.createdAt) > weekAgo).length,
      inProgress: prospects.filter(p => ['IN_PROGRESS', 'STEP_1', 'STEP_2', 'STEP_3', 'STEP_4', 'STEP_5'].includes(p.status)).length,
      converted: prospects.filter(p => p.status === 'CONVERTED').length,
      totalShareCapital: prospects.reduce((sum, p) => sum + p.companies.reduce((s, c) => s + (Number(c.shareCapitalPaid) || 0), 0), 0),
      totalValue: 0
    };
    
    // Funnel med verdiberegning
    const funnelConfig = [
      { name: 'Nye', status: ['NEW'], probability: 5, color: 'bg-gray-400' },
      { name: 'Kontaktet', status: ['CONTACTED'], probability: 10, color: 'bg-blue-400' },
      { name: 'Kvalifisert', status: ['QUALIFIED'], probability: 25, color: 'bg-blue-500' },
      { name: 'I prosess', status: ['IN_PROGRESS', 'STEP_1', 'STEP_2'], probability: 40, color: 'bg-yellow-500' },
      { name: 'Steg 3-5', status: ['STEP_3', 'STEP_4', 'STEP_5'], probability: 60, color: 'bg-orange-500' },
      { name: 'Steg 6 (Sendt)', status: ['STEP_6'], probability: 90, color: 'bg-green-400' },
      { name: 'Konvertert', status: ['CONVERTED'], probability: 100, color: 'bg-green-600' },
    ];
    
    const funnel = funnelConfig.map(stage => {
      const stageProspects = prospects.filter(p => stage.status.includes(p.status));
      const shareCapital = stageProspects.reduce((sum, p) => 
        sum + p.companies.reduce((s, c) => s + (Number(c.shareCapitalPaid) || 0), 0), 0);
      const dtaxValue = shareCapital * 0.22 * 0.30; // 22% skattefordel * 30% provisjon
      return {
        name: stage.name,
        status: stage.status,
        count: stageProspects.length,
        value: dtaxValue,
        probability: stage.probability,
        color: stage.color
      };
    });
    
    stats.totalValue = funnel.reduce((s, f) => s + (f.value * f.probability / 100), 0);
    
    // Oppgaver
    let upcomingTasks: any[] = [];
    let overdueTasks: any[] = [];
    try {
      const allTasks = await (prisma as any).task.findMany({
        where: { completed: false },
        include: { prospect: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { dueDate: 'asc' }
      });
      overdueTasks = allTasks.filter((t: any) => new Date(t.dueDate) < now);
      upcomingTasks = allTasks.filter((t: any) => new Date(t.dueDate) >= now);
    } catch (e) {}
    
    return NextResponse.json({ stats, funnel, upcomingTasks, overdueTasks });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
