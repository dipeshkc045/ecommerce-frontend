function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);

  const atobFn = (globalThis as unknown as { atob?: (s: string) => string }).atob;
  if (typeof atobFn === 'function') {
    return atobFn(padded);
  }

  const bufferCtor = (globalThis as unknown as { Buffer?: unknown }).Buffer as
    | { from: (data: string, encoding: string) => { toString: (enc: string) => string } }
    | undefined;
  if (bufferCtor?.from) {
    return bufferCtor.from(padded, 'base64').toString('binary');
  }

  throw new Error('No base64 decoder available');
}

export function jwtSubject(token: string | null | undefined): string | null {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const json = base64UrlDecode(parts[1]);
    const payload = JSON.parse(json) as unknown;
    const sub = (payload as { sub?: unknown }).sub;
    return typeof sub === 'string' && sub.length > 0 ? sub : null;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string | null | undefined): boolean {
  if (!token) return true;

  const parts = token.split('.');
  if (parts.length < 2) return true;

  try {
    const json = base64UrlDecode(parts[1]);
    const payload = JSON.parse(json) as { exp?: number };
    if (typeof payload.exp === 'number') {
      // Return true if expired (with 5-second buffer for clock skew)
      return Date.now() >= (payload.exp - 5) * 1000;
    }
    return false;
  } catch {
    return true;
  }
}

