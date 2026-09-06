import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const plans = [
        {
            name: 'starter',
            displayName: 'Starter',
            description: 'Ideal para pequeñas empresas que inician',
            priceMonthly: 0,
            priceYearly: 0,
            currency: 'MXN',
            features: JSON.stringify([
                'Hasta 2 usuarios',
                'Hasta 100 préstamos',
                'Soporte por email'
            ]),
            limits: JSON.stringify({
                users: 2,
                loans: 100,
                clients: 200,
                storage: 1024 * 1024 * 100 // 100MB
            }),
            isActive: true,
            isPopular: false,
            trialDays: 14,
            sortOrder: 1
        },
        {
            name: 'professional',
            displayName: 'Profesional',
            description: 'Para microfinancieras en rápida expansión',
            priceMonthly: 520,
            priceYearly: 5200,
            currency: 'MXN',
            features: JSON.stringify([
                'Hasta 5 usuarios',
                'Préstamos ilimitados',
                'Soporte prioritario',
                'Reportes avanzados'
            ]),
            limits: JSON.stringify({
                users: 5,
                loans: 10000,
                clients: 10000,
                storage: 1024 * 1024 * 1024 // 1GB
            }),
            isActive: true,
            isPopular: true,
            trialDays: 14,
            sortOrder: 2
        },
        {
            name: 'business',
            displayName: 'Empresarial',
            description: 'Solución completa para operaciones masivas y clusters',
            priceMonthly: 777,
            priceYearly: 7770,
            currency: 'MXN',
            features: JSON.stringify([
                'Usuarios ilimitados',
                'Préstamos ilimitados',
                'Soporte 24/7',
                'API Access',
                'Marca blanca'
            ]),
            limits: JSON.stringify({
                users: 9999,
                loans: 999999,
                clients: 999999,
                storage: 1024 * 1024 * 1024 * 10 // 10GB
            }),
            isActive: true,
            isPopular: false,
            trialDays: 30,
            sortOrder: 3
        }
    ]

    console.log('🌱 Comenzando seed de planes...')

    for (const plan of plans) {
        const existing = await prisma.plan.findUnique({
            where: { name: plan.name }
        })

        if (!existing) {
            await prisma.plan.create({
                data: plan
            })
            console.log(`✅ Plan creado: ${plan.displayName}`)
        } else {
            console.log(`ℹ️ Plan ya existe: ${plan.displayName}`)
            // Opcional: Actualizar si ya existe
            /*
            await prisma.plan.update({
              where: { name: plan.name },
              data: plan
            })
            */
        }
    }

    console.log('🏁 Seed completado.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
