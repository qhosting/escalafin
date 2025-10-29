
/**
 * Chatwoot API Client
 * Maneja la integración con Chatwoot para chat en tiempo real
 * Configuración desde BD o variables de entorno
 */

import { prisma } from './prisma';

interface ChatwootConfig {
  baseUrl: string;
  websiteToken: string;
  accountId: string;
  apiAccessToken?: string;
  enabled: boolean;
}

interface ChatwootUser {
  identifier?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  phone_number?: string;
}

interface ChatwootMessage {
  content: string;
  message_type: 'outgoing' | 'incoming';
  private?: boolean;
}

interface ChatwootConversation {
  id: number;
  inbox_id: number;
  contact_id: number;
  status: 'open' | 'resolved' | 'pending';
  messages: any[];
}

class ChatwootClient {
  private config: ChatwootConfig;

  constructor(config: ChatwootConfig) {
    this.config = config;
  }

  /**
   * Inicializa el SDK de Chatwoot en el cliente
   */
  static initializeWidget(websiteToken: string, baseUrl: string, user?: ChatwootUser) {
    if (typeof window === 'undefined') return;

    // @ts-ignore
    window.$chatwoot = window.$chatwoot || {};
    
    // Configurar el widget
    const script = document.createElement('script');
    script.src = `${baseUrl}/packs/js/sdk.js`;
    script.defer = true;
    script.async = true;
    
    script.onload = () => {
      // @ts-ignore
      if (window.chatwootSDK) {
        // @ts-ignore
        window.chatwootSDK.run({
          websiteToken,
          baseUrl,
        });

        // Si hay información de usuario, configurarla
        if (user) {
          // @ts-ignore
          window.$chatwoot.setUser(user.identifier, {
            name: user.name,
            email: user.email,
            avatar_url: user.avatar_url,
            phone_number: user.phone_number,
          });
        }
      }
    };

    document.head.appendChild(script);
  }

  /**
   * Obtiene conversaciones del usuario
   */
  async getConversations(contactId: string): Promise<ChatwootConversation[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/v1/accounts/${this.config.accountId}/contacts/${contactId}/conversations`,
        {
          headers: {
            'api_access_token': this.config.apiAccessToken || '',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error fetching conversations: ${response.statusText}`);
      }

      const data = await response.json();
      return data.payload || [];
    } catch (error) {
      console.error('Error fetching Chatwoot conversations:', error);
      return [];
    }
  }

  /**
   * Envía un mensaje a una conversación
   */
  async sendMessage(
    conversationId: number,
    message: ChatwootMessage
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/v1/accounts/${this.config.accountId}/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api_access_token': this.config.apiAccessToken || '',
          },
          body: JSON.stringify(message),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error sending Chatwoot message:', error);
      return false;
    }
  }

  /**
   * Obtiene contacto por email
   */
  async getContactByEmail(email: string): Promise<any | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/v1/accounts/${this.config.accountId}/contacts/search?q=${email}`,
        {
          headers: {
            'api_access_token': this.config.apiAccessToken || '',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.payload?.[0] || null;
    } catch (error) {
      console.error('Error fetching Chatwoot contact:', error);
      return null;
    }
  }

  /**
   * Crea o actualiza un contacto
   */
  async upsertContact(user: ChatwootUser & { identifier: string }): Promise<any | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/v1/accounts/${this.config.accountId}/contacts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api_access_token': this.config.apiAccessToken || '',
          },
          body: JSON.stringify({
            identifier: user.identifier,
            name: user.name,
            email: user.email,
            phone_number: user.phone_number,
            avatar_url: user.avatar_url,
          }),
        }
      );

      if (!response.ok) {
        // Si falla, intentar buscar el contacto existente
        return await this.getContactByEmail(user.email || '');
      }

      return await response.json();
    } catch (error) {
      console.error('Error upserting Chatwoot contact:', error);
      return null;
    }
  }

  /**
   * Prueba la conexión con Chatwoot
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.baseUrl || !this.config.accountId) {
      return {
        success: false,
        message: 'Configuración incompleta: faltan baseUrl o accountId',
      };
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/v1/accounts/${this.config.accountId}`,
        {
          headers: {
            'api_access_token': this.config.apiAccessToken || '',
          },
        }
      );

      if (response.ok) {
        return {
          success: true,
          message: 'Conexión exitosa con Chatwoot',
        };
      } else {
        return {
          success: false,
          message: `Error de conexión: ${response.status} ${response.statusText}`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Error de conexión: ${error.message}`,
      };
    }
  }
}

/**
 * Obtiene la configuración de Chatwoot desde BD o variables de entorno
 * Prioridad: Base de datos > Variables de entorno
 */
export async function getChatwootConfig(): Promise<ChatwootConfig> {
  try {
    // Intentar obtener desde la base de datos primero
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'chatwoot_base_url',
            'chatwoot_website_token',
            'chatwoot_account_id',
            'chatwoot_api_access_token',
            'chatwoot_enabled',
          ],
        },
      },
    });

    const configMap = configs.reduce((acc: Record<string, string>, config: { key: string; value: string }) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);

    // Si hay configuración en BD, usarla
    if (configMap['chatwoot_base_url']) {
      return {
        baseUrl: configMap['chatwoot_base_url'] || '',
        websiteToken: configMap['chatwoot_website_token'] || '',
        accountId: configMap['chatwoot_account_id'] || '1',
        apiAccessToken: configMap['chatwoot_api_access_token'],
        enabled: configMap['chatwoot_enabled'] === 'true',
      };
    }
  } catch (error) {
    console.error('Error fetching Chatwoot config from DB:', error);
  }

  // Fallback a variables de entorno
  return {
    baseUrl: process.env.CHATWOOT_BASE_URL || '',
    websiteToken: process.env.CHATWOOT_WEBSITE_TOKEN || '',
    accountId: process.env.CHATWOOT_ACCOUNT_ID || '1',
    apiAccessToken: process.env.CHATWOOT_API_ACCESS_TOKEN,
    enabled: process.env.CHATWOOT_ENABLED === 'true' || !!process.env.CHATWOOT_BASE_URL,
  };
}

/**
 * Obtiene la configuración de Chatwoot desde variables de entorno (solo servidor)
 */
function getChatwootConfigFromEnv(): ChatwootConfig {
  return {
    baseUrl: process.env.CHATWOOT_BASE_URL || '',
    websiteToken: process.env.CHATWOOT_WEBSITE_TOKEN || '',
    accountId: process.env.CHATWOOT_ACCOUNT_ID || '1',
    apiAccessToken: process.env.CHATWOOT_API_ACCESS_TOKEN,
    enabled: process.env.CHATWOOT_ENABLED === 'true' || !!process.env.CHATWOOT_BASE_URL,
  };
}

// Cliente singleton
let chatwootClient: ChatwootClient | null = null;

export async function getChatwootClient(): Promise<ChatwootClient> {
  const config = await getChatwootConfig();
  
  if (!chatwootClient || chatwootClient['config'] !== config) {
    chatwootClient = new ChatwootClient(config);
  }
  
  return chatwootClient;
}

export { ChatwootClient };
export type { ChatwootConfig, ChatwootUser, ChatwootMessage, ChatwootConversation };
