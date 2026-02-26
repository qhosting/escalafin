export class AurumSyncService {
    /**
     * Base URL for the Master Hub API.
     * In production it should be configured via environment variables.
     */
    private static get baseUrl() {
        return process.env.AURUM_MASTER_HUB_URL || 'https://acc.aurumcapital.mx/api';
    }

    /**
     * 1. Report Financial Transactions (POST /fleet/transactions)
     * Fires whenever a money flow occurs in EscalaFin.
     */
    static async reportTransaction(data: {
        type: 'inflow' | 'outflow';
        amount: number;
        currency: string;
        description: string;
        source: string;
        destination: string;
        referenceId: string;
        status: string;
    }) {
        try {
            console.log('[AurumSync] Sending transaction to Master Hub...', data.referenceId);

            const response = await fetch(`${this.baseUrl}/fleet/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${process.env.AURUM_MASTER_HUB_TOKEN}` // Add when required
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errText = await response.text();
                console.warn(`[AurumSync] Failed to report transaction: ${response.status} - ${errText}`);
            } else {
                console.log('[AurumSync] Transaction sync successful.');
            }
        } catch (error) {
            // Catch error silently to prevent blocking EscalaFin's normal workflow
            console.error('[AurumSync] Network error reporting transaction:', error);
        }
    }

    /**
     * 2. Synchronize New Tenant/Client (POST /clients and POST /subscriptions)
     * Fires when a new company registers and subscribes to a plan in EscalaFin.
     */
    static async syncNewTenant(
        clientData: {
            commercialName: string;
            rfc?: string;
            email: string;
        },
        planData: {
            planName: string;
            amount: number;
            interval: string;
            nextBillingDate: string;
        }
    ) {
        try {
            console.log(`[AurumSync] Registering new tenant ${clientData.commercialName} to Master Hub...`);

            // STEP A: Register the Client
            const clientResponse = await fetch(`${this.baseUrl}/clients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${process.env.AURUM_MASTER_HUB_TOKEN}` // Add when required
                },
                body: JSON.stringify({
                    commercialName: clientData.commercialName,
                    rfc: clientData.rfc || 'XAXX010101000', // Default generic RFC if empty
                    email: clientData.email,
                    satellites: ['ESCALAFIN'],
                }),
            });

            if (!clientResponse.ok) {
                const errText = await clientResponse.text();
                console.warn(`[AurumSync] Failed to register client: ${clientResponse.status} - ${errText}`);
                return;
            }

            const clientResult = await clientResponse.json();
            // Assumes Master Hub returns the created ID in `id` or `data.id`
            const clientId = clientResult.id || clientResult.data?.id;

            if (!clientId) {
                console.warn('[AurumSync] Master Hub response did not contain a client ID.', clientResult);
                return;
            }

            console.log(`[AurumSync] Client registered successfully with ID: ${clientId}. Registering subscription...`);

            // STEP B: Register the Subscription
            const subResponse = await fetch(`${this.baseUrl}/subscriptions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${process.env.AURUM_MASTER_HUB_TOKEN}` // Add when required
                },
                body: JSON.stringify({
                    satelliteId: 'ESCALAFIN',
                    clientId: clientId,
                    planName: planData.planName,
                    amount: planData.amount,
                    interval: planData.interval || 'monthly',
                    nextBillingDate: planData.nextBillingDate,
                }),
            });

            if (!subResponse.ok) {
                const errText = await subResponse.text();
                console.warn(`[AurumSync] Failed to register subscription: ${subResponse.status} - ${errText}`);
            } else {
                console.log('[AurumSync] Subscription sync successful.');
            }
        } catch (error) {
            console.error('[AurumSync] Network error synchronizing tenant:', error);
        }
    }
}
