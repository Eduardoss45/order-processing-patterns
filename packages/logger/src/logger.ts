import pino from 'pino';

export const createLogger = (serviceName: string) => {
  return pino({
    base: {
      service: serviceName,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
};
