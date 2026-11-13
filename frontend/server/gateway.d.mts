export type GatewayResult = { status: number; data: Record<string, unknown>; retryAfter?: number };
export function createGateway(options?: {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  now?: () => number;
}): (request: { method?: string; url: string; headers?: Headers; body?: unknown }) => Promise<GatewayResult>;
