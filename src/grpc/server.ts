import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { settings } from '../config/settings.js';
import { logger } from '../config/logger.js';
import type { AnalysisHandler } from './handlers/analysis-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Proto loading options
const PROTO_OPTIONS: protoLoader.Options = {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

/**
 * gRPC Server instance wrapper.
 * Handles server lifecycle and service registration.
 */
export class GrpcServer {
  private server: grpc.Server;
  private isRunning = false;

  constructor() {
    this.server = new grpc.Server();
  }

  /**
   * Register the CryptoAnalysisService handlers.
   */
  registerAnalysisService(handler: AnalysisHandler): void {
    const protoPath = path.resolve(__dirname, '../../proto/api/v1/analysis.proto');

    const packageDefinition = protoLoader.loadSync(protoPath, PROTO_OPTIONS);
    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as unknown as {
      ashes: {
        api: {
          v1: {
            CryptoAnalysisService: grpc.ServiceClientConstructor;
          };
        };
      };
    };

    const service = protoDescriptor.ashes.api.v1.CryptoAnalysisService.service;

    this.server.addService(service, {
      analyze: (
        call: Parameters<typeof handler.analyze>[0],
        callback: Parameters<typeof handler.analyze>[1]
      ) => {
        void handler.analyze(call, callback);
      },
      getPriceHistory: (
        call: Parameters<typeof handler.getPriceHistory>[0],
        callback: Parameters<typeof handler.getPriceHistory>[1]
      ) => {
        void handler.getPriceHistory(call, callback);
      },
    });

    logger.info('Registered CryptoAnalysisService');
  }

  /**
   * Register gRPC Health Checking Protocol.
   */
  registerHealthCheck(): void {
    const healthProtoPath = path.resolve(__dirname, '../../proto/health/v1/health.proto');

    // Check if health proto exists, if not use embedded implementation
    try {
      const packageDefinition = protoLoader.loadSync(healthProtoPath, PROTO_OPTIONS);
      const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as unknown as {
        grpc: {
          health: {
            v1: {
              Health: grpc.ServiceClientConstructor;
            };
          };
        };
      };

      const service = protoDescriptor.grpc.health.v1.Health.service;

      this.server.addService(service, {
        check: (
          _call: grpc.ServerUnaryCall<{ service: string }, { status: number }>,
          callback: grpc.sendUnaryData<{ status: number }>
        ) => {
          // SERVING = 1
          callback(null, { status: 1 });
        },
        watch: (call: grpc.ServerWritableStream<{ service: string }, { status: number }>) => {
          // Send initial status and keep connection open
          call.write({ status: 1 });
        },
      });

      logger.info('Registered Health Check service');
    } catch {
      logger.warn('Health proto not found, skipping health check registration');
    }
  }

  /**
   * Start the gRPC server.
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    const address = `${settings.server.host}:${String(settings.server.port)}`;

    return new Promise((resolve, reject) => {
      this.server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error, port) => {
        if (error) {
          logger.error({ error }, 'Failed to bind server');
          reject(error);
          return;
        }

        this.isRunning = true;
        logger.info({ address, port }, 'gRPC server started');
        resolve();
      });
    });
  }

  /**
   * Gracefully shutdown the server.
   */
  async shutdown(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    return new Promise((resolve) => {
      this.server.tryShutdown(() => {
        this.isRunning = false;
        logger.info('gRPC server shut down');
        resolve();
      });
    });
  }

  /**
   * Force stop the server (for emergency shutdown).
   */
  forceShutdown(): void {
    this.server.forceShutdown();
    this.isRunning = false;
    logger.warn('gRPC server forcefully shut down');
  }
}
