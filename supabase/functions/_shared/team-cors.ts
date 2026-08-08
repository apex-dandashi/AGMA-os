// CORS لدوال الفريق الداخلية (تُستدعى من نظام ops في المتصفح عبر supabase-js).
// نعكس الترويسات التي يطلبها المتصفح بدل قائمة يدوية — مكتبة supabase-js
// تضيف ترويسات جديدة مع تحديثاتها (x-supabase-api-version كسرتنا مرة).
const ALLOWED_ORIGINS = new Set([
  'https://ops.agma.com.sa',
  'https://staging-ops.agma.com.sa',
  'http://localhost:3000',
  'http://localhost:3001',
]);

export function teamCors(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  const allowed = origin && ALLOWED_ORIGINS.has(origin)
    ? origin : 'https://ops.agma.com.sa';
  const requested = req.headers.get('access-control-request-headers');
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers':
      requested || 'authorization, apikey, content-type, x-client-info, x-supabase-api-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
  };
}
