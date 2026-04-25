import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log(Object.keys(prisma).filter(k => !k.startsWith('_')));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
