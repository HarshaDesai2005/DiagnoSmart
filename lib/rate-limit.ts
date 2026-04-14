import { AppError } from "@/lib/errors";

const windowMs = 60_000;
const limit = 10;
const store = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(identifier: string) {
  const now = Date.now();
  const existing = store.get(identifier);

  if (!existing || existing.resetAt < now) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (existing.count >= limit) {
    throw new AppError("Too many upload attempts. Please try again in a minute.", "RATE_LIMIT", 429);
  }

  existing.count += 1;
  store.set(identifier, existing);
}
