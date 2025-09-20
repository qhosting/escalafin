
import axios from 'axios';

interface OpenpayConfig {
  merchantId: string;
  privateKey: string;
  baseUrl: string;
  isProduction?: boolean;
}

interface ChargeRequest {
  method: string;
  amount: number;
  currency: string;
  description: string;
  customer: {
    name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    address?: {
      line1: string;
      postal_code: string;
      state: string;
      city: string;
      country_code: string;
    };
  };
  redirect_url?: string;
}

interface ChargeResponse {
  id: string;
  amount: number;
  authorization?: string;
  method: string;
  operation_type: string;
  transaction_type: string;
  card?: any;
  status: string;
  currency: string;
  creation_date: string;
  operation_date?: string;
  description: string;
  error_message?: string;
  order_id?: string;
  payment_url?: string;
}

class OpenpayClient {
  private config: OpenpayConfig;

  constructor(config: OpenpayConfig) {
    this.config = config;
  }

  private getAuthHeader(): string {
    const credentials = `${this.config.privateKey}:`;
    return Buffer.from(credentials).toString('base64');
  }

  private getBaseUrl(): string {
    return this.config.baseUrl || 
           (this.config.isProduction 
             ? 'https://api.openpay.mx/v1' 
             : 'https://sandbox-api.openpay.mx/v1');
  }

  async createCharge(chargeData: ChargeRequest): Promise<ChargeResponse> {
    try {
      const response = await axios.post(
        `${this.getBaseUrl()}/${this.config.merchantId}/charges`,
        chargeData,
        {
          headers: {
            'Authorization': `Basic ${this.getAuthHeader()}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating charge:', error.response?.data || error.message);
      throw new Error(`Failed to create charge: ${error.response?.data?.description || error.message}`);
    }
  }

  async getCharge(chargeId: string): Promise<ChargeResponse> {
    try {
      const response = await axios.get(
        `${this.getBaseUrl()}/${this.config.merchantId}/charges/${chargeId}`,
        {
          headers: {
            'Authorization': `Basic ${this.getAuthHeader()}`,
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error getting charge:', error.response?.data || error.message);
      throw new Error(`Failed to get charge: ${error.response?.data?.description || error.message}`);
    }
  }

  async createCustomer(customerData: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.getBaseUrl()}/${this.config.merchantId}/customers`,
        customerData,
        {
          headers: {
            'Authorization': `Basic ${this.getAuthHeader()}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating customer:', error.response?.data || error.message);
      throw new Error(`Failed to create customer: ${error.response?.data?.description || error.message}`);
    }
  }
}

// Configuración singleton
let openpayClient: OpenpayClient | null = null;

export const getOpenpayClient = (): OpenpayClient => {
  if (!openpayClient) {
    // Obtener credenciales del archivo de secretos de API solo en servidor
    let secrets: any = {};
    
    if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
      try {
        const fs = require('fs');
        const path = require('path');
        const secretsPath = path.join(process.env.HOME || '/home/ubuntu', '.api_secret_infos', 'api_secrets.json');
        
        if (fs.existsSync(secretsPath)) {
          const secretsData = fs.readFileSync(secretsPath, 'utf8');
          const allSecrets = JSON.parse(secretsData);
          secrets = allSecrets.OPENPAY?.secrets || {};
        }
      } catch (error) {
        console.warn('Could not load Openpay secrets from file, using environment variables');
      }
    }
    
    const config: OpenpayConfig = {
      merchantId: secrets.MERCHANT_ID || process.env.OPENPAY_MERCHANT_ID || '',
      privateKey: secrets.PRIVATE_KEY || process.env.OPENPAY_PRIVATE_KEY || '',
      baseUrl: secrets.BASE_URL || process.env.OPENPAY_BASE_URL || '',
      isProduction: process.env.NODE_ENV === 'production',
    };

    if (!config.merchantId || !config.privateKey) {
      console.warn('Openpay credentials not configured - using demo mode');
      // Para desarrollo, usar valores por defecto
      config.merchantId = 'demo_merchant';
      config.privateKey = 'demo_key';
      config.baseUrl = 'https://sandbox-api.openpay.mx/v1';
    }

    openpayClient = new OpenpayClient(config);
  }

  return openpayClient;
};

export { OpenpayClient };
export type { ChargeRequest, ChargeResponse };
