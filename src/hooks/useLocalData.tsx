import { useState, useEffect, useCallback } from 'react';

interface LocalStorageData {
  id: string;
  data: Record<string, unknown>;
  lastUpdated: number;
  synced: boolean;
}

interface UseLocalDataReturn<T> {
  localData: T[];
  addLocalData: (data: T) => Promise<void>;
  updateLocalData: (id: string, data: Partial<T>) => Promise<void>;
  deleteLocalData: (id: string) => Promise<void>;
  getLocalData: (id: string) => Promise<T | null>;
  clearLocalData: () => Promise<void>;
  markAsSynced: (id: string) => Promise<void>;
  getUnsyncedData: () => Promise<T[]>;
}

const DB_NAME = 'maskani_local_db';
const DB_VERSION = 1;

class LocalDatabase {
  private db: IDBDatabase | null = null;

  async init(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }
      };
    });
  }

  async add(storeName: string, data: LocalStorageData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName: string, data: LocalStorageData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName: string, id: string): Promise<LocalStorageData | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName: string): Promise<LocalStorageData[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex(storeName: string, indexName: string, value: IDBValidKey): Promise<LocalStorageData[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}

export function useLocalData<T extends { id?: string }>(storeName: string): UseLocalDataReturn<T> {
  const [localData, setLocalData] = useState<T[]>([]);
  const [db] = useState(() => new LocalDatabase());

  useEffect(() => {
    const initDB = async () => {
      try {
        await db.init(storeName);
        const data = await db.getAll(storeName);
        setLocalData(data.map(item => item.data as T));
      } catch (error) {
        console.error('Failed to initialize local database:', error);
      }
    };

    initDB();
  }, [db, storeName]);

  const addLocalData = useCallback(async (data: T): Promise<void> => {
    const id = data.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const localStorageData: LocalStorageData = {
      id,
      data: { ...data, id } as Record<string, unknown>,
      lastUpdated: Date.now(),
      synced: false,
    };

    try {
      await db.add(storeName, localStorageData);
      setLocalData(prev => [...prev, { ...data, id } as T]);
    } catch (error) {
      console.error('Failed to add local data:', error);
      throw error;
    }
  }, [db, storeName]);

  const updateLocalData = useCallback(async (id: string, updateData: Partial<T>): Promise<void> => {
    try {
      const existing = await db.get(storeName, id);
      if (!existing) throw new Error('Data not found');

      const updatedData = { ...existing.data, ...updateData } as T;
      const localStorageData: LocalStorageData = {
        id,
        data: updatedData as Record<string, unknown>,
        lastUpdated: Date.now(),
        synced: false,
      };

      await db.update(storeName, localStorageData);
      setLocalData(prev => prev.map(item => 
        (item as T & { id: string }).id === id ? updatedData : item
      ));
    } catch (error) {
      console.error('Failed to update local data:', error);
      throw error;
    }
  }, [db, storeName]);

  const deleteLocalData = useCallback(async (id: string): Promise<void> => {
    try {
      await db.delete(storeName, id);
      setLocalData(prev => prev.filter(item => (item as T & { id: string }).id !== id));
    } catch (error) {
      console.error('Failed to delete local data:', error);
      throw error;
    }
  }, [db, storeName]);

  const getLocalData = useCallback(async (id: string): Promise<T | null> => {
    try {
      const result = await db.get(storeName, id);
      return result ? result.data as T : null;
    } catch (error) {
      console.error('Failed to get local data:', error);
      return null;
    }
  }, [db, storeName]);

  const clearLocalData = useCallback(async (): Promise<void> => {
    try {
      await db.clear(storeName);
      setLocalData([]);
    } catch (error) {
      console.error('Failed to clear local data:', error);
      throw error;
    }
  }, [db, storeName]);

  const markAsSynced = useCallback(async (id: string): Promise<void> => {
    try {
      const existing = await db.get(storeName, id);
      if (!existing) return;

      const localStorageData: LocalStorageData = {
        ...existing,
        synced: true,
      };

      await db.update(storeName, localStorageData);
    } catch (error) {
      console.error('Failed to mark as synced:', error);
    }
  }, [db, storeName]);

  const getUnsyncedData = useCallback(async (): Promise<T[]> => {
    try {
      const unsyncedItems = await db.getByIndex(storeName, 'synced', 0); // false as 0
      return unsyncedItems.map(item => item.data as T);
    } catch (error) {
      console.error('Failed to get unsynced data:', error);
      return [];
    }
  }, [db, storeName]);

  return {
    localData,
    addLocalData,
    updateLocalData,
    deleteLocalData,
    getLocalData,
    clearLocalData,
    markAsSynced,
    getUnsyncedData,
  };
}
