import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

// Extend Window interface for Electron API
declare global {
  interface Window {
    electronAPI?: {
      db: {
        insertProperty: (data: Record<string, unknown>) => Promise<unknown>;
        updateProperty: (id: unknown, data: Record<string, unknown>) => Promise<unknown>;
        deleteProperty: (id: unknown) => Promise<unknown>;
        getSyncQueue: () => Promise<ElectronSyncItem[]>;
      };
    };
  }
}

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;

// Constants
const OFFLINE_ACTIONS_KEY = 'maskani_offline_actions';
const MAX_RETRY_COUNT = 3;

export interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

interface UseOfflineSyncReturn {
  isOnline: boolean;
  pendingActions: OfflineAction[];
  addOfflineAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => void;
  syncPendingActions: () => Promise<void>;
  clearPendingActions: () => void;
}

interface ElectronSyncItem {
  id: string;
  table: string;
  action: string;
  data: Record<string, unknown>;
  timestamp: string;
  attempts: number;
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);

  const syncPendingActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0) return;

    const successfulActions: string[] = [];
    const failedActions: OfflineAction[] = [];

    for (const action of pendingActions) {
      try {
        let response;

        if (isElectron) {
          // Use IPC for Electron local database
          switch (action.type) {
            case 'CREATE':
              response = await window.electronAPI!.db.insertProperty(action.data);
              break;
            case 'UPDATE':
              response = await window.electronAPI!.db.updateProperty(action.data.id, action.data);
              break;
            case 'DELETE':
              response = await window.electronAPI!.db.deleteProperty(action.data.id);
              break;
            default:
              throw new Error(`Unsupported action type: ${action.type}`);
          }
          // In Electron, success if response is not null/undefined
          if (response) {
            successfulActions.push(action.id);
          } else {
            throw new Error('IPC operation failed');
          }
        } else {
          // Use fetch for web mode
          response = await fetch(action.endpoint, {
            method:
              action.type === 'CREATE'
                ? 'POST'
                : action.type === 'UPDATE'
                  ? 'PUT'
                  : 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: action.type !== 'DELETE' ? JSON.stringify(action.data) : undefined,
          });

          if (response.ok) {
            successfulActions.push(action.id);
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        }
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);

        if (action.retryCount < MAX_RETRY_COUNT) {
          failedActions.push({
            ...action,
            retryCount: action.retryCount + 1,
          });
        }
      }
    }

    setPendingActions(failedActions);

    if (successfulActions.length > 0) {
      toast({
        title: "تمت المزامنة بنجاح",
        description: `تم مزامنة ${successfulActions.length} عنصر`,
        duration: 3000,
      });
    }

    if (failedActions.length > 0) {
      toast({
        title: "فشل في مزامنة بعض العناصر",
        description: `${failedActions.length} عنصر في انتظار إعادة المحاولة`,
        duration: 5000,
        variant: "destructive",
      });
    }
  }, [isOnline, pendingActions]);

  // تحديث حالة الاتصال
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "تم الاتصال بالإنترنت",
        description: "سيتم مزامنة البيانات تلقائياً",
        duration: 3000,
      });
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "انقطع الاتصال بالإنترنت",
        description: "سيتم حفظ التغييرات محلياً ومزامنتها عند عودة الاتصال",
        duration: 5000,
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingActions]);

  // تحميل الأعمال المعلقة من localStorage أو Electron
  useEffect(() => {
    const loadPendingActions = async () => {
      try {
        if (isElectron) {
          // Load from Electron local database
          const syncQueue = await window.electronAPI!.db.getSyncQueue();
          const formattedActions: OfflineAction[] = syncQueue.map((item: ElectronSyncItem) => ({
            id: item.id,
            type: item.action.toUpperCase() as 'CREATE' | 'UPDATE' | 'DELETE',
            endpoint: '', // Not needed for IPC
            data: item.data,
            timestamp: new Date(item.timestamp).getTime(),
            retryCount: item.attempts || 0,
          }));
          setPendingActions(formattedActions);
        } else {
          // Load from localStorage
          const savedActions = localStorage.getItem(OFFLINE_ACTIONS_KEY);
          if (savedActions) {
            setPendingActions(JSON.parse(savedActions));
          }
        }
      } catch (error) {
        console.error('Error loading pending actions:', error);
        // Fallback to localStorage if IPC fails
        const savedActions = localStorage.getItem(OFFLINE_ACTIONS_KEY);
        if (savedActions) {
          try {
            setPendingActions(JSON.parse(savedActions));
          } catch (parseError) {
            console.error('Error parsing offline actions:', parseError);
            localStorage.removeItem(OFFLINE_ACTIONS_KEY);
          }
        }
      }
    };

    loadPendingActions();
  }, []);

  // حفظ الأعمال المعلقة في localStorage أو Electron
  useEffect(() => {
    const savePendingActions = async () => {
      try {
        if (isElectron && pendingActions.length > 0) {
          // Convert to Electron format and save via IPC
          // Note: This is handled automatically by IPC operations above
          // No need to manually save here as IPC handles persistence
        } else if (!isElectron) {
          // Save to localStorage for web mode
          if (pendingActions.length > 0) {
            localStorage.setItem(OFFLINE_ACTIONS_KEY, JSON.stringify(pendingActions));
          } else {
            localStorage.removeItem(OFFLINE_ACTIONS_KEY);
          }
        }
      } catch (error) {
        console.error('Error saving pending actions:', error);
      }
    };

    savePendingActions();
  }, [pendingActions]);

  // إضافة عمل للقائمة المعلقة
  const addOfflineAction = useCallback((action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
    // Validate data size to prevent memory issues
    const dataSize = JSON.stringify(action.data).length;
    const MAX_DATA_SIZE = 1024 * 1024; // 1MB limit

    if (dataSize > MAX_DATA_SIZE) {
      toast({
        title: "خطأ في حفظ البيانات",
        description: "حجم البيانات كبير جداً للحفظ المؤقت",
        variant: "destructive",
      });
      return;
    }

    // Limit total pending actions to prevent memory issues
    const MAX_PENDING_ACTIONS = 100;
    if (pendingActions.length >= MAX_PENDING_ACTIONS) {
      toast({
        title: "قائمة المزامنة ممتلئة",
        description: "يرجى مزامنة البيانات المعلقة أولاً",
        variant: "destructive",
      });
      return;
    }

    const newAction: OfflineAction = {
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    setPendingActions(prev => [...prev, newAction]);

    toast({
      title: "تم حفظ العملية محلياً",
      description: "ستتم المزامنة عند عودة الاتصال بالإنترنت",
      duration: 3000,
    });
  }, [pendingActions.length]);

  // مزامنة الأعمال المعلقة
  // مسح الأعمال المعلقة
  const clearPendingActions = useCallback(() => {
    setPendingActions([]);
    localStorage.removeItem(OFFLINE_ACTIONS_KEY);
  }, []);

  // مزامنة تلقائية كل 30 ثانية عند الاتصال
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      syncPendingActions();
    }, 30000);

    return () => clearInterval(interval);
  }, [isOnline, syncPendingActions]);

  // تنظيف الذاكرة عند إلغاء الـ hook
  useEffect(() => {
    return () => {
      // Clear any pending timeouts/intervals
      // This is handled by the cleanup functions above
    };
  }, []);

  return {
    isOnline,
    pendingActions,
    addOfflineAction,
    syncPendingActions,
    clearPendingActions,
  };
}
