/**
 * Mobile Storage Utility for Offline Operations
 * Uses IndexedDB to store routes and pending payments
 */

const DB_NAME = 'EscalaFinMobileDB';
const DB_VERSION = 1;

export const STORES = {
    TODAY_ROUTE: 'today_route',
    PENDING_PAYMENTS: 'pending_payments',
    CLIENTS_CACHE: 'clients_cache',
};

export class MobileStorage {
    private static db: IDBDatabase | null = null;

    static async init(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains(STORES.TODAY_ROUTE)) {
                    db.createObjectStore(STORES.TODAY_ROUTE, { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains(STORES.PENDING_PAYMENTS)) {
                    db.createObjectStore(STORES.PENDING_PAYMENTS, { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains(STORES.CLIENTS_CACHE)) {
                    db.createObjectStore(STORES.CLIENTS_CACHE, { keyPath: 'id' });
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(request.result);
            };

            request.onerror = () => reject(request.error);
        });
    }

    // Generic Get All
    static async getAll<T>(storeName: string): Promise<T[]> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic Save
    static async put(storeName: string, data: any): Promise<void> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Generic Delete
    static async delete(storeName: string, id: string): Promise<void> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Clear Store
    static async clear(storeName: string): Promise<void> {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Specifically for Today's Route
     */
    static async saveTodayRoute(loans: any[]): Promise<void> {
        await this.clear(STORES.TODAY_ROUTE);
        for (const loan of loans) {
            await this.put(STORES.TODAY_ROUTE, loan);
        }
    }

    /**
     * Specifically for Pending Payments (Outbox)
     */
    static async addPendingPayment(payment: any): Promise<void> {
        const id = `local_${Date.now()}`;
        await this.put(STORES.PENDING_PAYMENTS, { ...payment, id, createdAt: new Date().toISOString() });
    }

    static async getPendingPayments(): Promise<any[]> {
        return this.getAll(STORES.PENDING_PAYMENTS);
    }
}
