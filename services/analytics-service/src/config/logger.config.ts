import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

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

  return WinstonModule.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: serviceName },
    transports: [
      // Console transport
      new winston.transports.Console({
        format: consoleFormat,
      }),
      
      // File transports with rotation
      new DailyRotateFile({
        filename: `logs/${serviceName}-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: logFormat,
      }),
      
      // Error log file
      new DailyRotateFile({
        filename: `logs/${serviceName}-error-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '30d',
        format: logFormat,
      }),
      
      // Debug log file (only in development)
      ...(process.env.NODE_ENV === 'development' ? [
        new DailyRotateFile({
          filename: `logs/${serviceName}-debug-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          level: 'debug',
          maxSize: '20m',
          maxFiles: '7d',
          format: logFormat,
        })
      ] : []),
    ],
  });
};

