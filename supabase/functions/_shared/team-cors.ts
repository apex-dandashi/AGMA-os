// CORS لدوال الفريق الداخلية (تُستدعى من نظام ops في المتصفح عبر
// supabase-js). بدون معالجة OPTIONS يفشل استطلاع المتصفح قبل الطلب الفعلي.
const ALLOWED_ORIGINS = new Set([
  'https://ops.agma.com.sa',
  'https://staging-ops.agma.com.sa',
  'http://localhost:3000',
  'http://localhost:3001',
]);

export function teamCors(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin)
    ? origin : 'https://ops.agma.com.sa';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}
