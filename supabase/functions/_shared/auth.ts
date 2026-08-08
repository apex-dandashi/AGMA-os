// هوية المستخدم لدوال الفريق (verify_jwt = ON):
// بوابة Supabase تحققت من توقيع الرمز وانتهائه قبل تشغيل الدالة أصلاً —
// فنفك الحمولة مباشرة بدل نداء Auth ثانٍ (كان يعيد HTML بخلل توجيه داخلي).
// لا تستخدمه في دالة verify_jwt = false — لا ضمان توقيع هناك.
export function verifiedUserId(req: Request): string | null {
  const jwt = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64 + '='.repeat((4 - b64.length % 4) % 4)));
    return typeof payload?.sub === 'string' && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}
