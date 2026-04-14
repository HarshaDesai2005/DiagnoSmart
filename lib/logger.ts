export function createRequestLogger(requestId: string) {
  const prefix = `[request:${requestId}]`;

  return {
    info(message: string, meta?: Record<string, unknown>) {
      console.info(prefix, message, meta ?? {});
    },
    error(message: string, meta?: Record<string, unknown>) {
      console.error(prefix, message, meta ?? {});
    },
  };
}
