import { useState, useEffect } from 'react';

// تحديد ما إذا كان التطبيق يعمل في Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI;

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  location: string;
  images: string[];
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  created_at: string;
  updated_at: string;
  synced: boolean;
}

interface Favorite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
  synced: boolean;
}

interface SyncStatus {
  pendingCount: number;
  isOnline: boolean;
  lastSync: string | null;
}

export function useElectronDB() {
  const [isConnected, setIsConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    pendingCount: 0,
    isOnline: false,
    lastSync: null
  });

  useEffect(() => {
    setIsConnected(isElectron);
    
    if (isElectron) {
      // تحديث حالة المزامنة دورياً
      const updateSyncStatus = async () => {
        try {
          if (window.electronSync) {
            const status = await window.electronSync.getSyncStatus();
            setSyncStatus(status);
          }
        } catch (error) {
          console.error('خطأ في تحديث حالة المزامنة:', error);
        }
      };

      updateSyncStatus();
      const interval = setInterval(updateSyncStatus, 30000); // كل 30 ثانية

      return () => clearInterval(interval);
    }
  }, []);

  // دوال العقارات
  const getAllProperties = async (): Promise<Property[]> => {
    if (!isElectron) return [];
    try {
      return await window.electronAPI.db.getAllProperties();
    } catch (error) {
      console.error('خطأ في جلب العقارات:', error);
      return [];
    }
  };

  const getProperty = async (id: string): Promise<Property | null> => {
    if (!isElectron) return null;
    try {
      return await window.electronAPI.db.getProperty(id);
    } catch (error) {
      console.error('خطأ في جلب العقار:', error);
      return null;
    }
  };

  const insertProperty = async (property: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'synced'>): Promise<Property | null> => {
    if (!isElectron) return null;
    try {
      return await window.electronAPI.db.insertProperty(property);
    } catch (error) {
      console.error('خطأ في إضافة العقار:', error);
      return null;
    }
  };

  const updateProperty = async (id: string, updates: Partial<Property>): Promise<Property | null> => {
    if (!isElectron) return null;
    try {
      return await window.electronAPI.db.updateProperty(id, updates);
    } catch (error) {
      console.error('خطأ في تحديث العقار:', error);
      return null;
    }
  };

  const deleteProperty = async (id: string): Promise<boolean> => {
    if (!isElectron) return false;
    try {
      return await window.electronAPI.db.deleteProperty(id);
    } catch (error) {
      console.error('خطأ في حذف العقار:', error);
      return false;
    }
  };

  // دوال المفضلة
  const getFavorites = async (userId: string): Promise<Favorite[]> => {
    if (!isElectron) return [];
    try {
      return await window.electronAPI.db.getFavorites(userId);
    } catch (error) {
      console.error('خطأ في جلب المفضلة:', error);
      return [];
    }
  };

  const addFavorite = async (userId: string, propertyId: string): Promise<Favorite | null> => {
    if (!isElectron) return null;
    try {
      return await window.electronAPI.db.addFavorite(userId, propertyId);
    } catch (error) {
      console.error('خطأ في إضافة للمفضلة:', error);
      return null;
    }
  };

  const removeFavorite = async (userId: string, propertyId: string): Promise<boolean> => {
    if (!isElectron) return false;
    try {
      return await window.electronAPI.db.removeFavorite(userId, propertyId);
    } catch (error) {
      console.error('خطأ في إزالة من المفضلة:', error);
      return false;
    }
  };

  // دوال المزامنة
  const syncNow = async () => {
    if (!isElectron || !window.electronSync) return [];
    try {
      return await window.electronSync.syncNow();
    } catch (error) {
      console.error('خطأ في المزامنة:', error);
      return [];
    }
  };

  const getSyncQueue = async () => {
    if (!isElectron) return [];
    try {
      return await window.electronAPI.db.getSyncQueue();
    } catch (error) {
      console.error('خطأ في جلب قائمة المزامنة:', error);
      return [];
    }
  };

  const clearSyncQueue = async (): Promise<boolean> => {
    if (!isElectron) return false;
    try {
      return await window.electronAPI.db.clearSyncQueue();
    } catch (error) {
      console.error('خطأ في مسح قائمة المزامنة:', error);
      return false;
    }
  };

  // دوال الإعدادات
  const getSetting = async (key: string) => {
    if (!isElectron) return null;
    try {
      return await window.electronAPI.db.getSetting(key);
    } catch (error) {
      console.error('خطأ في جلب الإعداد:', error);
      return null;
    }
  };

  const setSetting = async (key: string, value: unknown): Promise<boolean> => {
    if (!isElectron) return false;
    try {
      return await window.electronAPI.db.setSetting(key, value);
    } catch (error) {
      console.error('خطأ في حفظ الإعداد:', error);
      return false;
    }
  };

  return {
    isConnected,
    syncStatus,
    
    // دوال العقارات
    getAllProperties,
    getProperty,
    insertProperty,
    updateProperty,
    deleteProperty,
    
    // دوال المفضلة
    getFavorites,
    addFavorite,
    removeFavorite,
    
    // دوال المزامنة
    syncNow,
    getSyncQueue,
    clearSyncQueue,
    
    // دوال الإعدادات
    getSetting,
    setSetting
  };
}
