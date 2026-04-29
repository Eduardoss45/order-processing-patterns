import { createLogger } from './logger';
import { LogContext } from './context';

type ExtendedLogContext = LogContext & Record<string, unknown>;

export const buildLogger = (serviceName: string) => {
  const logger = createLogger(serviceName);

  return {
    info: (msg: string, ctx?: ExtendedLogContext) => logger.info({ ...ctx }, msg),

    error: (msg: string, ctx?: ExtendedLogContext) => logger.error({ ...ctx }, msg),

    warn: (msg: string, ctx?: ExtendedLogContext) => logger.warn({ ...ctx }, msg),
  };
};
