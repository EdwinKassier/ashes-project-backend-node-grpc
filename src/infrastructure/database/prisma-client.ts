import { PrismaClient } from '@prisma/client';
import { settings } from '../../config/settings.js';
import { logger } from '../../config/logger.js';

let prismaClient: PrismaClient | null = null;

/**
 * Get the Prisma client singleton instance.
 * Creates a new instance if one doesn't exist.
 */
export function getPrismaClient(): PrismaClient {
  prismaClient ??= new PrismaClient({
    log: settings.log.level === 'debug' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
  return prismaClient;
}

/**
 * Disconnect from the database.
 * Should be called during graceful shutdown.
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
    logger.info('Disconnected from database');
  }
}
