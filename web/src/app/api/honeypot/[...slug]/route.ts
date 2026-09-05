import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { recordThreatEvent } from '@/lib/security/threatDetector';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } | Promise<{ slug: string[] }> }
) {
  return handleHoneypot(request, await Promise.resolve(params));
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string[] } | Promise<{ slug: string[] }> }
) {
  return handleHoneypot(request, await Promise.resolve(params));
}

async function handleHoneypot(
  request: NextRequest,
  params: { slug: string[] }
) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const geoCountry = request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry') || 'PH';
  const geoCity = request.headers.get('x-vercel-ip-city') || 'Manila';
  const path = `/${(params.slug || []).join('/')}`;

  let bodySnippet = '';
  try {
    const cloned = request.clone();
    bodySnippet = await cloned.text();
  } catch {
    // ignore
  }

  // Record critical honeypot intrusion event
  await recordThreatEvent(supabaseAdmin, {
    threat_type: 'honeypot_trap',
    severity: 'critical',
    ip_address: ip,
    target_path: path,
    http_method: request.method,
    user_agent: userAgent,
    country_code: geoCountry,
    city: geoCity,
    payload_preview: bodySnippet ? { body: bodySnippet.slice(0, 1000) } : { query: request.nextUrl.search },
  });

  return NextResponse.json(
    { error: 'Not Found', status: 404 },
    { status: 404 }
  );
}
