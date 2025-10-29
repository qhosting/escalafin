
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface ChatwootWidgetProps {
  /**
   * Si se debe mostrar el widget
   */
  enabled?: boolean;
  
  /**
   * Si se debe cargar automáticamente la información del usuario
   */
  autoLoadUser?: boolean;
}

interface ChatwootConfig {
  baseUrl: string;
  websiteToken: string;
  enabled: boolean;
  isConfigured: boolean;
}

/**
 * Componente que carga el widget de Chatwoot
 * Obtiene la configuración desde la API (BD o variables de entorno)
 */
export function ChatwootWidget({ 
  enabled = true, 
  autoLoadUser = true 
}: ChatwootWidgetProps) {
  const { data: session } = useSession() || {};
  const [config, setConfig] = useState<ChatwootConfig | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Cargar configuración desde la API
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/public/chatwoot/config');
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (error) {
        console.error('Error loading Chatwoot config:', error);
      } finally {
        setConfigLoaded(true);
      }
    };

    loadConfig();
  }, []);

  useEffect(() => {
    if (!enabled || !configLoaded) return;
    if (typeof window === 'undefined') return;
    if (!config || !config.enabled || !config.isConfigured) return;

    const { websiteToken, baseUrl } = config;

    if (!websiteToken || !baseUrl) {
      console.warn('Chatwoot configuration incomplete');
      return;
    }

    // Evitar cargar el script múltiples veces
    if ((window as any).chatwootSDK) {
      console.log('Chatwoot SDK already loaded');
      return;
    }

    // Crear el script del SDK
    const script = document.createElement('script');
    script.src = `${baseUrl}/packs/js/sdk.js`;
    script.defer = true;
    script.async = true;

    script.onload = () => {
      if ((window as any).chatwootSDK) {
        (window as any).chatwootSDK.run({
          websiteToken,
          baseUrl,
        });

        // Si hay sesión y se debe cargar automáticamente, configurar el usuario
        if (autoLoadUser && session?.user) {
          setTimeout(() => {
            if ((window as any).$chatwoot) {
              const user = session.user as any;
              (window as any).$chatwoot.setUser(user.id, {
                name: user.name || 'Usuario',
                email: user.email,
                identifier_hash: '', // Se puede generar en el backend si se necesita verificación
              });

              // Configurar atributos personalizados
              (window as any).$chatwoot.setCustomAttributes({
                role: user.role,
                userId: user.id,
              });
            }
          }, 1000);
        }
      }
    };

    script.onerror = (error) => {
      console.error('Error loading Chatwoot SDK:', error);
    };

    document.head.appendChild(script);

    // Cleanup
    return () => {
      // No remover el script ya que Chatwoot maneja su propio ciclo de vida
    };
  }, [enabled, config, configLoaded, session, autoLoadUser]);

  // Este componente no renderiza nada visible
  return null;
}
