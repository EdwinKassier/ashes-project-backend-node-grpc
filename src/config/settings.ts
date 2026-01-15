import { z } from 'zod';

/**
 * Application settings schema with Zod validation.
 * All configuration is loaded from environment variables.
 */
const settingsSchema = z.object({
  server: z.object({
    host: z.string().default('0.0.0.0'),
    port: z.coerce.number().int().positive().default(50051),
  }),
  database: z.object({
    url: z.string().min(1, 'DATABASE_URL is required'),
  }),
  kraken: z.object({
    baseUrl: z.string().url().default('https://api.kraken.com/0/public'),
    timeoutMs: z.coerce.number().int().positive().default(10000),
  }),
  log: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  }),
});

export type Settings = z.infer<typeof settingsSchema>;

/**
 * Parse and validate settings from environment variables.
 * Throws if required variables are missing or invalid.
 */
function loadSettings(): Settings {
  return settingsSchema.parse({
    server: {
      host: process.env.HOST,
      port: process.env.PORT,
    },
    database: {
      url: process.env.DATABASE_URL,
    },
    kraken: {
      baseUrl: process.env.KRAKEN_URL,
      timeoutMs: process.env.KRAKEN_TIMEOUT,
    },
    log: {
      level: process.env.LOG_LEVEL,
    },
  });
}

export const settings = loadSettings();
