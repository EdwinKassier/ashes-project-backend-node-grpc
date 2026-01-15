import { logger } from './config/logger.js';
import { settings } from './config/settings.js';
import { GrpcServer, AnalysisHandler } from './grpc/index.js';
import { AnalysisService } from './domain/services/analysis-service.js';
import {
  AnalysisRepository,
  getPrismaClient,
  disconnectPrisma,
} from './infrastructure/database/index.js';
import { KrakenClient } from './infrastructure/exchange/index.js';

/**
 * Application entry point.
 * Sets up dependency injection and starts the gRPC server.
 */
async function main(): Promise<void> {
  logger.info({ settings: { ...settings, database: { url: '***' } } }, 'Starting application');

  // Initialize infrastructure
  const prisma = getPrismaClient();
  const repository = new AnalysisRepository(prisma);
  const exchangeClient = new KrakenClient();

  // Initialize domain service with dependencies
  const analysisService = new AnalysisService(repository, exchangeClient);

  // Initialize gRPC handler
  const analysisHandler = new AnalysisHandler(analysisService);

  // Initialize and configure gRPC server
  const server = new GrpcServer();
  server.registerAnalysisService(analysisHandler);

  // Setup graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Received shutdown signal');

    await server.shutdown();
    await disconnectPrisma();

    logger.info('Application shut down gracefully');
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // Start the server
  try {
    await server.start();
    logger.info(
      { host: settings.server.host, port: settings.server.port },
      'gRPC server is ready to accept connections'
    );
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    await disconnectPrisma();
    process.exit(1);
  }
}

// Run the application
main().catch((error: unknown) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
