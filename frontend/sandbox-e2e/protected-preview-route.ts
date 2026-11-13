import type { APIResponse, BrowserContext } from '@playwright/test';

export const authorizedPreviewOrigin = 'https://zippy-frontend-preview-git-feat-p-d61403-gopi-nathan-s-projects.vercel.app';

export function requireAuthorizedPreviewOrigin(origin: string | undefined) {
  if (origin !== authorizedPreviewOrigin) throw new Error('BLOCKED: exact authorized preview origin is required.');
  return origin;
}

type BlockReason = 'FORBIDDEN_BROWSER_EGRESS' | 'FORBIDDEN_BROWSER_REDIRECT' | 'PROTECTED_REQUEST_FAILED';

// The credential is added to the server-side fetch only, never to a continued
// browser request. Playwright propagates route.continue header overrides across
// redirects. Fetch zero hops, reject every 3xx, then pass through the real response.
export async function installProtectedPreviewRouting(context: BrowserContext, options: {
  origin: string;
  automation: string;
  onBlocked: (reason: BlockReason) => void;
  loopbackTest?: boolean;
}) {
  const { origin, automation, onBlocked } = options;
  const parsed = new URL(origin);
  const localTest = options.loopbackTest && parsed.protocol === 'http:' && parsed.hostname === '127.0.0.1';
  if ((!localTest && origin !== authorizedPreviewOrigin) || parsed.origin !== origin
    || !automation || /[\r\n]/.test(automation)) throw new Error('BLOCKED: invalid protected routing configuration.');

  await context.route('**/*', async route => {
    let response: APIResponse | undefined;
    try {
      const url = new URL(route.request().url());
      if (url.origin !== origin || url.username || url.password) {
        onBlocked('FORBIDDEN_BROWSER_EGRESS');
        await route.abort('blockedbyclient');
        return;
      }
      const headers = await route.request().allHeaders();
      delete headers['x-vercel-protection-bypass'];
      response = await route.fetch({ headers: { ...headers, 'x-vercel-protection-bypass': automation },
        maxRedirects: 0, maxRetries: 0, timeout: 20000 });
      if (response.status() >= 300 && response.status() < 400) {
        onBlocked('FORBIDDEN_BROWSER_REDIRECT');
        await route.abort('blockedbyclient');
        return;
      }
      // No fabricated response, status or body: deliver the genuine upstream response.
      await route.fulfill({ response });
    } catch {
      // Playwright network errors can contain request headers. Never log/rethrow them.
      onBlocked('PROTECTED_REQUEST_FAILED');
      await route.abort('failed').catch(() => {});
    } finally {
      await response?.dispose().catch(() => {});
    }
  });
}