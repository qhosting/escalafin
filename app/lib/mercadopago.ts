
import axios from 'axios';

interface MercadoPagoConfig {
    accessToken: string;
    publicKey?: string;
}

export interface PreferenceItem {
    id?: string;
    title: string;
    description?: string;
    category_id?: string;
    quantity: number;
    unit_price: number;
    currency_id?: string;
}

export interface PreferenceRequest {
    items: PreferenceItem[];
    payer?: {
        name?: string;
        surname?: string;
        email: string;
        phone?: {
            area_code?: string;
            number?: string;
        };
        address?: {
            zip_code?: string;
            street_name?: string;
            street_number?: number;
        };
    };
    back_urls?: {
        success: string;
        failure: string;
        pending: string;
    };
    auto_return?: 'approved' | 'all';
    notification_url?: string;
    external_reference?: string;
    expires?: boolean;
    expiration_date_from?: string;
    expiration_date_to?: string;
}

export interface PreferenceResponse {
    id: string;
    init_point: string;
    sandbox_init_point: string;
    external_reference: string;
    [key: string]: any;
}

class MercadoPagoClient {
    private config: MercadoPagoConfig;
    private baseUrl = 'https://api.mercadopago.com';

    constructor(config: MercadoPagoConfig) {
        this.config = config;
    }

    private getHeaders() {
        return {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
        };
    }

    /**
     * Crea una preferencia de pago (Checkout Pro)
     */
    async createPreference(preference: PreferenceRequest): Promise<PreferenceResponse> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/checkout/preferences`,
                preference,
                {
                    headers: this.getHeaders(),
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Error creating Mercado Pago preference:', error.response?.data || error.message);
            throw new Error(`Failed to create payment preference: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Obtiene la información de un pago realizado
     */
    async getPayment(paymentId: string): Promise<any> {
        try {
            const response = await axios.get(
                `${this.baseUrl}/v1/payments/${paymentId}`,
                {
                    headers: this.getHeaders(),
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Error getting Mercado Pago payment:', error.response?.data || error.message);
            throw new Error(`Failed to get payment info: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Crea una suscripción (Plan) para pagos recurrentes (SaaS)
     */
    async createSubscriptionPlan(planData: any): Promise<any> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/preapproval_plan`,
                planData,
                {
                    headers: this.getHeaders(),
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Error creating subscription plan:', error.response?.data || error.message);
            throw new Error(`Failed to create plan: ${error.response?.data?.message || error.message}`);
        }
    }
}

let mpClient: MercadoPagoClient | null = null;

export const getMercadoPagoClient = (): MercadoPagoClient => {
    if (!mpClient) {
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

        if (!accessToken) {
            console.warn('Mercado Pago ACCESS_TOKEN not configured.');
        }

        mpClient = new MercadoPagoClient({
            accessToken,
            publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
        });
    }

    return mpClient;
};

export { MercadoPagoClient };
