
'use client';

// PWA Installation utilities
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export class PWAInstaller {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;

  constructor() {
    this.init();
  }

  private init() {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
    });

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
    });

    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true) {
      this.isInstalled = true;
    }
  }

  async install(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;

      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  }

  canInstall(): boolean {
    return !!this.deferredPrompt && !this.isInstalled;
  }

  isAppInstalled(): boolean {
    return this.isInstalled;
  }
}

// Service Worker registration
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado:', registration);
      return registration;
    } catch (error) {
      console.error('Error registrando Service Worker:', error);
      return null;
    }
  }
  return null;
};

// Offline storage using IndexedDB
export class OfflineStorage {
  private db: IDBDatabase | null = null;
  private dbName = 'EscalaFinDB';
  private readonly version = 1;

  async init(tenantId?: string | null): Promise<void> {
    const finalDbName = tenantId ? `${this.dbName}_${tenantId}` : this.dbName;
    
    // Abrir DB principal del tenant
    await this.openDatabase(finalDbName);
    
    // Abrir DB global de cola offline (para que el SW pueda acceder fácilmente)
    await this.openOfflineDatabase();
  }

  private openDatabase(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, this.version);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('clients')) db.createObjectStore('clients', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('loans')) db.createObjectStore('loans', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('payments')) db.createObjectStore('payments', { keyPath: 'id' });
      };
    });
  }

  private openOfflineDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('EscalaFin_Offline', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('offline_queue')) {
          db.createObjectStore('offline_queue', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  /**
   * Elimina la base de datos local para un tenant específico (ej. al cerrar sesión)
   */
  async purge(tenantId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(`${this.dbName}_${tenantId}`);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async store(storeName: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get(storeName: string, key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async addToOfflineQueue(action: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('EscalaFin_Offline', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offline_queue'], 'readwrite');
        const store = transaction.objectStore('offline_queue');
        store.put({
          ...action,
          timestamp: Date.now(),
          synced: false
        });
        
        transaction.oncomplete = async () => {
          // Registrar evento de sincronización
          if ('serviceWorker' in navigator && 'SyncManager' in window) {
            try {
              const registration = await navigator.serviceWorker.ready;
              await (registration as any).sync.register('offline-sync');
            } catch (err) {
              console.error('Error registering sync:', err);
            }
          }
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getOfflineQueue(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('EscalaFin_Offline', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offline_queue'], 'readonly');
        const store = transaction.objectStore('offline_queue');
        const getRequest = store.getAll();
        getRequest.onsuccess = () => {
          resolve(getRequest.result.filter((item: any) => !item.synced));
        };
      };
      request.onerror = () => reject(request.error);
    });
  }

  async markAsSynced(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('EscalaFin_Offline', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offline_queue'], 'readwrite');
        const store = transaction.objectStore('offline_queue');
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
          const item = getRequest.result;
          if (item) {
            item.synced = true;
            store.put(item);
          }
        };
        transaction.oncomplete = () => resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// Network status detector
export class NetworkDetector {
  private isOnline = navigator.onLine;
  private listeners: Array<(online: boolean) => void> = [];

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  onNetworkChange(callback: (online: boolean) => void): void {
    this.listeners.push(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.isOnline));
  }
}

// Push notification utilities
export const subscribeToPushNotifications = async (): Promise<PushSubscription | null> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    });

    // Send subscription to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    });

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
};
