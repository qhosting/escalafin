
/**
 * @jest-environment node
 */
import { getTenantPrisma } from '@/lib/tenant-db';

// Mock de prisma
const mockQuery = jest.fn((args) => Promise.resolve(args));

jest.mock('@/lib/prisma', () => {
    const mPrisma = {
        $extends: jest.fn().mockImplementation((config) => {
            const client: any = {
                client: {
                    findMany: (args: any) => config.query.client.findMany({ args, query: mockQuery }),
                    count: (args: any) => config.query.client.count({ args, query: mockQuery }),
                    create: (args: any) => config.query.client.create({ args, query: mockQuery }),
                },
                loan: {
                    findMany: (args: any) => config.query.loan.findMany({ args, query: mockQuery }),
                }
            };
            return client;
        }),
    };
    return { prisma: mPrisma };
});

describe('Tenant Isolation (getTenantPrisma)', () => {
    const tenantId = 'test-tenant-123';
    let tenantPrisma: any;

    beforeEach(() => {
        tenantPrisma = getTenantPrisma(tenantId);
    });

    it('should inject tenantId into client.findMany where clause', async () => {
        expect(tenantPrisma).toBeDefined();
        expect(tenantPrisma.client).toBeDefined();

        const args = { where: { status: 'ACTIVE' } };
        await tenantPrisma.client.findMany(args);

        expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                status: 'ACTIVE',
                tenantId: tenantId
            }
        }));
    });

    it('should inject tenantId into client.create data', async () => {
        const args = { data: { firstName: 'Juan' } };
        await tenantPrisma.client.create(args);

        expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({
            data: {
                firstName: 'Juan',
                tenantId: tenantId
            }
        }));
    });

    it('should return base prisma if no tenantId is provided', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        // @ts-ignore
        const fallbackPrisma = getTenantPrisma(null);

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('tenantId'));
        consoleSpy.mockRestore();
    });
});
