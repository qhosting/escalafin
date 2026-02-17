/**
 * Servicio de Rutas de Cobranza Optimizadas
 * Q2 2026 - EscalaFin
 * 
 * Gestiona la creación, optimización y seguimiento de rutas de cobranza
 * para asesores y cobradores con priorización inteligente por mora.
 */

import { PrismaClient, RouteStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// TIPOS
// ============================================

export interface RouteVisit {
    clientId: string;
    loanId?: string;
    address: string;
    latitude?: number;
    longitude?: number;
    priority: number; // 1 = más urgente
    daysOverdue: number;
    amountDue: number;
    clientName: string;
    phone: string;
    notes?: string;
}

export interface OptimizedRoute {
    visits: RouteVisit[];
    totalDistance: number; // metros
    estimatedDuration: number; // segundos
    geometry?: string; // GeoJSON
}

export interface RouteFilters {
    advisorId?: string;
    tenantId: string;
    date?: Date;
    status?: RouteStatus;
    page?: number;
    limit?: number;
}

export interface CreateRouteInput {
    advisorId: string;
    tenantId: string;
    name: string;
    date: Date;
    clientIds?: string[];
    autoOptimize?: boolean;
    maxVisits?: number;
}

// ============================================
// SERVICIO PRINCIPAL
// ============================================

export const collectionRouteService = {

    /**
     * Obtener clientes con pagos vencidos para una ruta de cobranza
     */
    async getDelinquentClients(tenantId: string, options?: { minDaysOverdue?: number; maxClients?: number }) {
        const minDays = options?.minDaysOverdue ?? 1;
        const maxClients = options?.maxClients ?? 50;

        // Obtener préstamos activos con pagos vencidos
        const loans = await prisma.loan.findMany({
            where: {
                tenantId,
                status: 'ACTIVE',
                amortizationSchedule: {
                    some: {
                        isPaid: false,
                        paymentDate: {
                            lt: new Date(),
                        },
                    },
                },
            },
            include: {
                client: true,
                amortizationSchedule: {
                    where: {
                        isPaid: false,
                        paymentDate: {
                            lt: new Date(),
                        },
                    },
                    orderBy: {
                        paymentDate: 'asc',
                    },
                },
            },
            take: maxClients,
        });

        // Calcular prioridad basada en días de mora y monto
        const delinquentClients: RouteVisit[] = loans
            .map((loan) => {
                const oldestUnpaid = loan.amortizationSchedule[0];
                if (!oldestUnpaid) return null;

                const daysOverdue = Math.floor(
                    (Date.now() - new Date(oldestUnpaid.paymentDate).getTime()) / (1000 * 60 * 60 * 24)
                );

                if (daysOverdue < minDays) return null;

                const totalDue = loan.amortizationSchedule.reduce(
                    (sum, sched) => sum + Number(sched.totalPayment),
                    0
                );

                return {
                    clientId: loan.clientId,
                    loanId: loan.id,
                    address: loan.client.address ?? 'Sin dirección registrada',
                    priority: daysOverdue > 30 ? 1 : daysOverdue > 14 ? 2 : 3,
                    daysOverdue,
                    amountDue: totalDue,
                    clientName: `${loan.client.firstName} ${loan.client.lastName}`,
                    phone: loan.client.phone,
                    notes: `${loan.amortizationSchedule.length} pagos pendientes`,
                } as RouteVisit;
            })
            .filter(Boolean) as RouteVisit[];

        // Ordenar por prioridad (más urgente primero) y luego por monto
        delinquentClients.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return b.amountDue - a.amountDue;
        });

        return delinquentClients;
    },

    /**
     * Optimizar orden de visitas usando algoritmo del vecino más cercano
     * (Nearest Neighbor Heuristic para TSP simplificado)
     */
    optimizeRoute(visits: RouteVisit[]): OptimizedRoute {
        if (visits.length <= 1) {
            return {
                visits,
                totalDistance: 0,
                estimatedDuration: 0,
            };
        }

        // Separar visitas con y sin coordenadas
        const geoVisits = visits.filter(v => v.latitude && v.longitude);
        const noGeoVisits = visits.filter(v => !v.latitude || !v.longitude);

        let optimizedVisits: RouteVisit[] = [];

        if (geoVisits.length > 1) {
            // Algoritmo del vecino más cercano
            const visited = new Set<number>();
            let current = 0;
            visited.add(0);
            optimizedVisits.push(geoVisits[0]);

            while (visited.size < geoVisits.length) {
                let nearestIdx = -1;
                let nearestDist = Infinity;

                for (let i = 0; i < geoVisits.length; i++) {
                    if (visited.has(i)) continue;
                    const dist = haversineDistance(
                        geoVisits[current].latitude!,
                        geoVisits[current].longitude!,
                        geoVisits[i].latitude!,
                        geoVisits[i].longitude!
                    );
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestIdx = i;
                    }
                }

                if (nearestIdx >= 0) {
                    visited.add(nearestIdx);
                    optimizedVisits.push(geoVisits[nearestIdx]);
                    current = nearestIdx;
                }
            }
        } else {
            optimizedVisits = [...geoVisits];
        }

        // Agregar visitas sin coordenadas al final, ordenadas por prioridad
        noGeoVisits.sort((a, b) => a.priority - b.priority);
        optimizedVisits = [...optimizedVisits, ...noGeoVisits];

        // Calcular distancia total estimada
        let totalDistance = 0;
        for (let i = 1; i < optimizedVisits.length; i++) {
            const prev = optimizedVisits[i - 1];
            const curr = optimizedVisits[i];
            if (prev.latitude && prev.longitude && curr.latitude && curr.longitude) {
                totalDistance += haversineDistance(
                    prev.latitude, prev.longitude,
                    curr.latitude, curr.longitude
                );
            } else {
                totalDistance += 2000; // Estimado 2km cuando no hay coordenadas
            }
        }

        // Duración estimada: 15 min por visita + tiempo de viaje (30 km/h promedio en zona urbana)
        const travelTime = (totalDistance / 1000 / 30) * 3600; // en segundos
        const visitTime = optimizedVisits.length * 15 * 60; // 15 min por visita
        const estimatedDuration = Math.round(travelTime + visitTime);

        return {
            visits: optimizedVisits,
            totalDistance: Math.round(totalDistance),
            estimatedDuration,
        };
    },

    /**
     * Crear una ruta de cobranza
     */
    async createRoute(input: CreateRouteInput) {
        let visits: RouteVisit[];

        if (input.clientIds && input.clientIds.length > 0) {
            // Obtener info de clientes específicos
            const clients = await prisma.client.findMany({
                where: {
                    id: { in: input.clientIds },
                    tenantId: input.tenantId,
                },
                include: {
                    loans: {
                        where: { status: 'ACTIVE' },
                        include: {
                            amortizationSchedule: {
                                where: { isPaid: false },
                                orderBy: { paymentDate: 'asc' },
                            },
                        },
                    },
                },
            });

            visits = clients.map((client) => {
                const activeLoan = client.loans[0];
                const unpaidSchedules = activeLoan?.amortizationSchedule ?? [];
                const daysOverdue = unpaidSchedules.length > 0
                    ? Math.max(0, Math.floor((Date.now() - new Date(unpaidSchedules[0].paymentDate).getTime()) / (1000 * 60 * 60 * 24)))
                    : 0;

                return {
                    clientId: client.id,
                    loanId: activeLoan?.id,
                    address: client.address ?? 'Sin dirección',
                    priority: daysOverdue > 30 ? 1 : daysOverdue > 14 ? 2 : 3,
                    daysOverdue,
                    amountDue: unpaidSchedules.reduce((s, u) => s + Number(u.totalPayment), 0),
                    clientName: `${client.firstName} ${client.lastName}`,
                    phone: client.phone,
                } as RouteVisit;
            });
        } else {
            // Auto-detectar clientes morosos
            visits = await this.getDelinquentClients(input.tenantId, {
                maxClients: input.maxVisits ?? 20,
            });
        }

        // Optimizar la ruta si se solicita
        const optimized = input.autoOptimize ? this.optimizeRoute(visits) : { visits, totalDistance: 0, estimatedDuration: 0 };

        // Crear la ruta en BD
        const route = await prisma.collectionRoute.create({
            data: {
                advisorId: input.advisorId,
                name: input.name,
                date: input.date,
                status: 'PENDING',
                optimized: input.autoOptimize ?? false,
                distance: optimized.totalDistance,
                duration: optimized.estimatedDuration,
                tenantId: input.tenantId,
            },
        });

        // Crear las visitas asociadas
        const visitRecords = await Promise.all(
            optimized.visits.map((visit, index) =>
                prisma.collectionVisit.create({
                    data: {
                        clientId: visit.clientId,
                        advisorId: input.advisorId,
                        visitDate: input.date,
                        address: visit.address,
                        latitude: visit.latitude,
                        longitude: visit.longitude,
                        notes: visit.notes ?? `Prioridad: ${visit.priority} | Mora: ${visit.daysOverdue} días | Monto: $${visit.amountDue.toFixed(2)}`,
                        routeId: route.id,
                    },
                })
            )
        );

        return {
            route,
            visits: visitRecords,
            optimization: {
                totalDistance: optimized.totalDistance,
                estimatedDuration: optimized.estimatedDuration,
                totalVisits: optimized.visits.length,
            },
        };
    },

    /**
     * Actualizar estado de una ruta
     */
    async updateRouteStatus(routeId: string, status: RouteStatus) {
        return prisma.collectionRoute.update({
            where: { id: routeId },
            data: { status },
        });
    },

    /**
     * Registrar resultado de una visita
     */
    async recordVisitOutcome(
        visitId: string,
        data: {
            outcome: string;
            notes?: string;
            latitude?: number;
            longitude?: number;
            photoUrl?: string;
            promiseDate?: Date;
            promiseAmount?: number;
        }
    ) {
        const visit = await prisma.collectionVisit.update({
            where: { id: visitId },
            data: {
                outcome: data.outcome,
                notes: data.notes,
                latitude: data.latitude,
                longitude: data.longitude,
                photoUrl: data.photoUrl,
                promiseDate: data.promiseDate,
            },
            include: {
                client: true,
            },
        });

        // Si hay promesa de pago, crear registro
        if (data.promiseDate && data.promiseAmount) {
            // Buscar préstamo activo del cliente
            const activeLoan = await prisma.loan.findFirst({
                where: {
                    clientId: visit.clientId,
                    status: 'ACTIVE',
                },
            });

            if (activeLoan) {
                await prisma.promiseToPay.create({
                    data: {
                        loanId: activeLoan.id,
                        clientId: visit.clientId,
                        amount: data.promiseAmount,
                        promiseDate: data.promiseDate,
                        status: 'PENDING',
                        notes: data.notes,
                        collectionVisitId: visitId,
                        tenantId: visit.client.tenantId,
                    },
                });
            }
        }

        return visit;
    },

    /**
     * Obtener rutas de un asesor
     */
    async getRoutes(filters: RouteFilters) {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 10;

        const where: any = {
            tenantId: filters.tenantId,
        };
        if (filters.advisorId) where.advisorId = filters.advisorId;
        if (filters.status) where.status = filters.status;
        if (filters.date) {
            const startOfDay = new Date(filters.date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(filters.date);
            endOfDay.setHours(23, 59, 59, 999);
            where.date = { gte: startOfDay, lte: endOfDay };
        }

        const [routes, total] = await Promise.all([
            prisma.collectionRoute.findMany({
                where,
                include: {
                    advisor: { select: { id: true, firstName: true, lastName: true, email: true } },
                    visits: {
                        include: {
                            client: { select: { id: true, firstName: true, lastName: true, phone: true, address: true } },
                            promises: true,
                        },
                        orderBy: { visitDate: 'asc' },
                    },
                },
                orderBy: { date: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.collectionRoute.count({ where }),
        ]);

        return { routes, total, page, limit, totalPages: Math.ceil(total / limit) };
    },

    /**
     * Resumen de cobranza por período
     */
    async getCollectionSummary(tenantId: string, startDate: Date, endDate: Date) {
        const routes = await prisma.collectionRoute.findMany({
            where: {
                tenantId,
                date: { gte: startDate, lte: endDate },
            },
            include: {
                visits: {
                    include: {
                        promises: true,
                    },
                },
            },
        });

        const totalRoutes = routes.length;
        const completedRoutes = routes.filter(r => r.status === 'COMPLETED').length;
        const totalVisits = routes.reduce((s, r) => s + r.visits.length, 0);
        const completedVisits = routes.reduce(
            (s, r) => s + r.visits.filter(v => v.outcome).length, 0
        );
        const promises = routes.flatMap(r => r.visits.flatMap(v => v.promises));
        const fulfilledPromises = promises.filter(p => p.status === 'FULFILLED').length;
        const totalPromised = promises.reduce((s, p) => s + Number(p.amount), 0);

        return {
            totalRoutes,
            completedRoutes,
            routeCompletionRate: totalRoutes > 0 ? ((completedRoutes / totalRoutes) * 100).toFixed(1) : '0',
            totalVisits,
            completedVisits,
            visitCompletionRate: totalVisits > 0 ? ((completedVisits / totalVisits) * 100).toFixed(1) : '0',
            totalPromises: promises.length,
            fulfilledPromises,
            promiseFulfillmentRate: promises.length > 0 ? ((fulfilledPromises / promises.length) * 100).toFixed(1) : '0',
            totalPromised,
        };
    },
};

// ============================================
// UTILIDADES
// ============================================

/**
 * Distancia Haversine entre dos puntos geográficos (en metros)
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

export default collectionRouteService;
