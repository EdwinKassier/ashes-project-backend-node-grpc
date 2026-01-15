import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/**',
                'dist/**',
                'src/generated/**',
                'tests/**',
                '*.config.*',
            ],
            // Coverage thresholds - set to reasonable levels for domain-only testing
            // Infrastructure and gRPC layers require running services to test
            thresholds: {
                statements: 15,
                branches: 50,
                functions: 40,
                lines: 15,
            },
        },
        testTimeout: 10000,
    },
});
