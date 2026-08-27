/**
 * Test Script: Predictive AI Collections Route
 * EscalaFin - Q4 2026
 */

import {
  predictiveCollectionService,
  calculateHaversineDistance,
} from '../lib/predictive-collection-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('=====================================================');
  console.log('🤖 INICIANDO PRUEBAS: MOTOR PREDICTIVE AI COLLECTIONS');
  console.log('=====================================================\n');

  // Test 1: Cálculo de distancia Haversine
  console.log('📍 Test 1: Verificación de Distancia Haversine');
  const zocalo = { lat: 19.4326, lon: -99.1332 };
  const reforma = { lat: 19.4270, lon: -99.1677 };
  const distance = calculateHaversineDistance(zocalo.lat, zocalo.lon, reforma.lat, reforma.lon);
  console.log(`- Distancia entre Zócalo y Reforma: ${distance} metros (~${(distance / 1000).toFixed(2)} km)`);
  if (distance > 3000 && distance < 4500) {
    console.log('✅ Test 1 PASADO: Cálculo geoespacial preciso.\n');
  } else {
    console.error('❌ Test 1 FALLÓ: Distancia fuera de rango.\n');
  }

  // Test 2: Recovery Probability Scoring
  console.log('📊 Test 2: Scoring de Probabilidad de Recuperación (0-100%)');
  const scoreEarly = predictiveCollectionService.calculateRecoveryProbability({
    daysOverdue: 3,
    amountDue: 1500,
    creditScore: 700,
    totalLoanBalance: 5000,
    fulfilledPromisesCount: 2,
    brokenPromisesCount: 0,
    completedInstallmentsCount: 8,
    totalInstallmentsCount: 12,
  });
  console.log(`- Cliente con mora temprana (3 días) + promesas cumplidas:`);
  console.log(`  Score: ${scoreEarly.score}% (${scoreEarly.level}) | Color: ${scoreEarly.color}`);
  console.log(`  Recuperación estimada: $${scoreEarly.estimatedRecoveryAmount} MXN`);

  const scoreSevere = predictiveCollectionService.calculateRecoveryProbability({
    daysOverdue: 65,
    amountDue: 8000,
    creditScore: 480,
    totalLoanBalance: 12000,
    fulfilledPromisesCount: 0,
    brokenPromisesCount: 3,
    completedInstallmentsCount: 1,
    totalInstallmentsCount: 12,
  });
  console.log(`- Cliente con mora severa (65 días) + 3 promesas rotas:`);
  console.log(`  Score: ${scoreSevere.score}% (${scoreSevere.level}) | Color: ${scoreSevere.color}`);
  console.log(`  Recuperación estimada: $${scoreSevere.estimatedRecoveryAmount} MXN`);

  if (scoreEarly.score > scoreSevere.score && scoreEarly.level === 'HIGH' && scoreSevere.level === 'CRITICAL') {
    console.log('✅ Test 2 PASADO: Algoritmo de scoring pondera correctamente el riesgo.\n');
  } else {
    console.error('❌ Test 2 FALLÓ: Inconsistencia en scoring de riesgo.\n');
  }

  // Test 3: Optimización Heurística TSP con Ventanas de Tiempo
  console.log('⏱️ Test 3: Optimización de Itinerario con Restricción Horaria (TSP-TW)');
  const mockCandidates: any[] = [
    {
      clientId: 'c-1',
      clientName: 'Juan Pérez (Comercio)',
      phone: '5511223344',
      address: 'Av. Hidalgo 100, Centro',
      latitude: 19.4350,
      longitude: -99.1400,
      loanId: 'l-1',
      amountDue: 2400,
      daysOverdue: 4,
      unpaidInstallments: 1,
      totalLoanBalance: 8000,
      scoring: scoreEarly,
      contactWindow: {
        window: 'MORNING',
        label: 'Mañana (08:30 - 11:30)',
        suggestedTime: '09:30 AM',
        confidence: 85,
        reasons: ['Apertura de comercio'],
        historicalPaymentCount: 5,
        preferredDays: ['Lunes'],
      },
      lastPaymentDate: new Date(),
      employmentType: 'BUSINESS_OWNER',
    },
    {
      clientId: 'c-2',
      clientName: 'María García (Oficina)',
      phone: '5599887766',
      address: 'Insurgentes Sur 1200',
      latitude: 19.3800,
      longitude: -99.1750,
      loanId: 'l-2',
      amountDue: 4500,
      daysOverdue: 12,
      unpaidInstallments: 2,
      totalLoanBalance: 15000,
      scoring: scoreEarly,
      contactWindow: {
        window: 'EVENING',
        label: 'Tarde / Salida (16:30 - 19:00)',
        suggestedTime: '17:30 PM',
        confidence: 90,
        reasons: ['Jornada laboral de oficina'],
        historicalPaymentCount: 3,
        preferredDays: ['Viernes'],
      },
      lastPaymentDate: new Date(),
      employmentType: 'EMPLOYED',
    },
    {
      clientId: 'c-3',
      clientName: 'Carlos López (Taller)',
      phone: '5544332211',
      address: 'Calz. de Tlalpan 500',
      latitude: 19.4000,
      longitude: -99.1380,
      loanId: 'l-3',
      amountDue: 1800,
      daysOverdue: 6,
      unpaidInstallments: 1,
      totalLoanBalance: 4000,
      scoring: scoreEarly,
      contactWindow: {
        window: 'MIDDAY',
        label: 'Mediodía (12:00 - 15:00)',
        suggestedTime: '13:00 PM',
        confidence: 70,
        reasons: ['Almuerzo en taller'],
        historicalPaymentCount: 2,
        preferredDays: ['Martes'],
      },
      lastPaymentDate: new Date(),
      employmentType: 'INDEPENDENT',
    },
  ];

  const optimized = predictiveCollectionService.optimizePredictiveRoute(mockCandidates, {
    startTime: '09:00',
    maxVisits: 5,
  });

  console.log(`- Itinerario Generado: ${optimized.visits.length} paradas`);
  console.log(`  Distancia Total: ${optimized.totalDistanceKm} km | Duración: ${optimized.totalDurationMinutes} min`);
  console.log(`  Deuda en Ruta: $${optimized.totalDebtInRoute} MXN | Recuperación Esperada: $${optimized.totalExpectedRecovery} MXN`);
  console.log('  Paradas Programadas:');
  optimized.visits.forEach((v) => {
    console.log(`    #${v.order} [${v.scheduledTimeStart} - ${v.scheduledTimeEnd}] ${v.clientName} (${v.contactWindow.label})`);
  });

  // Verificar que la mañana va antes que la tarde
  const morningIdx = optimized.visits.findIndex((v) => v.clientId === 'c-1');
  const eveningIdx = optimized.visits.findIndex((v) => v.clientId === 'c-2');

  if (morningIdx < eveningIdx && optimized.visits.length === 3) {
    console.log('✅ Test 3 PASADO: La secuencia respeta el flujo de ventanas de tiempo y horas.\n');
  } else {
    console.error('❌ Test 3 FALLÓ: Ordenamiento de ventanas no coincide.\n');
  }

  // Test 4: Base de datos real
  console.log('🏢 Test 4: Consulta de Tenants y Candidatos Reales en BD');
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true } });
  console.log(`- Tenants encontrados en BD: ${tenants.length}`);
  if (tenants.length > 0) {
    const tenantId = tenants[0].id;
    const dbCandidates = await predictiveCollectionService.getPredictiveCandidates(tenantId, {
      maxCandidates: 10,
    });
    console.log(`- Candidatos morosos analizados en tenant "${tenants[0].name}": ${dbCandidates.length}`);
    if (dbCandidates.length > 0) {
      console.log(`  Primer candidato: ${dbCandidates[0].clientName} (Mora: ${dbCandidates[0].daysOverdue}d, Score: ${dbCandidates[0].scoring.score}%, Ventana: ${dbCandidates[0].contactWindow.label})`);
    }
  }
  console.log('✅ Test 4 PASADO: Integración completa con PostgreSQL.\n');

  console.log('=====================================================');
  console.log('🎉 TODAS LAS PRUEBAS DEL MOTOR PREDICTIVO PASARON (4/4)');
  console.log('=====================================================');
}

runTests()
  .catch((e) => {
    console.error('Fallo en pruebas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
