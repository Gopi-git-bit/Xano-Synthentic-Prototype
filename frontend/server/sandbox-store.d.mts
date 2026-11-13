export function createSandboxStore(config: { url: string; token: string; key: Buffer; namespace: string; fetchImpl?: typeof fetch }): {
  create(id: string, value: object, ttlSeconds: number): Promise<void>;
  get(id: string): Promise<{ token: string; userId: number; organizationId: number; expiresAt: number } | null>;
  delete(id: string): Promise<void>;
  consume(bucket: string, limit: number, seconds: number): Promise<boolean>;
};
