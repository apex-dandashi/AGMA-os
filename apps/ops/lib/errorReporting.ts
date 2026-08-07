'use client';

import { SUPABASE_URL } from './publicConfig';

let installed = false;
let sent = 0;

function report(message: string, stack?: string) {
  if (sent >= 10) return; // per-session cap
  sent++;
  fetch(`${SUPABASE_URL}/functions/v1/client-errors`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      app: 'ops',
      message: message.slice(0, 500),
      stack: stack?.slice(0, 2000),
      url: window.location.pathname,
      ua: navigator.userAgent.slice(0, 300),
    }),
    keepalive: true,
  }).catch(() => {});
}

/** Install once from the app shell: uncaught errors + unhandled rejections. */
export function installErrorReporting() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', (e) => {
    report(e.message || 'window.onerror', e.error?.stack);
  });
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    report(
      reason instanceof Error ? reason.message : String(reason ?? 'unhandledrejection'),
      reason instanceof Error ? reason.stack : undefined
    );
  });
}
