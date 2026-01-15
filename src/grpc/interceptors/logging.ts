import type {
  ServerUnaryCall,
  sendUnaryData,
  handleUnaryCall,
  StatusObject,
  ServerErrorResponse,
} from '@grpc/grpc-js';
import { createLogger } from '../../config/logger.js';
import type pino from 'pino';

/**
 * Create a logging wrapper for a gRPC handler.
 * Logs request start, completion, and errors with timing information.
 */
export function withLogging<TRequest, TResponse>(
  methodName: string,
  handler: handleUnaryCall<TRequest, TResponse>
): handleUnaryCall<TRequest, TResponse> {
  const methodLogger = createLogger({ method: methodName });

  return (call: ServerUnaryCall<TRequest, TResponse>, callback: sendUnaryData<TResponse>): void => {
    const startTime = Date.now();
    const peer = call.getPeer();

    methodLogger.info({ peer }, 'Request received');

    // Wrap the callback to log completion
    const loggingCallback: sendUnaryData<TResponse> = (error, response) => {
      const duration = Date.now() - startTime;

      if (error) {
        const errorMessage = getErrorMessage(error);
        methodLogger.error({ peer, duration, error: errorMessage }, 'Request failed');
      } else {
        methodLogger.info({ peer, duration }, 'Request completed');
      }

      callback(error, response);
    };

    try {
      handler(call, loggingCallback);
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';
      methodLogger.error({ peer, duration, error: message }, 'Handler threw exception');
      callback({ code: 13, message, name: 'InternalError' }, null);
    }
  };
}

/**
 * Extract error message from gRPC error types.
 */
function getErrorMessage(error: Partial<StatusObject> | ServerErrorResponse): string {
  if ('message' in error && typeof error.message === 'string') {
    return error.message;
  }
  if ('details' in error && typeof error.details === 'string') {
    return error.details;
  }
  return 'Unknown error';
}

/**
 * Request context for logging.
 */
export interface RequestContext {
  logger: pino.Logger;
  startTime: number;
  peer: string;
}

/**
 * Extract request context from a gRPC call.
 */
export function getRequestContext(
  call: ServerUnaryCall<unknown, unknown>,
  methodName: string
): RequestContext {
  return {
    logger: createLogger({ method: methodName, peer: call.getPeer() }),
    startTime: Date.now(),
    peer: call.getPeer(),
  };
}
