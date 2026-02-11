import { prisma } from '@/lib/prisma';

interface TenantBackup {
    metadata: {
        tenantId: string;
        tenantName: string;
        tenantSlug: string;
        exportedAt: string;
        exportVersion: string;
    };
    tenant: any;
    users: any[];
    clients: any[];
    loans: any[];
    payments: any[];
    creditApplications: any[];
    systemConfig: any[];
    messageTemplates: any[];
    wahaConfig: any[];
    reportTemplates: any[];
    personalReferences: any[];
    guarantors: any[];
    collaterals: any[];
    creditScores: any[];
}

export class TenantBackupService {
    /**
     * Export all data from a tenant
     */
    static async exportTenant(tenantId: string): Promise<TenantBackup> {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                subscription: {
                    include: {
                        plan: true
                    }
                }
            }
        });

        if (!tenant) {
            throw new Error('Tenant not found');
        }

        // Export all related data
        const [
            users,
            clients,
            loans,
            payments,
            creditApplications,
            systemConfig,
            messageTemplates,
            wahaConfig,
            reportTemplates,
            personalReferences,
            guarantors,
            collaterals,
            creditScores
        ] = await Promise.all([
            prisma.user.findMany({ where: { tenantId } }),
            prisma.client.findMany({ where: { tenantId } }),
            prisma.loan.findMany({ where: { tenantId } }),
            prisma.payment.findMany({ where: { tenantId } }),
            prisma.creditApplication.findMany({ where: { tenantId } }),
            prisma.systemConfig.findMany({ where: { tenantId } }),
            prisma.messageTemplate.findMany({ where: { tenantId } }),
            prisma.wahaConfig.findMany({ where: { tenantId } }),
            prisma.reportTemplate.findMany({ where: { tenantId } }),
            prisma.personalReference.findMany({ where: { tenantId } }),
            prisma.guarantor.findMany({ where: { tenantId } }),
            prisma.collateral.findMany({ where: { tenantId } }),
            prisma.creditScore.findMany({ where: { tenantId } })
        ]);

        return {
            metadata: {
                tenantId: tenant.id,
                tenantName: tenant.name,
                tenantSlug: tenant.slug,
                exportedAt: new Date().toISOString(),
                exportVersion: '1.0.0'
            },
            tenant,
            users,
            clients,
            loans,
            payments,
            creditApplications,
            systemConfig,
            messageTemplates,
            wahaConfig,
            reportTemplates,
            personalReferences,
            guarantors,
            collaterals,
            creditScores
        };
    }

    /**
     * Import data to a tenant (WARNING: This will DELETE existing data)
     */
    static async importTenant(tenantId: string, backup: TenantBackup, options?: {
        skipUsers?: boolean;
        skipClients?: boolean;
        skipLoans?: boolean;
        skipPayments?: boolean;
        overwriteTenantConfig?: boolean;
    }): Promise<void> {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });

        if (!tenant) {
            throw new Error('Target tenant not found');
        }

        // Use transaction for data integrity
        await prisma.$transaction(async (tx) => {
            // Delete existing data (in correct order to respect foreign keys)
            await tx.payment.deleteMany({ where: { tenantId } });
            await tx.loan.deleteMany({ where: { tenantId } });
            await tx.creditApplication.deleteMany({ where: { tenantId } });
            await tx.creditScore.deleteMany({ where: { tenantId } });
            await tx.collateral.deleteMany({ where: { tenantId } });
            await tx.guarantor.deleteMany({ where: { tenantId } });
            await tx.personalReference.deleteMany({ where: { tenantId } });
            await tx.client.deleteMany({ where: { tenantId } });

            if (!options?.skipUsers) {
                await tx.user.deleteMany({ where: { tenantId } });
            }

            await tx.reportTemplate.deleteMany({ where: { tenantId } });
            await tx.wahaConfig.deleteMany({ where: { tenantId } });
            await tx.messageTemplate.deleteMany({ where: { tenantId } });
            await tx.systemConfig.deleteMany({ where: { tenantId } });

            // Update tenant config if requested
            if (options?.overwriteTenantConfig && backup.tenant) {
                await tx.tenant.update({
                    where: { id: tenantId },
                    data: {
                        name: backup.tenant.name,
                        logo: backup.tenant.logo,
                        primaryColor: backup.tenant.primaryColor,
                        timezone: backup.tenant.timezone
                    }
                });
            }

            // Import data (update tenantId to target tenant)
            if (!options?.skipUsers && backup.users.length > 0) {
                for (const user of backup.users) {
                    const { id, createdAt, updatedAt, tenantId: _, ...userData } = user;
                    await tx.user.create({
                        data: {
                            ...userData,
                            tenantId
                        }
                    });
                }
            }

            // Import clients
            if (!options?.skipClients && backup.clients.length > 0) {
                for (const client of backup.clients) {
                    const { id, createdAt, updatedAt, tenantId: _, ...clientData } = client;
                    await tx.client.create({
                        data: {
                            ...clientData,
                            tenantId
                        }
                    });
                }
            }

            // Import system config
            if (backup.systemConfig.length > 0) {
                for (const config of backup.systemConfig) {
                    const { id, createdAt, updatedAt, tenantId: _, ...configData } = config;
                    await tx.systemConfig.create({
                        data: {
                            ...configData,
                            tenantId
                        }
                    });
                }
            }

            // Import message templates
            if (backup.messageTemplates.length > 0) {
                for (const template of backup.messageTemplates) {
                    const { id, createdAt, updatedAt, tenantId: _, ...templateData } = template;
                    await tx.messageTemplate.create({
                        data: {
                            ...templateData,
                            tenantId
                        }
                    });
                }
            }

            // Import waha config
            if (backup.wahaConfig.length > 0) {
                for (const config of backup.wahaConfig) {
                    const { id, createdAt, updatedAt, tenantId: _, ...configData } = config;
                    await tx.wahaConfig.create({
                        data: {
                            ...configData,
                            tenantId
                        }
                    });
                }
            }

            // Import report templates
            if (backup.reportTemplates.length > 0) {
                for (const template of backup.reportTemplates) {
                    const { id, createdAt, updatedAt, tenantId: _, ...templateData } = template;
                    await tx.reportTemplate.create({
                        data: {
                            ...templateData,
                            tenantId
                        }
                    });
                }
            }

            // Import loans (if not skipped)
            if (!options?.skipLoans && backup.loans.length > 0) {
                for (const loan of backup.loans) {
                    const { id, createdAt, updatedAt, tenantId: _, ...loanData } = loan;
                    await tx.loan.create({
                        data: {
                            ...loanData,
                            tenantId
                        }
                    });
                }
            }

            // Import payments (if not skipped)
            if (!options?.skipPayments && backup.payments.length > 0) {
                for (const payment of backup.payments) {
                    const { id, createdAt, updatedAt, tenantId: _, ...paymentData } = payment;
                    await tx.payment.create({
                        data: {
                            ...paymentData,
                            tenantId
                        }
                    });
                }
            }

            // Import credit applications
            if (backup.creditApplications.length > 0) {
                for (const app of backup.creditApplications) {
                    const { id, createdAt, updatedAt, tenantId: _, ...appData } = app;
                    await tx.creditApplication.create({
                        data: {
                            ...appData,
                            tenantId
                        }
                    });
                }
            }

            // Import personal references
            if (backup.personalReferences.length > 0) {
                for (const ref of backup.personalReferences) {
                    const { id, createdAt, updatedAt, tenantId: _, ...refData } = ref;
                    await tx.personalReference.create({
                        data: {
                            ...refData,
                            tenantId
                        }
                    });
                }
            }

            // Import guarantors
            if (backup.guarantors.length > 0) {
                for (const guarantor of backup.guarantors) {
                    const { id, createdAt, updatedAt, tenantId: _, ...guarantorData } = guarantor;
                    await tx.guarantor.create({
                        data: {
                            ...guarantorData,
                            tenantId
                        }
                    });
                }
            }

            // Import collaterals
            if (backup.collaterals.length > 0) {
                for (const collateral of backup.collaterals) {
                    const { id, createdAt, updatedAt, tenantId: _, ...collateralData } = collateral;
                    await tx.collateral.create({
                        data: {
                            ...collateralData,
                            tenantId
                        }
                    });
                }
            }

            // Import credit scores
            if (backup.creditScores.length > 0) {
                for (const score of backup.creditScores) {
                    const { id, createdAt, updatedAt, tenantId: _, ...scoreData } = score;
                    await tx.creditScore.create({
                        data: {
                            ...scoreData,
                            tenantId
                        }
                    });
                }
            }
        });
    }

    /**
     * Get backup statistics
     */
    static getBackupStats(backup: TenantBackup) {
        return {
            tenantName: backup.metadata.tenantName,
            exportedAt: backup.metadata.exportedAt,
            counts: {
                users: backup.users.length,
                clients: backup.clients.length,
                loans: backup.loans.length,
                payments: backup.payments.length,
                creditApplications: backup.creditApplications.length,
                systemConfig: backup.systemConfig.length,
                messageTemplates: backup.messageTemplates.length,
                wahaConfig: backup.wahaConfig.length,
                reportTemplates: backup.reportTemplates.length,
                personalReferences: backup.personalReferences.length,
                guarantors: backup.guarantors.length,
                collaterals: backup.collaterals.length,
                creditScores: backup.creditScores.length
            }
        };
    }
}
