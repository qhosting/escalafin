
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface ChatwootSDK {
  run: (config: any) => void;
  toggle: (state?: 'open' | 'close') => void;
  setUser: (identifier: string, user: any) => void;
  setCustomAttributes: (attributes: any) => void;
  deleteUser: () => void;
  setLabel: (label: string) => void;
  removeLabel: (label: string) => void;
  setLocale: (locale: string) => void;
}

interface ChatwootWindow extends Window {
  $chatwoot?: any;
  chatwootSDK?: ChatwootSDK;
}

declare let window: ChatwootWindow;

/**
 * Hook para interactuar con Chatwoot
 */
export function useChatwoot() {
  const { data: session } = useSession() || {};
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Verificar si Chatwoot está cargado
    const checkChatwoot = setInterval(() => {
      if (window.chatwootSDK && window.$chatwoot) {
        setIsLoaded(true);
        clearInterval(checkChatwoot);
      }
    }, 500);

    return () => clearInterval(checkChatwoot);
  }, []);

  /**
   * Abre el widget de chat
   */
  const openChat = () => {
    if (window.$chatwoot) {
      window.$chatwoot.toggle('open');
      setIsOpen(true);
    }
  };

  /**
   * Cierra el widget de chat
   */
  const closeChat = () => {
    if (window.$chatwoot) {
      window.$chatwoot.toggle('close');
      setIsOpen(false);
    }
  };

  /**
   * Alterna el estado del widget
   */
  const toggleChat = () => {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  };

  /**
   * Establece atributos personalizados del usuario
   */
  const setCustomAttributes = (attributes: Record<string, any>) => {
    if (window.$chatwoot) {
      window.$chatwoot.setCustomAttributes(attributes);
    }
  };

  /**
   * Establece una etiqueta
   */
  const setLabel = (label: string) => {
    if (window.$chatwoot) {
      window.$chatwoot.setLabel(label);
    }
  };

  /**
   * Elimina una etiqueta
   */
  const removeLabel = (label: string) => {
    if (window.$chatwoot) {
      window.$chatwoot.removeLabel(label);
    }
  };

  /**
   * Cambia el idioma del widget
   */
  const setLocale = (locale: string) => {
    if (window.$chatwoot) {
      window.$chatwoot.setLocale(locale);
    }
  };

  return {
    isLoaded,
    isOpen,
    openChat,
    closeChat,
    toggleChat,
    setCustomAttributes,
    setLabel,
    removeLabel,
    setLocale,
  };
}
