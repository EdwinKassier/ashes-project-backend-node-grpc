import pino from 'pino';
import { settings } from './settings.js';

/**
 * Build Pino logger options based on environment.
 */
function buildLoggerOptions(): pino.LoggerOptions {
    const options: pino.LoggerOptions = {
        level: settings.log.level,
    };

    if (process.env['NODE_ENV'] !== 'production') {
        options.transport = {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        };
    }

    return options;
}

/**
 * Application logger using Pino.
 * Structured JSON logging for production, pretty printing for development.
 */
export const logger = pino(buildLoggerOptions());

/**
 * Create a child logger with additional context.
 */
export function createLogger(context: Record<string, unknown>): pino.Logger {
    return logger.child(context);
}
