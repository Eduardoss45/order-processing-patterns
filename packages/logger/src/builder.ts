import { createLogger } from './logger';
import { LogContext } from './context';

type ExtendedLogContext = LogContext & Record<string, unknown>;

export const buildLogger = (serviceName: string) => {
  const logger = createLogger(serviceName);

  return {
    info: <T extends Record<string, unknown> = {}>(msg: string, ctx?: LogContext & T) =>
      logger.info({ ...ctx }, msg),

    error: <T extends Record<string, unknown> = {}>(msg: string, ctx?: LogContext & T) =>
      logger.error({ ...ctx }, msg),

    warn: <T extends Record<string, unknown> = {}>(msg: string, ctx?: LogContext & T) =>
      logger.warn({ ...ctx }, msg),
  };
};
