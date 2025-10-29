
'use client';

import { useEffect } from 'react';
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

/**
 * Componente que carga el widget de Chatwoot
 */
export function ChatwootWidget({ 
  enabled = true, 
  autoLoadUser = true 
}: ChatwootWidgetProps) {
  const { data: session } = useSession() || {};

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    const websiteToken = process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN;
    const baseUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL;

    if (!websiteToken || !baseUrl) {
      console.warn('Chatwoot configuration missing');
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
              (window as any).$chatwoot.setUser(session.user.id, {
                name: session.user.name || 'Usuario',
                email: session.user.email,
                identifier_hash: '', // Se puede generar en el backend si se necesita verificación
              });

              // Configurar atributos personalizados
              (window as any).$chatwoot.setCustomAttributes({
                role: session.user.role,
                userId: session.user.id,
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
  }, [enabled, session, autoLoadUser]);

  // Este componente no renderiza nada visible
  return null;
}
