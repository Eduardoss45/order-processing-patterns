const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
type RetryLogger = { warn: (msg: string, ctx?: Record<string, unknown>) => void };

export const withRetry = async <T>(
  operation: () => Promise<T>,
  logger: RetryLogger,
  label: string,
  attempts = 20,
  delayMs = 1500
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logger.warn('Dependency not ready, retrying bootstrap', {
        dependency: label,
        attempt,
        attempts,
      });
      await sleep(delayMs);
    }
  }

  throw lastError;
};
