/**
 * Motor de Sincronización Offline (IndexedDB + PWA Queue)
 * EscalaFin v3.0.0 - Producción
 * 
 * Permite registrar cobros y evidencias de visitas en zonas sin cobertura
 * y sincronizarlos automáticamente al recuperar la conexión.
 */

export interface OfflineTransaction {
  id: string; // UUID v4 o local id
  type: 'COLLECTION_PAYMENT' | 'VISIT_OUTCOME' | 'CREDIT_APPLICATION';
  payload: any;
  createdAt: string; // ISO string
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'SUCCESS';
  lastError?: string;
}

export class OfflineSyncEngine {
  private dbName = 'EscalaFinOfflineDB';
  private storeName = 'offline_queue';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = (event) => {
        reject(event);
      };
    });
  }

  async enqueueTransaction(type: OfflineTransaction['type'], payload: any): Promise<OfflineTransaction> {
    await this.ensureDb();
    const transaction: OfflineTransaction = {
      id: `off_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'PENDING',
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.add(transaction);

      req.onsuccess = () => resolve(transaction);
      req.onerror = (err) => reject(err);
    });
  }

  async getPendingTransactions(): Promise<OfflineTransaction[]> {
    await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const index = store.index('status');
      const req = index.getAll('PENDING');

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (err) => reject(err);
    });
  }

  async markAsSuccess(id: string): Promise<void> {
    await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = (err) => reject(err);
    });
  }

  async markAsFailed(id: string, error: string): Promise<void> {
    await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const record: OfflineTransaction = getReq.result;
        if (record) {
          record.retryCount += 1;
          record.status = record.retryCount > 5 ? 'FAILED' : 'PENDING';
          record.lastError = error;
          store.put(record);
        }
        resolve();
      };
      getReq.onerror = (err) => reject(err);
    });
  }

  async syncAll(syncEndpointHandler: (tx: OfflineTransaction) => Promise<boolean>): Promise<{ synced: number; failed: number }> {
    const pending = await this.getPendingTransactions();
    let synced = 0;
    let failed = 0;

    for (const tx of pending) {
      try {
        const success = await syncEndpointHandler(tx);
        if (success) {
          await this.markAsSuccess(tx.id);
          synced += 1;
        } else {
          await this.markAsFailed(tx.id, 'Respuesta fallida del servidor');
          failed += 1;
        }
      } catch (err: any) {
        await this.markAsFailed(tx.id, err?.message || 'Error de conexión');
        failed += 1;
      }
    }

    return { synced, failed };
  }

  private async ensureDb() {
    if (!this.db) {
      await this.init();
    }
  }
}

export const offlineSyncEngine = new OfflineSyncEngine();
export default offlineSyncEngine;
