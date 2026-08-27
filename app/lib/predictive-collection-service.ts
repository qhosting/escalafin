/**
 * Servicio de IA Predictiva para Cobranza y Rutas Inteligentes
 * EscalaFin - Q4 2026
 * 
 * Analiza el comportamiento histórico de acreditados (horas de pago, promesas cumplidas,
 * mora, tipo de ocupación y geolocalización) para generar itinerarios de visita
 * con máxima probabilidad de contacto y recuperación.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// TIPOS E INTERFACES
// ============================================

export type TimeSlotWindow = 'MORNING' | 'MIDDAY' | 'EVENING' | 'FLEXIBLE';

export interface ContactWindowRecommendation {
    window: TimeSlotWindow;
    label: string;
    suggestedTime: string; // ej. "09:30 AM"
    confidence: number; // 0 - 100%
    reasons: string[];
    historicalPaymentCount: number;
    preferredDays: string[];
}

export interface RecoveryScoringFactor {
    name: string;
    impact: number; // positivo o negativo
    description: string;
}

export interface RecoveryScoringResult {
    score: number; // 0 - 100
    level: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
    color: string;
    factors: RecoveryScoringFactor[];
    estimatedRecoveryAmount: number;
    urgencyDays: number;
}

export interface PredictiveCandidate {
    clientId: string;
    clientName: string;
    phone: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    loanId: string;
    loanNumber?: string;
    amountDue: number;
    daysOverdue: number;
    unpaidInstallments: number;
    totalLoanBalance: number;
    scoring: RecoveryScoringResult;
    contactWindow: ContactWindowRecommendation;
    lastPaymentDate: Date | null;
    employmentType: string | null;
    notes?: string;
}

export interface ScheduledVisit extends PredictiveCandidate {
    order: number;
    scheduledTimeStart: string; // "09:15 AM"
    scheduledTimeEnd: string;   // "09:40 AM"
    distanceFromPrevMeters: number;
    travelMinutesFromPrev: number;
}

export interface PredictiveOptimizedRoute {
    visits: ScheduledVisit[];
    totalDistanceMeters: number;
    totalDistanceKm: number;
    totalDurationMinutes: number;
    totalExpectedRecovery: number;
    totalDebtInRoute: number;
    averageRecoveryScore: number;
    itinerary: {
        time: string;
        action: string;
        clientName: string;
        address: string;
        amount: number;
        score: number;
    }[];
}

export interface GenerateAIRouteOptions {
    tenantId: string;
    advisorId: string;
    name: string;
    date: Date;
    maxVisits?: number;
    startTime?: string; // "08:30"
    startLocation?: { latitude: number; longitude: number };
    targetClientIds?: string[];
    minRecoveryScore?: number;
}

// ============================================
// HELPERS GEO Y MATRICES
// ============================================

export function calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}

// ============================================
// MOTOR DE PREDICCIÓN Y SCORING
// ============================================

export const predictiveCollectionService = {

    /**
     * Predice la mejor ventana horaria de contacto para un cliente
     * basándose en horas de pagos pasados, visitas previas y perfil laboral.
     */
    async predictBestContactWindow(
        clientId: string,
        clientData?: { employmentType?: string | null; address?: string | null }
    ): Promise<ContactWindowRecommendation> {
        // 1. Obtener pagos históricos del cliente
        const pastPayments = await prisma.payment.findMany({
            where: {
                loan: { clientId },
                status: 'COMPLETED',
            },
            select: {
                paymentDate: true,
                createdAt: true,
                amount: true,
            },
            take: 20,
            orderBy: { paymentDate: 'desc' },
        });

        // 2. Obtener visitas de cobranza exitosas anteriores
        const pastVisits = await prisma.collectionVisit.findMany({
            where: {
                clientId,
                outcome: { not: null },
            },
            select: {
                visitDate: true,
                outcome: true,
                createdAt: true,
            },
            take: 10,
        });

        const morningHours: number[] = [];
        const middayHours: number[] = [];
        const eveningHours: number[] = [];
        const daysFrequency: Record<number, number> = {};

        const reasons: string[] = [];

        // Analizar horas de pagos
        for (const p of pastPayments) {
            const date = new Date(p.createdAt || p.paymentDate);
            const hour = date.getHours();
            const day = date.getDay();
            daysFrequency[day] = (daysFrequency[day] || 0) + 1;

            if (hour >= 8 && hour < 12) morningHours.push(hour);
            else if (hour >= 12 && hour < 16) middayHours.push(hour);
            else if (hour >= 16 && hour <= 20) eveningHours.push(hour);
        }

        // Analizar horas de visitas efectivas
        for (const v of pastVisits) {
            const date = new Date(v.visitDate || v.createdAt);
            const hour = date.getHours();
            const outcomeLower = (v.outcome || '').toLowerCase();
            const isPositive = outcomeLower.includes('cobro') || outcomeLower.includes('pago') || outcomeLower.includes('promesa');

            if (isPositive) {
                if (hour >= 8 && hour < 12) morningHours.push(hour);
                else if (hour >= 12 && hour < 16) middayHours.push(hour);
                else if (hour >= 16 && hour <= 20) eveningHours.push(hour);
            }
        }

        const totalRecordedEvents = morningHours.length + middayHours.length + eveningHours.length;

        let window: TimeSlotWindow = 'FLEXIBLE';
        let label = 'Horario Flexible (09:00 - 18:00)';
        let suggestedTime = '10:30 AM';
        let confidence = 50;

        if (totalRecordedEvents >= 2) {
            if (morningHours.length >= middayHours.length && morningHours.length >= eveningHours.length) {
                window = 'MORNING';
                label = 'Mañana (08:30 - 11:30)';
                suggestedTime = '09:30 AM';
                confidence = Math.min(95, Math.round(55 + (morningHours.length / totalRecordedEvents) * 40));
                reasons.push(`${morningHours.length} transacciones/visitas exitosas registradas por la mañana.`);
            } else if (eveningHours.length >= middayHours.length) {
                window = 'EVENING';
                label = 'Tarde / Regreso (16:00 - 19:00)';
                suggestedTime = '17:15 PM';
                confidence = Math.min(95, Math.round(55 + (eveningHours.length / totalRecordedEvents) * 40));
                reasons.push(`${eveningHours.length} pagos realizados al finalizar jornada laboral (tarde).`);
            } else {
                window = 'MIDDAY';
                label = 'Mediodía (12:00 - 15:00)';
                suggestedTime = '13:30 PM';
                confidence = Math.min(90, Math.round(50 + (middayHours.length / totalRecordedEvents) * 35));
                reasons.push(`Patrón de contacto favorable en horario de almuerzo / mediodía.`);
            }
        } else {
            // Heurística basada en tipo de empleo
            const emp = clientData?.employmentType;
            if (emp === 'BUSINESS_OWNER' || emp === 'SELF_EMPLOYED') {
                window = 'MORNING';
                label = 'Mañana (Apertura de Negocio 09:00 - 11:30)';
                suggestedTime = '10:00 AM';
                confidence = 65;
                reasons.push('Perfil de negocio/comercio independiente: mayor disponibilidad matutina.');
            } else if (emp === 'EMPLOYED' || emp === 'GOVERNMENT') {
                window = 'EVENING';
                label = 'Tarde (Salida de Trabajo 16:30 - 19:00)';
                suggestedTime = '17:30 PM';
                confidence = 65;
                reasons.push('Empleado con jornada fija: mejor probabilidad de encuentro al terminar turno.');
            } else {
                window = 'MORNING';
                label = 'Mañana Estándar (09:00 - 12:00)';
                suggestedTime = '10:15 AM';
                confidence = 50;
                reasons.push('Sin historial suficiente: asignada franja matutina estándar con mayor tasa general.');
            }
        }

        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const preferredDays = Object.entries(daysFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([day]) => dayNames[Number(day)]);

        return {
            window,
            label,
            suggestedTime,
            confidence,
            reasons,
            historicalPaymentCount: pastPayments.length,
            preferredDays: preferredDays.length > 0 ? preferredDays : ['Lunes', 'Viernes'],
        };
    },

    /**
     * Calcula el Recovery Probability Score (0-100%) y factores de ponderación
     */
    calculateRecoveryProbability(params: {
        daysOverdue: number;
        amountDue: number;
        creditScore?: number | null;
        totalLoanBalance: number;
        fulfilledPromisesCount: number;
        brokenPromisesCount: number;
        completedInstallmentsCount: number;
        totalInstallmentsCount: number;
    }): RecoveryScoringResult {
        let score = 50; // Base inicial
        const factors: RecoveryScoringFactor[] = [];

        // 1. Días de Mora (Impacto crítico)
        if (params.daysOverdue <= 5) {
            score += 35;
            factors.push({ name: 'Mora Temprana', impact: +35, description: `Mora de solo ${params.daysOverdue} días (alta recuperabilidad).` });
        } else if (params.daysOverdue <= 15) {
            score += 20;
            factors.push({ name: 'Mora Moderada', impact: +20, description: `Mora de ${params.daysOverdue} días dentro de ventana recuperable.` });
        } else if (params.daysOverdue <= 30) {
            score -= 10;
            factors.push({ name: 'Mora Media', impact: -10, description: `${params.daysOverdue} días de atraso: requiere gestión presencial firme.` });
        } else if (params.daysOverdue <= 60) {
            score -= 25;
            factors.push({ name: 'Mora Prolongada', impact: -25, description: `Mora severa de ${params.daysOverdue} días: alto riesgo de incobrabilidad.` });
        } else {
            score -= 40;
            factors.push({ name: 'Cartera Castigada', impact: -40, description: `Mora superior a 60 días (${params.daysOverdue} días).` });
        }

        // 2. Historial de Promesas de Pago
        if (params.fulfilledPromisesCount > 0 && params.brokenPromisesCount === 0) {
            score += 15;
            factors.push({ name: 'Promesas Cumplidas', impact: +15, description: 'Historial impecable de cumplimiento en promesas anteriores.' });
        } else if (params.brokenPromisesCount > 0) {
            const penalty = Math.min(25, params.brokenPromisesCount * 10);
            score -= penalty;
            factors.push({ name: 'Promesas Incumplidas', impact: -penalty, description: `${params.brokenPromisesCount} promesa(s) de pago rota(s) previa(s).` });
        }

        // 3. Progreso de Pago del Crédito
        if (params.totalInstallmentsCount > 0) {
            const progressRatio = params.completedInstallmentsCount / params.totalInstallmentsCount;
            if (progressRatio >= 0.5) {
                score += 15;
                factors.push({ name: 'Crédito Avanzado', impact: +15, description: `Ha liquidado más del ${Math.round(progressRatio * 100)}% de sus cuotas.` });
            } else if (progressRatio >= 0.2) {
                score += 5;
                factors.push({ name: 'Avance Regular', impact: +5, description: `Avance del ${Math.round(progressRatio * 100)}% del préstamo.` });
            }
        }

        // 4. Score de Buró / Crédito Interno
        if (params.creditScore) {
            if (params.creditScore >= 650) {
                score += 10;
                factors.push({ name: 'Buen Score Crediticio', impact: +10, description: `Score de ${params.creditScore} pts.` });
            } else if (params.creditScore < 500) {
                score -= 10;
                factors.push({ name: 'Bajo Score Crediticio', impact: -10, description: `Score de ${params.creditScore} pts.` });
            }
        }

        // Normalizar score entre 5 y 98
        score = Math.max(5, Math.min(98, score));

        let level: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL' = 'MEDIUM';
        let color = '#3B82F6'; // Blue

        if (score >= 75) {
            level = 'HIGH';
            color = '#10B981'; // Green
        } else if (score >= 50) {
            level = 'MEDIUM';
            color = '#3B82F6'; // Blue
        } else if (score >= 30) {
            level = 'LOW';
            color = '#F59E0B'; // Amber
        } else {
            level = 'CRITICAL';
            color = '#EF4444'; // Red
        }

        const recoveryRate = score / 100;
        const estimatedRecoveryAmount = Math.round(params.amountDue * recoveryRate);

        return {
            score,
            level,
            color,
            factors,
            estimatedRecoveryAmount,
            urgencyDays: params.daysOverdue,
        };
    },

    /**
     * Obtiene los candidatos morosos de un tenant con scoring y ventana de contacto por IA
     */
    async getPredictiveCandidates(
        tenantId: string,
        options?: { minDaysOverdue?: number; maxCandidates?: number; advisorId?: string }
    ): Promise<PredictiveCandidate[]> {
        const minDays = options?.minDaysOverdue ?? 1;
        const maxCandidates = options?.maxCandidates ?? 50;

        const whereLoan: any = {
            tenantId,
            status: 'ACTIVE',
            amortizationSchedule: {
                some: {
                    isPaid: false,
                    paymentDate: { lt: new Date() },
                },
            },
        };

        if (options?.advisorId) {
            whereLoan.client = { asesorId: options.advisorId };
        }

        const loans = await prisma.loan.findMany({
            where: whereLoan,
            include: {
                client: true,
                promises: true,
                amortizationSchedule: {
                    orderBy: { paymentDate: 'asc' },
                },
            },
            take: maxCandidates,
        });

        const candidates: PredictiveCandidate[] = [];

        for (const loan of loans) {
            const client = loan.client;
            const unpaidSchedules = loan.amortizationSchedule.filter(s => !s.isPaid && new Date(s.paymentDate) < new Date());
            if (unpaidSchedules.length === 0) continue;

            const oldestUnpaid = unpaidSchedules[0];
            const daysOverdue = Math.max(
                1,
                Math.floor((Date.now() - new Date(oldestUnpaid.paymentDate).getTime()) / (1000 * 60 * 60 * 24))
            );

            if (daysOverdue < minDays) continue;

            const amountDue = unpaidSchedules.reduce((sum, s) => sum + Number(s.totalPayment), 0);
            const completedCount = loan.amortizationSchedule.filter(s => s.isPaid).length;
            const totalCount = loan.amortizationSchedule.length;

            const fulfilledPromises = loan.promises.filter(p => p.status === 'FULFILLED').length;
            const brokenPromises = loan.promises.filter(p => p.status === 'BROKEN').length;

            // 1. Scoring
            const scoring = this.calculateRecoveryProbability({
                daysOverdue,
                amountDue,
                creditScore: client.creditScore,
                totalLoanBalance: Number(loan.balanceRemaining),
                fulfilledPromisesCount: fulfilledPromises,
                brokenPromisesCount: brokenPromises,
                completedInstallmentsCount: completedCount,
                totalInstallmentsCount: totalCount,
            });

            // 2. Ventana de Contacto
            const contactWindow = await this.predictBestContactWindow(client.id, {
                employmentType: client.employmentType,
                address: client.address,
            });

            const shortLoanNumber = `#${loan.id.slice(-6).toUpperCase()}`;

            candidates.push({
                clientId: client.id,
                clientName: `${client.firstName} ${client.lastName}`,
                phone: client.phone,
                address: client.address || 'Sin dirección registrada',
                latitude: client.latitude ?? null,
                longitude: client.longitude ?? null,
                loanId: loan.id,
                loanNumber: shortLoanNumber,
                amountDue,
                daysOverdue,
                unpaidInstallments: unpaidSchedules.length,
                totalLoanBalance: Number(loan.balanceRemaining),
                scoring,
                contactWindow,
                lastPaymentDate: client.lastPaymentDate,
                employmentType: client.employmentType,
            });
        }

        // Ordenar por score de recuperación desc y monto adeudado desc
        candidates.sort((a, b) => {
            if (b.scoring.score !== a.scoring.score) {
                return b.scoring.score - a.scoring.score;
            }
            return b.amountDue - a.amountDue;
        });

        return candidates;
    },

    /**
     * Optimizador Heurístico TSP con Restricciones de Ventanas Horarias
     */
    optimizePredictiveRoute(
        candidates: PredictiveCandidate[],
        options?: {
            startLocation?: { latitude: number; longitude: number };
            startTime?: string; // ej. "08:30"
            maxVisits?: number;
        }
    ): PredictiveOptimizedRoute {
        const maxVisits = options?.maxVisits ?? candidates.length;
        const selectedCandidates = candidates.slice(0, maxVisits);

        if (selectedCandidates.length === 0) {
            return {
                visits: [],
                totalDistanceMeters: 0,
                totalDistanceKm: 0,
                totalDurationMinutes: 0,
                totalExpectedRecovery: 0,
                totalDebtInRoute: 0,
                averageRecoveryScore: 0,
                itinerary: [],
            };
        }

        // 1. Agrupar por ventanas horarias sugeridas
        const morningGroup = selectedCandidates.filter(c => c.contactWindow.window === 'MORNING');
        const middayGroup = selectedCandidates.filter(c => c.contactWindow.window === 'MIDDAY');
        const eveningGroup = selectedCandidates.filter(c => c.contactWindow.window === 'EVENING');
        const flexibleGroup = selectedCandidates.filter(c => c.contactWindow.window === 'FLEXIBLE');

        // Repartir flexibles donde haya menor carga
        for (const flex of flexibleGroup) {
            if (morningGroup.length <= middayGroup.length && morningGroup.length <= eveningGroup.length) {
                morningGroup.push(flex);
            } else if (middayGroup.length <= eveningGroup.length) {
                middayGroup.push(flex);
            } else {
                eveningGroup.push(flex);
            }
        }

        // 2. Ordenar geográficamente dentro de cada ventana
        const solveGroupTSP = (
            group: PredictiveCandidate[],
            startLat?: number,
            startLon?: number
        ): PredictiveCandidate[] => {
            if (group.length <= 1) return [...group];

            const withGeo = group.filter(g => g.latitude && g.longitude);
            const withoutGeo = group.filter(g => !g.latitude || !g.longitude);

            const ordered: PredictiveCandidate[] = [];
            const visited = new Set<string>();

            let currentLat = startLat ?? (withGeo[0]?.latitude || 19.4326);
            let currentLon = startLon ?? (withGeo[0]?.longitude || -99.1332);

            while (visited.size < withGeo.length) {
                let nearestIdx = -1;
                let nearestDist = Infinity;

                for (let i = 0; i < withGeo.length; i++) {
                    const item = withGeo[i];
                    if (visited.has(item.clientId)) continue;

                    const dist = calculateHaversineDistance(
                        currentLat,
                        currentLon,
                        item.latitude!,
                        item.longitude!
                    );

                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestIdx = i;
                    }
                }

                if (nearestIdx >= 0) {
                    const next = withGeo[nearestIdx];
                    visited.add(next.clientId);
                    ordered.push(next);
                    currentLat = next.latitude!;
                    currentLon = next.longitude!;
                } else {
                    break;
                }
            }

            // Clientes sin coordenadas se ordenan por mayor probabilidad
            withoutGeo.sort((a, b) => b.scoring.score - a.scoring.score);
            return [...ordered, ...withoutGeo];
        };

        const orderedMorning = solveGroupTSP(morningGroup, options?.startLocation?.latitude, options?.startLocation?.longitude);
        const lastMorning = orderedMorning[orderedMorning.length - 1];

        const orderedMidday = solveGroupTSP(
            middayGroup,
            lastMorning?.latitude ?? options?.startLocation?.latitude,
            lastMorning?.longitude ?? options?.startLocation?.longitude
        );
        const lastMidday = orderedMidday[orderedMidday.length - 1];

        const orderedEvening = solveGroupTSP(
            eveningGroup,
            lastMidday?.latitude ?? lastMorning?.latitude ?? options?.startLocation?.latitude,
            lastMidday?.longitude ?? lastMorning?.longitude ?? options?.startLocation?.longitude
        );

        const orderedAll: PredictiveCandidate[] = [
            ...orderedMorning,
            ...orderedMidday,
            ...orderedEvening,
        ];

        // 3. Asignación de Horarios e Itinerario
        let currentMinutes = 8 * 60 + 30; // 08:30 AM por defecto
        if (options?.startTime) {
            const [h, m] = options.startTime.split(':').map(Number);
            if (!isNaN(h) && !isNaN(m)) currentMinutes = h * 60 + m;
        }

        const scheduledVisits: ScheduledVisit[] = [];
        let totalDistanceMeters = 0;
        let totalDebtInRoute = 0;
        let totalExpectedRecovery = 0;
        let totalScoreSum = 0;

        const formatTime = (minutes: number) => {
            const h = Math.floor(minutes / 60);
            const m = minutes % 60;
            const period = h >= 12 ? 'PM' : 'AM';
            const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
            return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
        };

        for (let i = 0; i < orderedAll.length; i++) {
            const candidate = orderedAll[i];
            const prev = i > 0 ? orderedAll[i - 1] : null;

            let distFromPrev = 0;
            let travelMinutes = 10; // 10 min base de traslado

            if (prev && prev.latitude && prev.longitude && candidate.latitude && candidate.longitude) {
                distFromPrev = calculateHaversineDistance(
                    prev.latitude,
                    prev.longitude,
                    candidate.latitude,
                    candidate.longitude
                );
                // Velocidad urbana aprox 25 km/h + semáforos = 400 metros por minuto
                travelMinutes = Math.max(5, Math.round(distFromPrev / 400));
            } else if (i > 0) {
                distFromPrev = 2500; // 2.5 km estimado cuando no hay GPS
                travelMinutes = 15;
            } else {
                travelMinutes = 0; // Primer punto
            }

            totalDistanceMeters += distFromPrev;
            currentMinutes += travelMinutes;

            const startStr = formatTime(currentMinutes);
            const visitDuration = 20; // 20 min promedio por visita de cobranza
            currentMinutes += visitDuration;
            const endStr = formatTime(currentMinutes);

            totalDebtInRoute += candidate.amountDue;
            totalExpectedRecovery += candidate.scoring.estimatedRecoveryAmount;
            totalScoreSum += candidate.scoring.score;

            scheduledVisits.push({
                ...candidate,
                order: i + 1,
                scheduledTimeStart: startStr,
                scheduledTimeEnd: endStr,
                distanceFromPrevMeters: distFromPrev,
                travelMinutesFromPrev: travelMinutes,
            });
        }

        const totalDurationMinutes = scheduledVisits.length > 0
            ? scheduledVisits.reduce((sum, v) => sum + v.travelMinutesFromPrev + 20, 0)
            : 0;

        const averageRecoveryScore = scheduledVisits.length > 0
            ? Math.round(totalScoreSum / scheduledVisits.length)
            : 0;

        const itinerary = scheduledVisits.map(v => ({
            time: `${v.scheduledTimeStart} - ${v.scheduledTimeEnd}`,
            action: `Visita ${v.order}: ${v.contactWindow.label}`,
            clientName: v.clientName,
            address: v.address,
            amount: v.amountDue,
            score: v.scoring.score,
        }));

        return {
            visits: scheduledVisits,
            totalDistanceMeters,
            totalDistanceKm: Number((totalDistanceMeters / 1000).toFixed(1)),
            totalDurationMinutes,
            totalExpectedRecovery,
            totalDebtInRoute,
            averageRecoveryScore,
            itinerary,
        };
    },

    /**
     * Genera y persiste una ruta optimizada con IA en la base de datos
     */
    async generateAIRoute(options: GenerateAIRouteOptions) {
        // 1. Obtener candidatos morosos
        let candidates: PredictiveCandidate[];

        if (options.targetClientIds && options.targetClientIds.length > 0) {
            const allCandidates = await this.getPredictiveCandidates(options.tenantId, {
                maxCandidates: 100,
                advisorId: options.advisorId,
            });
            candidates = allCandidates.filter(c => options.targetClientIds!.includes(c.clientId));
        } else {
            candidates = await this.getPredictiveCandidates(options.tenantId, {
                maxCandidates: options.maxVisits ?? 15,
                advisorId: options.advisorId,
            });
        }

        if (options.minRecoveryScore) {
            candidates = candidates.filter(c => c.scoring.score >= options.minRecoveryScore!);
        }

        // 2. Ejecutar optimizador predictivo
        const optimized = this.optimizePredictiveRoute(candidates, {
            startLocation: options.startLocation,
            startTime: options.startTime ?? '08:30',
            maxVisits: options.maxVisits ?? 15,
        });

        // 3. Crear Registro en base de datos
        const route = await prisma.collectionRoute.create({
            data: {
                advisorId: options.advisorId,
                name: options.name,
                date: options.date,
                status: 'PENDING',
                optimized: true,
                distance: optimized.totalDistanceMeters,
                duration: optimized.totalDurationMinutes * 60,
                tenantId: options.tenantId,
            },
        });

        // 4. Crear Visitas asociadas con metadatos IA
        const visitPromises = optimized.visits.map(v => {
            const notes = `[IA Predictiva] Horario sugerido: ${v.scheduledTimeStart} - ${v.scheduledTimeEnd} (${v.contactWindow.label}) | Score Recuperación: ${v.scoring.score}% (${v.scoring.level}) | Mora: ${v.daysOverdue} días | Cuotas: ${v.unpaidInstallments}`;

            return prisma.collectionVisit.create({
                data: {
                    clientId: v.clientId,
                    advisorId: options.advisorId,
                    loanId: v.loanId,
                    visitDate: options.date,
                    address: v.address,
                    latitude: v.latitude,
                    longitude: v.longitude,
                    notes,
                    routeId: route.id,
                    tenantId: options.tenantId,
                },
            });
        });

        const createdVisits = await Promise.all(visitPromises);

        return {
            route,
            visits: createdVisits,
            optimizedSummary: {
                totalVisits: optimized.visits.length,
                totalDistanceKm: optimized.totalDistanceKm,
                totalDurationMinutes: optimized.totalDurationMinutes,
                totalDebtInRoute: optimized.totalDebtInRoute,
                totalExpectedRecovery: optimized.totalExpectedRecovery,
                averageRecoveryScore: optimized.averageRecoveryScore,
                itinerary: optimized.itinerary,
            },
        };
    },
};

export default predictiveCollectionService;
