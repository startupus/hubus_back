// import { WinstonModule } from 'nest-winston'; // Временно отключено
import * as winston from 'winston';
// import * as DailyRotateFile from 'winston-daily-rotate-file'; // Временно отключено

export const createLoggerConfig = (serviceName: string) => {
  const logFormat = winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        service: service || serviceName,
        message,
        ...meta,
      });
    })
  );

  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${timestamp} [${level}] ${service || serviceName}: ${message}${metaStr}`;
    })
  );

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: serviceName },
    transports: [
      // Console transport
      new winston.transports.Console({
        format: consoleFormat,
      }),
      
      // File transports (simplified without rotation)
      new winston.transports.File({
        filename: `logs/${serviceName}.log`,
        format: logFormat,
      }),
      
      // Error log file
      new winston.transports.File({
        filename: `logs/${serviceName}-error.log`,
        level: 'error',
        format: logFormat,
      }),
    ],
  });
};