
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const slugs = ['demo', 'escalafin-demo'];
  
  for (const slug of slugs) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            clients: true,
            loans: true,
            users: true
          }
        }
      }
    });

    if (tenant) {
      console.log(`Tenant: ${tenant.name} (${slug})`);
      console.log(`  Clients: ${tenant._count.clients}`);
      console.log(`  Loans: ${tenant._count.loans}`);
      console.log(`  Users: ${tenant._count.users}`);
      console.log('---');
    } else {
      console.log(`Tenant ${slug} no encontrado.`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
