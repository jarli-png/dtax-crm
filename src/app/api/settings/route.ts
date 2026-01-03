import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const result: Record<string, string> = {};
    settings.forEach(s => {
      result[s.key] = s.value;
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({});
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const settingsToSave = [
      { key: 'company_name', value: data.companyName },
      { key: 'email', value: data.email },
      { key: 'phone', value: data.phone },
      { key: 'address', value: data.address },
      { key: 'default_bcc', value: data.defaultBcc },
      { key: 'brevo_api_key', value: data.brevoApiKey },
      { key: 'tax_system_api_key', value: data.taxSystemApiKey },
      { key: 'tax_system_api_url', value: data.taxSystemApiUrl },
      { key: 'invoice_system_api_key', value: data.invoiceSystemApiKey },
      { key: 'invoice_system_api_url', value: data.invoiceSystemApiUrl },
    ];

    for (const setting of settingsToSave) {
      if (setting.value) {
        await prisma.setting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: { key: setting.key, value: setting.value }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
