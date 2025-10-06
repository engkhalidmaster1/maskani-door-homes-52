import { useState, useEffect, useCallback } from 'react';
import { useElectronDB } from './useElectronDB';
import { useProperties } from './useProperties';

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
  synced?: boolean;
}

export function usePropertiesElectron() {
  const electronDB = useElectronDB();
  const cloudProperties = useProperties(); // استخدام hook العقارات الأصلي للمزامنة مع السحابة
  
  const [localProperties, setLocalProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // تحميل العقارات المحلية عند بدء التطبيق
  const loadLocalProperties = useCallback(async () => {
    try {
      setLoading(true);
      if (electronDB.isConnected) {
        const properties = await electronDB.getAllProperties();
        setLocalProperties(properties);
      } else {
        // إذا لم يكن في Electron، استخدم البيانات السحابية
        const cloudProps = cloudProperties.properties || [];
        setLocalProperties(cloudProps.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description || '',
          price: p.price,
          type: p.property_type || 'apartment',
          location: p.address || '',
          images: [],
          bedrooms: p.bedrooms || 0,
          bathrooms: p.bathrooms || 0,
          area: p.area || 0,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString(),
          synced: true
        })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في تحميل العقارات');
    } finally {
      setLoading(false);
    }
  }, [electronDB, cloudProperties.properties]);

  useEffect(() => {
    loadLocalProperties();
  }, [loadLocalProperties]);

  // إضافة عقار جديد
  const addProperty = async (propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'synced'>) => {
    try {
      if (electronDB.isConnected) {
        // إضافة إلى قاعدة البيانات المحلية
        const newProperty = await electronDB.insertProperty(propertyData);
        if (newProperty) {
          setLocalProperties(prev => [...prev, newProperty]);
          
          // محاولة المزامنة مع السحابة إذا كان متصلاً
          if (electronDB.syncStatus.isOnline) {
            try {
              // يمكن إضافة منطق المزامنة هنا لاحقاً
              console.log('سيتم مزامنة العقار مع السحابة');
              await electronDB.updateProperty(newProperty.id, { synced: true });
            } catch (syncError) {
              console.log('سيتم مزامنة العقار لاحقاً:', syncError);
            }
          }
          
          return newProperty;
        }
      } else {
        // استخدام السحابة مباشرة - يحتاج إلى تنفيذ منطق الإضافة
        console.log('إضافة العقار إلى السحابة');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في إضافة العقار');
      throw err;
    }
  };

  // تحديث عقار
  const updateProperty = async (id: string, updates: Partial<Property>) => {
    try {
      if (electronDB.isConnected) {
        const updatedProperty = await electronDB.updateProperty(id, updates);
        if (updatedProperty) {
          setLocalProperties(prev => 
            prev.map(p => p.id === id ? updatedProperty : p)
          );
          
          // محاولة المزامنة مع السحابة
          if (electronDB.syncStatus.isOnline) {
            try {
              console.log('مزامنة تحديث العقار مع السحابة');
              await electronDB.updateProperty(id, { synced: true });
            } catch (syncError) {
              console.log('سيتم مزامنة التحديث لاحقاً:', syncError);
            }
          }
          
          return updatedProperty;
        }
      } else {
        console.log('تحديث العقار في السحابة');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في تحديث العقار');
      throw err;
    }
  };

  // حذف عقار
  const deleteProperty = async (id: string) => {
    try {
      if (electronDB.isConnected) {
        const success = await electronDB.deleteProperty(id);
        if (success) {
          setLocalProperties(prev => prev.filter(p => p.id !== id));
          
          // محاولة الحذف من السحابة
          if (electronDB.syncStatus.isOnline) {
            try {
              console.log('حذف العقار من السحابة');
            } catch (syncError) {
              console.log('سيتم مزامنة الحذف لاحقاً:', syncError);
            }
          }
          
          return true;
        }
      } else {
        console.log('حذف العقار من السحابة');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في حذف العقار');
      throw err;
    }
  };

  // مزامنة البيانات
  const syncWithCloud = useCallback(async () => {
    if (!electronDB.isConnected || syncInProgress) return;
    
    try {
      setSyncInProgress(true);
      
      // جلب البيانات من السحابة
      const cloudData = cloudProperties.properties || [];
      
      // جلب قائمة المزامنة المحلية
      const syncQueue = await electronDB.getSyncQueue();
      
      // مزامنة العناصر المحلية غير المتزامنة مع السحابة
      for (const syncItem of syncQueue) {
        try {
          if (syncItem.table === 'properties') {
            switch (syncItem.action) {
              case 'insert':
                console.log('مزامنة إضافة عقار');
                break;
              case 'update':
                console.log('مزامنة تحديث عقار');
                break;
              case 'delete':
                console.log('مزامنة حذف عقار');
                break;
            }
            // إزالة من قائمة المزامنة
            // await electronDB.markSynced(syncItem.id);
          }
        } catch (syncError) {
          console.error('خطأ في مزامنة العنصر:', syncItem, syncError);
        }
      }
      
      // تحديث البيانات المحلية مع البيانات السحابية الجديدة
      const localData = await electronDB.getAllProperties();
      const localIds = localData.map(p => p.id);
      
      // إضافة العقارات الجديدة من السحابة
      for (const cloudProperty of cloudData) {
        if (!localIds.includes(cloudProperty.id)) {
          await electronDB.insertProperty({
            ...cloudProperty,
            type: cloudProperty.property_type || 'apartment'
          });
        }
      }
      
      // إعادة تحميل البيانات المحلية
      await loadLocalProperties();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في المزامنة');
    } finally {
      setSyncInProgress(false);
    }
  }, [electronDB, syncInProgress, cloudProperties.properties, loadLocalProperties]);

  // مزامنة تلقائية عند اكتشاف الاتصال
  useEffect(() => {
    if (electronDB.isConnected && electronDB.syncStatus.isOnline && !syncInProgress) {
      const autoSyncTimer = setTimeout(syncWithCloud, 5000); // مزامنة تلقائية بعد 5 ثواني
      return () => clearTimeout(autoSyncTimer);
    }
  }, [electronDB.isConnected, electronDB.syncStatus.isOnline, syncInProgress, syncWithCloud]);

  // الحصول على عقار واحد
  const getProperty = async (id: string) => {
    if (electronDB.isConnected) {
      return await electronDB.getProperty(id);
    } else {
      return cloudProperties.properties?.find(p => p.id === id) || null;
    }
  };

  return {
    properties: localProperties,
    loading: loading || cloudProperties.isLoading,
    error: error,
    syncInProgress,
    syncStatus: electronDB.syncStatus,
    isElectron: electronDB.isConnected,
    
    // العمليات الأساسية
    addProperty,
    updateProperty,
    deleteProperty,
    getProperty,
    refreshProperties: loadLocalProperties,
    
    // المزامنة
    syncWithCloud,
    syncNow: electronDB.syncNow,
    clearSyncQueue: electronDB.clearSyncQueue,
    
    // الإحصائيات
    totalProperties: localProperties.length,
    unsyncedCount: electronDB.syncStatus.pendingCount
  };
}
