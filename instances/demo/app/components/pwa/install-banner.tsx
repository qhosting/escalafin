
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PWAInstaller } from '@/lib/pwa-utils';
import { Download, X, Smartphone } from 'lucide-react';

export const InstallBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [installer, setInstaller] = useState<PWAInstaller | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const pwaInstaller = new PWAInstaller();
    setInstaller(pwaInstaller);

    // Show banner after 10 seconds if can install
    const timer = setTimeout(() => {
      if (pwaInstaller.canInstall() && !sessionStorage.getItem('install-banner-dismissed')) {
        setShowBanner(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleInstall = async () => {
    if (!installer) return;

    setIsInstalling(true);
    try {
      const success = await installer.install();
      if (success) {
        setShowBanner(false);
      }
    } catch (error) {
      console.error('Error installing app:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('install-banner-dismissed', 'true');
  };

  if (!showBanner || !installer?.canInstall()) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:max-w-sm">
      <Card className="border-blue-200 bg-blue-50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Smartphone className="h-6 w-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900">
                Instalar EscalaFin
              </h4>
              <p className="text-sm text-blue-700 mb-3">
                Acceso rápido desde tu pantalla principal
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isInstalling ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1" />
                      Instalando...
                    </>
                  ) : (
                    <>
                      <Download className="h-3 w-3 mr-1" />
                      Instalar
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  disabled={isInstalling}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallBanner;
