import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

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

const OFFLINE_ACTIONS_KEY = 'maskani_offline_actions';
const MAX_RETRY_COUNT = 3;

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);

  const syncPendingActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0) return;

    const successfulActions: string[] = [];
    const failedActions: OfflineAction[] = [];

    for (const action of pendingActions) {
      try {
        const response = await fetch(action.endpoint, {
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

  // تحميل الأعمال المعلقة من localStorage
  useEffect(() => {
    const savedActions = localStorage.getItem(OFFLINE_ACTIONS_KEY);
    if (savedActions) {
      try {
        setPendingActions(JSON.parse(savedActions));
      } catch (error) {
        console.error('Error parsing offline actions:', error);
        localStorage.removeItem(OFFLINE_ACTIONS_KEY);
      }
    }
  }, []);

  // حفظ الأعمال المعلقة في localStorage
  useEffect(() => {
    if (pendingActions.length > 0) {
      localStorage.setItem(OFFLINE_ACTIONS_KEY, JSON.stringify(pendingActions));
    } else {
      localStorage.removeItem(OFFLINE_ACTIONS_KEY);
    }
  }, [pendingActions]);

  // إضافة عمل للقائمة المعلقة
  const addOfflineAction = useCallback((action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
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
  }, []);

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

  return {
    isOnline,
    pendingActions,
    addOfflineAction,
    syncPendingActions,
    clearPendingActions,
  };
}
