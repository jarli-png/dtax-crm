import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from './prisma';

export type Permission = 'dialer:read' | 'dialer:write' | 'dialer:call';

export interface ApiKeyValidation {
  valid: boolean;
  apiKey?: {
    id: string;
    name: string;
    permissions: string[];
  };
  error?: string;
}

/**
 * Hash en API-nøkkel med SHA-256
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Generer en ny API-nøkkel
 * Format: dtax_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (40 tegn totalt)
 */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomPart = '';
  for (let i = 0; i < 32; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  const key = `dtax_${randomPart}`;
  const prefix = key.substring(0, 12); // dtax_XXXXXXX
  const hash = hashApiKey(key);
  
  return { key, prefix, hash };
}

/**
 * Valider API-nøkkel fra request header
 */
export async function validateApiKey(
  request: NextRequest,
  requiredPermission?: Permission
): Promise<ApiKeyValidation> {
  const apiKeyHeader = request.headers.get('X-API-Key');
  
  if (!apiKeyHeader) {
    return { valid: false, error: 'Mangler X-API-Key header' };
  }
  
  const keyHash = hashApiKey(apiKeyHeader);
  
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      name: true,
      permissions: true,
      isActive: true,
      expiresAt: true,
    }
  });
  
  if (!apiKey) {
    return { valid: false, error: 'Ugyldig API-nøkkel' };
  }
  
  if (!apiKey.isActive) {
    return { valid: false, error: 'API-nøkkel er deaktivert' };
  }
  
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: 'API-nøkkel har utløpt' };
  }
  
  if (requiredPermission && !apiKey.permissions.includes(requiredPermission)) {
    return { valid: false, error: `Mangler tillatelse: ${requiredPermission}` };
  }
  
  // Oppdater bruksstatistikk asynkront (ikke vent)
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 }
    }
  }).catch(console.error);
  
  return {
    valid: true,
    apiKey: {
      id: apiKey.id,
      name: apiKey.name,
      permissions: apiKey.permissions
    }
  };
}

/**
 * Logg API-kall
 */
export async function logApiCall(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  request: NextRequest,
  responseTime?: number
): Promise<void> {
  try {
    await prisma.apiLog.create({
      data: {
        apiKeyId,
        endpoint,
        method,
        statusCode,
        requestIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || null,
        responseTime
      }
    });
  } catch (error) {
    console.error('Feil ved logging av API-kall:', error);
  }
}

/**
 * Standard feilrespons for API
 */
export function apiError(message: string, status: number = 400): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

/**
 * Standard suksessrespons for API
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(
    { success: true, data },
    { status }
  );
}
