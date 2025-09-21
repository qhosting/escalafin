
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PWAInstaller } from '@/lib/pwa-utils';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

interface PWAInstallPromptProps {
  appName?: string;
  description?: string;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  appName = 'EscalaFin',
  description = 'Instala la app para acceso rápido y funcionalidad offline'
}) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [installer, setInstaller] = useState<PWAInstaller | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const pwaInstaller = new PWAInstaller();
    setInstaller(pwaInstaller);

    // Show prompt after 30 seconds if can install
    const timer = setTimeout(() => {
      if (pwaInstaller.canInstall()) {
        setShowPrompt(true);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleInstall = async () => {
    if (!installer) return;

    setIsInstalling(true);
    try {
      const success = await installer.install();
      if (success) {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Error installing app:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt || !installer?.canInstall()) {
    return null;
  }

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Instalar {appName}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-green-600" />
              <span>Acceso desde home</span>
            </div>
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-blue-600" />
              <span>Funciona offline</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1"
            >
              {isInstalling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Instalando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Instalar
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
              disabled={isInstalling}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PWAInstallPrompt;
