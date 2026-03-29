
'use client';

/**
 * Unified PWA Storage Utility
 * Consolidates MobileStorage and OfflineStorage into a single, tenant-aware IndexedDB manager.
 */

const BASE_DB_NAME = 'EscalaFin_PWA';
const VERSION = 2; // Incremented to allow schema changes

export const STORES = {
  CLIENTS: 'clients',
  LOANS: 'loans',
  PAYMENTS: 'payments',
  OFFLINE_QUEUE: 'offline_queue',
  METADATA: 'metadata'
};

export class PWAStorage {
  private db: IDBDatabase | null = null;
  private tenantId: string;

  constructor(tenantId: string = 'default') {
    this.tenantId = tenantId;
  }

  private get dbName() {
    return `${BASE_DB_NAME}_${this.tenantId}`;
  }

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.CLIENTS)) {
          db.createObjectStore(STORES.CLIENTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.LOANS)) {
          db.createObjectStore(STORES.LOANS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.PAYMENTS)) {
          db.createObjectStore(STORES.PAYMENTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
          db.createObjectStore(STORES.OFFLINE_QUEUE, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName: string, data: any): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName: string, id: string): Promise<any> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: any): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Offline Sync Queue Management
   */
  async addToQueue(type: string, data: any): Promise<number> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
      const store = transaction.objectStore(STORES.OFFLINE_QUEUE);
      const request = store.add({
        type,
        data,
        timestamp: Date.now(),
        synced: false
      });

      request.onsuccess = () => {
        // Try to trigger background sync if supported
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready.then((registration: any) => {
            registration.sync.register('offline-sync').catch(console.error);
          });
        }
        resolve(request.result as number);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingFromQueue(): Promise<any[]> {
    const all = await this.getAll(STORES.OFFLINE_QUEUE);
    return all.filter(item => !item.synced);
  }

  /**
   * Helper to clear all data for this tenant
   */
  async purge(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
