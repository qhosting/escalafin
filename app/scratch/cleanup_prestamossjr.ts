import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenantSlug = 'prestamossjr';
    
    const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug }
    });

    if (!tenant) {
        console.error(`Tenant with slug "${tenantSlug}" not found.`);
        return;
    }

    console.log(`Cleaning data for tenant: ${tenant.name} (${tenant.id})`);

    const tenantId = tenant.id;

    // Order of deletion to handle foreign keys
    console.log('Deleting Payment Transactions...');
    await prisma.paymentTransaction.deleteMany({
        where: { payment: { tenantId } }
    });

    console.log('Deleting Cash Collections...');
    await prisma.cashCollection.deleteMany({
        where: { payment: { tenantId } }
    });

    console.log('Deleting Payments...');
    await prisma.payment.deleteMany({
        where: { tenantId }
    });

    console.log('Deleting Late Fee Penalties...');
    await prisma.lateFeePenalty.deleteMany({
        where: { tenantId }
    });

    console.log('Deleting Amortization Schedules...');
    await prisma.amortizationSchedule.deleteMany({
        where: { loan: { tenantId } }
    });

    console.log('Deleting Promise to Pays...');
    await prisma.promiseToPay.deleteMany({
        where: { tenantId }
    });

    console.log('Deleting Collection Visits...');
    await prisma.collectionVisit.deleteMany({
        where: { tenantId }
    });

    console.log('Deleting Collection Routes...');
    await prisma.collectionRoute.deleteMany({
        where: { tenantId }
    });

    console.log('Deleting File Uploads...');
    await prisma.fileUpload.deleteMany({
        where: { OR: [{ client: { tenantId } }, { loan: { tenantId } }] }
    });

    console.log('Deleting Loans...');
    await prisma.loan.deleteMany({
        where: { tenantId }
    });

    console.log('Deleting Credit Applications...');
    await prisma.creditApplication.deleteMany({
        where: { tenantId }
    });

    console.log('Deleting Personal References...');
    await prisma.personalReference.deleteMany({
        where: { tenantId }
    });

    console.log('Deleting Guarantors...');
    await prisma.guarantor.deleteMany({
        where: { tenantId }
    });

    console.log('Deleting Collaterals...');
    await prisma.collateral.deleteMany({
        where: { tenantId }
    });

    console.log('Deleting Credit Scores...');
    await prisma.creditScore.deleteMany({
        where: { tenantId }
    });

    console.log('Deleting WhatsApp Messages...');
    await prisma.whatsAppMessage.deleteMany({
        where: { client: { tenantId } }
    });

    console.log('Deleting Files (Dual)...');
    await prisma.file.deleteMany({
        where: { client: { tenantId } }
    });

    console.log('Deleting Conversation Messages...');
    await prisma.conversationMessage.deleteMany({
        where: { conversation: { clientId: { in: (await prisma.client.findMany({ where: { tenantId }, select: { id: true } })).map(c => c.id) } } }
    });

    console.log('Deleting Conversations...');
    await prisma.conversation.deleteMany({
        where: { clientId: { in: (await prisma.client.findMany({ where: { tenantId }, select: { id: true } })).map(c => c.id) } }
    });

    console.log('Deleting Clients...');
    await prisma.client.deleteMany({
        where: { tenantId }
    });

    console.log('Cleanup completed successfully for prestamossjr.');
    console.log('Users and Admins have been preserved.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
