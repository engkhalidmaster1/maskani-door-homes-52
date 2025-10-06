const { contextBridge, ipcRenderer } = require('electron');

// تعريض APIs آمنة لـRenderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // معلومات النظام
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  
  // فتح الروابط الخارجية
  openExternal: (url) => {
    return ipcRenderer.invoke('open-external', url);
  },
  
  // معلومات التطبيق
  isElectron: true,
  appVersion: '1.0.0',
  
  // الإشعارات المحلية
  showNotification: (title, body) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  },
  
  // طلب إذن الإشعارات
  requestNotificationPermission: async () => {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  },

  // دوال قاعدة البيانات - العقارات
  db: {
    // العقارات
    getAllProperties: () => ipcRenderer.invoke('db:getAllProperties'),
    getProperty: (id) => ipcRenderer.invoke('db:getProperty', id),
    insertProperty: (property) => ipcRenderer.invoke('db:insertProperty', property),
    updateProperty: (id, updates) => ipcRenderer.invoke('db:updateProperty', id, updates),
    deleteProperty: (id) => ipcRenderer.invoke('db:deleteProperty', id),
    
    // المفضلة
    getFavorites: (userId) => ipcRenderer.invoke('db:getFavorites', userId),
    addFavorite: (userId, propertyId) => ipcRenderer.invoke('db:addFavorite', userId, propertyId),
    removeFavorite: (userId, propertyId) => ipcRenderer.invoke('db:removeFavorite', userId, propertyId),
    
    // المزامنة
    getSyncQueue: () => ipcRenderer.invoke('db:getSyncQueue'),
    markSynced: (syncId) => ipcRenderer.invoke('db:markSynced', syncId),
    clearSyncQueue: () => ipcRenderer.invoke('db:clearSyncQueue'),
    
    // الإعدادات
    getSetting: (key) => ipcRenderer.invoke('db:getSetting', key),
    setSetting: (key, value) => ipcRenderer.invoke('db:setSetting', key, value)
  },

  // معلومات التطبيق
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getUserDataPath: () => ipcRenderer.invoke('app:getUserDataPath'),
    isOnline: () => ipcRenderer.invoke('app:isOnline')
  }
});

// إضافة كلاس يوضح أن التطبيق يعمل في Electron
window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('electron-app');
});

// دوال مساعدة للمزامنة
contextBridge.exposeInMainWorld('electronSync', {
  // مزامنة فورية
  syncNow: async () => {
    try {
      const syncQueue = await window.electronAPI.db.getSyncQueue();
      console.log('بدء المزامنة، عدد العناصر:', syncQueue.length);
      
      // إرسال إشعار عن بدء المزامنة
      if (syncQueue.length > 0) {
        window.electronAPI.showNotification('بدء المزامنة', `مزامنة ${syncQueue.length} عنصر...`);
      }
      
      // هنا يمكن إضافة منطق المزامنة مع الخادم
      // في الوقت الحالي، نكتفي بعرض القائمة
      
      return syncQueue;
    } catch (error) {
      console.error('خطأ في المزامنة:', error);
      return [];
    }
  },
  
  // مزامنة دورية
  periodicSync: async () => {
    try {
      const isOnline = await window.electronAPI.app.isOnline();
      if (!isOnline) {
        console.log('غير متصل - تم تخطي المزامنة الدورية');
        return;
      }
      
      const syncQueue = await window.electronAPI.db.getSyncQueue();
      if (syncQueue.length > 0) {
        console.log('مزامنة دورية:', syncQueue.length, 'عناصر');
        // هنا يتم تنفيذ المزامنة الفعلية
      }
    } catch (error) {
      console.error('خطأ في المزامنة الدورية:', error);
    }
  },
  
  // الحصول على حالة المزامنة
  getSyncStatus: async () => {
    try {
      const syncQueue = await window.electronAPI.db.getSyncQueue();
      const isOnline = await window.electronAPI.app.isOnline();
      
      return {
        pendingCount: syncQueue.length,
        isOnline,
        lastSync: await window.electronAPI.db.getSetting('last_sync_time')
      };
    } catch (error) {
      console.error('خطأ في الحصول على حالة المزامنة:', error);
      return { pendingCount: 0, isOnline: false, lastSync: null };
    }
  }
});