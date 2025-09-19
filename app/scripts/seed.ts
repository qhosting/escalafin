
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting to seed database...');

  // Limpiar datos existentes
  await prisma.payment.deleteMany();
  await prisma.amortizationSchedule.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.creditApplication.deleteMany();
  await prisma.client.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️ Cleared existing data...');

  // Crear usuarios del sistema
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);
  const johnPassword = await bcrypt.hash('johndoe123', 10);

  // Admin Principal
  const admin = await prisma.user.create({
    data: {
      email: 'admin@escalafin.com',
      password: adminPassword,
      firstName: 'Ana',
      lastName: 'García',
      phone: '+52 555 100 2000',
      role: 'ADMIN',
      status: 'ACTIVE',
    }
  });

  // Usuario de prueba (requerido) - oculto al usuario
  const testUser = await prisma.user.create({
    data: {
      email: 'john@doe.com',
      password: johnPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+52 555 999 9999',
      role: 'ADMIN',
      status: 'ACTIVE',
    }
  });

  // Asesores
  const asesor1 = await prisma.user.create({
    data: {
      email: 'carlos.lopez@escalafin.com',
      password: hashedPassword,
      firstName: 'Carlos',
      lastName: 'López',
      phone: '+52 555 100 2001',
      role: 'ASESOR',
      status: 'ACTIVE',
    }
  });

  const asesor2 = await prisma.user.create({
    data: {
      email: 'maria.rodriguez@escalafin.com',
      password: hashedPassword,
      firstName: 'María',
      lastName: 'Rodríguez',
      phone: '+52 555 100 2002',
      role: 'ASESOR',
      status: 'ACTIVE',
    }
  });

  const asesor3 = await prisma.user.create({
    data: {
      email: 'luis.martinez@escalafin.com',
      password: hashedPassword,
      firstName: 'Luis',
      lastName: 'Martínez',
      phone: '+52 555 100 2003',
      role: 'ASESOR',
      status: 'ACTIVE',
    }
  });

  console.log('👥 Created system users...');

  // Crear clientes con usuarios
  const cliente1User = await prisma.user.create({
    data: {
      email: 'juan.perez@email.com',
      password: hashedPassword,
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '+52 555 200 3001',
      role: 'CLIENTE',
      status: 'ACTIVE',
    }
  });

  const cliente2User = await prisma.user.create({
    data: {
      email: 'ana.martinez@email.com',
      password: hashedPassword,
      firstName: 'Ana',
      lastName: 'Martínez',
      phone: '+52 555 200 3002',
      role: 'CLIENTE',
      status: 'ACTIVE',
    }
  });

  // Crear perfiles de clientes
  const cliente1 = await prisma.client.create({
    data: {
      userId: cliente1User.id,
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@email.com',
      phone: '+52 555 200 3001',
      dateOfBirth: new Date('1985-03-15'),
      address: 'Av. Reforma 123, Col. Centro',
      city: 'Ciudad de México',
      state: 'CDMX',
      postalCode: '06000',
      monthlyIncome: 45000.00,
      employmentType: 'EMPLOYED',
      employerName: 'Empresa ABC S.A. de C.V.',
      workAddress: 'Av. Insurgentes Sur 456',
      yearsEmployed: 5,
      creditScore: 720,
      bankName: 'BBVA México',
      accountNumber: '1234567890',
      status: 'ACTIVE',
      asesorId: asesor1.id,
    }
  });

  const cliente2 = await prisma.client.create({
    data: {
      userId: cliente2User.id,
      firstName: 'Ana',
      lastName: 'Martínez',
      email: 'ana.martinez@email.com',
      phone: '+52 555 200 3002',
      dateOfBirth: new Date('1990-07-22'),
      address: 'Calle Madero 789, Col. Roma Norte',
      city: 'Ciudad de México',
      state: 'CDMX',
      postalCode: '06700',
      monthlyIncome: 35000.00,
      employmentType: 'SELF_EMPLOYED',
      employerName: 'Consultora AMM',
      workAddress: 'Calle Madero 789',
      yearsEmployed: 3,
      creditScore: 680,
      bankName: 'Santander México',
      accountNumber: '0987654321',
      status: 'ACTIVE',
      asesorId: asesor2.id,
    }
  });

  // Clientes adicionales (sin usuario - solo CRM)
  const cliente3 = await prisma.client.create({
    data: {
      firstName: 'Roberto',
      lastName: 'Sánchez',
      email: 'roberto.sanchez@email.com',
      phone: '+52 555 200 3003',
      dateOfBirth: new Date('1980-11-10'),
      address: 'Av. Universidad 321, Col. Del Valle',
      city: 'Ciudad de México',
      state: 'CDMX',
      postalCode: '03100',
      monthlyIncome: 55000.00,
      employmentType: 'EMPLOYED',
      employerName: 'Corporativo XYZ',
      workAddress: 'Santa Fe Business Center',
      yearsEmployed: 8,
      creditScore: 750,
      bankName: 'Banamex',
      accountNumber: '1122334455',
      status: 'ACTIVE',
      asesorId: asesor1.id,
    }
  });

  const cliente4 = await prisma.client.create({
    data: {
      firstName: 'Patricia',
      lastName: 'Hernández',
      email: 'patricia.hernandez@email.com',
      phone: '+52 555 200 3004',
      dateOfBirth: new Date('1987-05-18'),
      address: 'Calle 16 de Septiembre 567, Col. Centro',
      city: 'Guadalajara',
      state: 'Jalisco',
      postalCode: '44100',
      monthlyIncome: 40000.00,
      employmentType: 'EMPLOYED',
      employerName: 'Tecnológica GDL',
      workAddress: 'Av. Américas 2000',
      yearsEmployed: 4,
      creditScore: 690,
      bankName: 'HSBC México',
      accountNumber: '5566778899',
      status: 'ACTIVE',
      asesorId: asesor2.id,
    }
  });

  const cliente5 = await prisma.client.create({
    data: {
      firstName: 'Miguel',
      lastName: 'Torres',
      email: 'miguel.torres@email.com',
      phone: '+52 555 200 3005',
      dateOfBirth: new Date('1992-09-03'),
      address: 'Av. Constitución 890, Col. Moderna',
      city: 'Monterrey',
      state: 'Nuevo León',
      postalCode: '64720',
      monthlyIncome: 38000.00,
      employmentType: 'SELF_EMPLOYED',
      employerName: 'Torres & Asociados',
      workAddress: 'Centro Comercial Plaza Fiesta',
      yearsEmployed: 2,
      creditScore: 650,
      bankName: 'Scotiabank México',
      accountNumber: '9988776655',
      status: 'ACTIVE',
      asesorId: asesor3.id,
    }
  });

  console.log('👤 Created clients...');

  // Solicitudes de crédito
  const aplicacion1 = await prisma.creditApplication.create({
    data: {
      clientId: cliente3.id,
      asesorId: asesor1.id,
      loanType: 'PERSONAL',
      requestedAmount: 150000.00,
      requestedTerm: 24,
      purpose: 'Consolidación de deudas y mejoras al hogar',
      status: 'APPROVED',
      reviewedBy: admin.id,
      reviewedAt: new Date(),
      reviewComments: 'Cliente con buen historial crediticio, ingresos comprobables.',
      approvedAmount: 150000.00,
      approvedTerm: 24,
      interestRate: 0.18,
    }
  });

  const aplicacion2 = await prisma.creditApplication.create({
    data: {
      clientId: cliente4.id,
      asesorId: asesor2.id,
      loanType: 'BUSINESS',
      requestedAmount: 200000.00,
      requestedTerm: 36,
      purpose: 'Expansión de negocio y compra de equipo',
      status: 'UNDER_REVIEW',
    }
  });

  const aplicacion3 = await prisma.creditApplication.create({
    data: {
      clientId: cliente5.id,
      asesorId: asesor3.id,
      loanType: 'AUTO',
      requestedAmount: 300000.00,
      requestedTerm: 48,
      purpose: 'Compra de vehículo para trabajo',
      status: 'PENDING',
    }
  });

  console.log('📋 Created credit applications...');

  // Préstamos activos
  const prestamo1 = await prisma.loan.create({
    data: {
      clientId: cliente1.id,
      creditApplicationId: null,
      loanNumber: 'ESF-2024-001',
      loanType: 'PERSONAL',
      principalAmount: 100000.00,
      interestRate: 0.15,
      termMonths: 12,
      monthlyPayment: 9025.00,
      totalAmount: 108300.00,
      balanceRemaining: 72200.00,
      status: 'ACTIVE',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    }
  });

  const prestamo2 = await prisma.loan.create({
    data: {
      clientId: cliente2.id,
      creditApplicationId: null,
      loanNumber: 'ESF-2024-002',
      loanType: 'BUSINESS',
      principalAmount: 250000.00,
      interestRate: 0.16,
      termMonths: 24,
      monthlyPayment: 12150.00,
      totalAmount: 291600.00,
      balanceRemaining: 204450.00,
      status: 'ACTIVE',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2026-01-31'),
    }
  });

  const prestamo3 = await prisma.loan.create({
    data: {
      clientId: cliente3.id,
      creditApplicationId: aplicacion1.id,
      loanNumber: 'ESF-2024-003',
      loanType: 'PERSONAL',
      principalAmount: 150000.00,
      interestRate: 0.18,
      termMonths: 24,
      monthlyPayment: 7350.00,
      totalAmount: 176400.00,
      balanceRemaining: 150000.00,
      status: 'ACTIVE',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2026-08-31'),
    }
  });

  console.log('💰 Created loans...');

  // Función para calcular tabla de amortización
  function calculateAmortization(principal: number, rate: number, months: number, startDate: Date) {
    const monthlyRate = rate / 12;
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    
    let balance = principal;
    const schedule = [];
    
    for (let i = 1; i <= months; i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance = balance - principalPayment;
      
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + i - 1);
      
      schedule.push({
        paymentNumber: i,
        paymentDate,
        principalPayment: Math.round(principalPayment * 100) / 100,
        interestPayment: Math.round(interestPayment * 100) / 100,
        totalPayment: Math.round(monthlyPayment * 100) / 100,
        remainingBalance: Math.max(0, Math.round(balance * 100) / 100),
      });
    }
    
    return schedule;
  }

  // Crear tablas de amortización
  const schedule1 = calculateAmortization(100000, 0.15, 12, new Date('2024-01-01'));
  for (const payment of schedule1) {
    await prisma.amortizationSchedule.create({
      data: {
        loanId: prestamo1.id,
        paymentNumber: payment.paymentNumber,
        paymentDate: payment.paymentDate,
        principalPayment: payment.principalPayment,
        interestPayment: payment.interestPayment,
        totalPayment: payment.totalPayment,
        remainingBalance: payment.remainingBalance,
        isPaid: payment.paymentNumber <= 4, // Primeros 4 pagos realizados
      }
    });
  }

  const schedule2 = calculateAmortization(250000, 0.16, 24, new Date('2024-02-01'));
  for (const payment of schedule2) {
    await prisma.amortizationSchedule.create({
      data: {
        loanId: prestamo2.id,
        paymentNumber: payment.paymentNumber,
        paymentDate: payment.paymentDate,
        principalPayment: payment.principalPayment,
        interestPayment: payment.interestPayment,
        totalPayment: payment.totalPayment,
        remainingBalance: payment.remainingBalance,
        isPaid: payment.paymentNumber <= 3, // Primeros 3 pagos realizados
      }
    });
  }

  const schedule3 = calculateAmortization(150000, 0.18, 24, new Date('2024-09-01'));
  for (const payment of schedule3) {
    await prisma.amortizationSchedule.create({
      data: {
        loanId: prestamo3.id,
        paymentNumber: payment.paymentNumber,
        paymentDate: payment.paymentDate,
        principalPayment: payment.principalPayment,
        interestPayment: payment.interestPayment,
        totalPayment: payment.totalPayment,
        remainingBalance: payment.remainingBalance,
        isPaid: false, // Préstamo nuevo, sin pagos
      }
    });
  }

  console.log('📅 Created amortization schedules...');

  // Crear historial de pagos para préstamos activos
  const paidSchedules1 = await prisma.amortizationSchedule.findMany({
    where: { loanId: prestamo1.id, isPaid: true },
    orderBy: { paymentNumber: 'asc' }
  });

  for (const schedule of paidSchedules1) {
    await prisma.payment.create({
      data: {
        loanId: prestamo1.id,
        amortizationScheduleId: schedule.id,
        amount: schedule.totalPayment,
        paymentDate: schedule.paymentDate,
        paymentMethod: 'BANK_TRANSFER',
        status: 'COMPLETED',
        reference: `TRX-${schedule.paymentNumber.toString().padStart(3, '0')}-${prestamo1.loanNumber}`,
        processedBy: asesor1.id,
      }
    });
  }

  const paidSchedules2 = await prisma.amortizationSchedule.findMany({
    where: { loanId: prestamo2.id, isPaid: true },
    orderBy: { paymentNumber: 'asc' }
  });

  for (const schedule of paidSchedules2) {
    await prisma.payment.create({
      data: {
        loanId: prestamo2.id,
        amortizationScheduleId: schedule.id,
        amount: schedule.totalPayment,
        paymentDate: schedule.paymentDate,
        paymentMethod: 'CASH',
        status: 'COMPLETED',
        reference: `TRX-${schedule.paymentNumber.toString().padStart(3, '0')}-${prestamo2.loanNumber}`,
        processedBy: asesor2.id,
      }
    });
  }

  console.log('💳 Created payment history...');
  
  console.log('✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log('- Users created:', await prisma.user.count());
  console.log('- Clients created:', await prisma.client.count());
  console.log('- Credit applications:', await prisma.creditApplication.count());
  console.log('- Active loans:', await prisma.loan.count());
  console.log('- Payment schedules:', await prisma.amortizationSchedule.count());
  console.log('- Payment records:', await prisma.payment.count());
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
