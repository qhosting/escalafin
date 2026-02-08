/**
 * Jest Configuration
 * 
 * Configuración para tests unitarios y de integración
 */

import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
    // Path to your Next.js app
    dir: './',
});

const customJestConfig: Config = {
    // Setup files
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

    // Test environment
    testEnvironment: 'jest-environment-jsdom',

    // Module paths
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@/components/(.*)$': '<rootDir>/components/$1',
        '^@/lib/(.*)$': '<rootDir>/lib/$1',
        '^@/app/(.*)$': '<rootDir>/app/$1',
    },

    // Coverage configuration
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'app/**/*.{js,jsx,ts,tsx}',
        'components/**/*.{js,jsx,ts,tsx}',
        'lib/**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/.next/**',
        '!**/coverage/**',
        '!**/dist/**',
    ],
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
        },
    },

    // Test match patterns
    testMatch: [
        '**/__tests__/**/*.[jt]s?(x)',
        '**/?(*.)+(spec|test).[jt]s?(x)',
    ],

    // Ignore patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/.next/',
        '/dist/',
        '/coverage/',
    ],

    // Transform
    transform: {
        '^.+\\.(ts|tsx)$': ['@swc/jest', {
            jsc: {
                parser: {
                    syntax: 'typescript',
                    tsx: true,
                },
                transform: {
                    react: {
                        runtime: 'automatic',
                    },
                },
            },
        }],
    },

    // Module file extensions
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

    // Verbose output
    verbose: true,

    // Automatically clear mock calls and instances between every test
    clearMocks: true,

    // Reset mocks between tests
    resetMocks: true,

    // Restore mocks between tests
    restoreMocks: true,
};

export default createJestConfig(customJestConfig);
