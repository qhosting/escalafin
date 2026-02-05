/**
 * Jest Setup File
 * 
 * Configuración global para tests
 */

import '@testing-library/jest-dom';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Mock de next-auth
jest.mock('next-auth/next', () => ({
    getServerSession: jest.fn(),
}));

// Mock de Prisma Client
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        // Add more mocked methods as needed
    })),
}));

// Global test utilities
global.console = {
    ...console,
    error: jest.fn(), // Silence console.error in tests
    warn: jest.fn(),  // Silence console.warn in tests
};

// Cleanup after each test
afterEach(() => {
    jest.clearAllMocks();
});
