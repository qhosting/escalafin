
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getOpenpayClient } from '@/lib/openpay';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.tenantId || session.user.role !== 'ADMIN') {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { planId } = await req.json();

    if (!planId) {
        return new NextResponse("Plan ID required", { status: 400 });
    }

    try {
        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) return new NextResponse("Plan not found", { status: 404 });

        // Get Active Subscription
        const subscription = await prisma.subscription.findFirst({
            where: { tenantId: session.user.tenantId },
            include: { tenant: true } // Need tenant details for customer creation
        });

        if (!subscription) {
            return new NextResponse("No subscription found to upgrade", { status: 400 });
        }

        const openpay = getOpenpayClient();

        // 1. Ensure Customer exists in Openpay
        let customerId = subscription.openpayCustomerId;
        if (!customerId) {
            // Create customer from Tenant/User data
            // We use the current user as the billing contact for now
            const user = session.user;
            const newCustomer = await openpay.createCustomer({
                name: user.name || 'Admin',
                last_name: subscription.tenant.name, // Use Tenant Name as Last Name or Business Name equivalent
                email: user.email,
                phone_number: '5555555555', // Should be collected from profile
                requires_account: false
            });
            customerId = newCustomer.id;

            // Save customer ID
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: { openpayCustomerId: customerId }
            });
        }

        // 2. Create Invoice Record (Pending Payment)
        const invoice = await prisma.invoice.create({
            data: {
                subscriptionId: subscription.id,
                invoiceNumber: `INV-${Date.now()}`,
                amount: plan.priceMonthly,
                subtotal: plan.priceMonthly,
                dueDate: new Date(),
                status: 'DRAFT',
                currency: 'MXN',
                notes: `Subscription Upgrade to ${plan.displayName}`,
                // We could store target planId in a temp field or metadata if schema supported it.
                // For now, we rely on the charge description or adding a temp record.
                // BEST PRACTICE: Add a pending_plan_change table or structured metadata column.
                // Workaround: We'll put it in `lineItems` JSON for retrieval later.
                lineItems: JSON.stringify([{
                    planId: planId,
                    planName: plan.displayName,
                    price: Number(plan.priceMonthly)
                }])
            }
        });

        // 3. Create Openpay Charge (Checkout Link)
        // Using "charge" creation which can return payment_url for redirect
        const chargeRequest = {
            method: 'card', // Can be 'store', 'bank_account', etc. 
            // For hosted checkout usually we might use a specific 'checkout' endpoint or 'method': 'card' with 'use_card_points' false etc 
            // Depending on implementation mode (Direct vs Hosted). assuming HOSTED for ease.
            // Standard API: Create Charge -> returns ID.
            // For Redirect: We need 'confirm: false' + 'redirect_url'.

            amount: Number(plan.priceMonthly),
            description: `Pago de Suscripción: ${plan.displayName}`,
            order_id: invoice.id, // Link Openpay Order ID to our Invoice ID
            customer: {
                name: session.user.name || 'Usuario',
                last_name: subscription.tenant.name,
                email: session.user.email || '',
                phone_number: '55555555'
            },
            confirm: false, // Important for 3D Secure / Redirect flow
            redirect_url: `${process.env.NEXTAUTH_URL}/admin/settings?tab=billing&status=success`,
            currency: 'MXN',
            // Send metadata to Openpay to retrieve it in Webhook
            metadata: {
                invoiceId: invoice.id,
                planId: planId,
                tenantId: session.user.tenantId
            }
        };

        // Note: openpay-node or axios implementation in lib/openpay needs to support this.
        // We act as if lib/openpay 'createCharge' handles this standard structure.
        const charge = await openpay.createCharge(chargeRequest as any);

        // 4. Update Invoice with Openpay ID
        await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
                openpayInvoiceId: charge.id,
                status: 'OPEN' // Now it's open, waiting for payment
            }
        });

        // 5. Return the Payment URL
        // Openpay returns payment_method.url for 3D secure or bank references
        // Check where the redirect URL is in the response structure
        const paymentUrl = charge.payment_method?.url ||
            charge.payment_method?.payment_url || // Some variations
            (charge as any).payment_url; // Direct property in some versions

        if (!paymentUrl) {
            // If no URL (e.g. direct charge without 3DS), it might be "completed" already?
            // Unlikely with confirm: false.
            // Fallback or error
            throw new Error("No redirect URL received from payment provider");
        }

        return NextResponse.json({
            url: paymentUrl,
            transactionId: invoice.id
        });

    } catch (error: any) {
        console.error("Error creating real checkout:", error);
        return new NextResponse(error.message || "Internal Server Error", { status: 500 });
    }
}
