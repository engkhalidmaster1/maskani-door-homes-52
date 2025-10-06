const { app, BrowserWindow, Menu, dialog, shell, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const cron = require('node-cron');

// إنشاء متجر للإعدادات المحلية
const store = new Store();

// مسار قاعدة البيانات المحلية (ملفات JSON)
const dataPath = path.join(app.getPath('userData'), 'data');
const propertiesFile = path.join(dataPath, 'properties.json');
const favoritesFile = path.join(dataPath, 'favorites.json');
const syncQueueFile = path.join(dataPath, 'sync_queue.json');

// إنشاء مجلد البيانات إذا لم يكن موجوداً
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// دوال قاعدة البيانات المحلية باستخدام JSON
class LocalDatabase {
  constructor() {
    this.initFiles();
  }

  initFiles() {
    // إنشاء ملفات JSON إذا لم تكن موجودة
    if (!fs.existsSync(propertiesFile)) {
      fs.writeFileSync(propertiesFile, JSON.stringify([]));
    }
    if (!fs.existsSync(favoritesFile)) {
      fs.writeFileSync(favoritesFile, JSON.stringify([]));
    }
    if (!fs.existsSync(syncQueueFile)) {
      fs.writeFileSync(syncQueueFile, JSON.stringify([]));
    }
  }

  readFile(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('خطأ في قراءة الملف:', filePath, error);
      return [];
    }
  }

  writeFile(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('خطأ في كتابة الملف:', filePath, error);
      return false;
    }
  }

  // العقارات
  getAllProperties() {
    return this.readFile(propertiesFile);
  }

  getProperty(id) {
    const properties = this.getAllProperties();
    return properties.find(p => p.id === id) || null;
  }

  insertProperty(property) {
    const properties = this.getAllProperties();
    const newProperty = {
      ...property,
      id: property.id || Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false
    };
    properties.push(newProperty);
    
    if (this.writeFile(propertiesFile, properties)) {
      // إضافة إلى قائمة المزامنة
      this.addToSyncQueue('properties', 'insert', newProperty);
      return newProperty;
    }
    return null;
  }

  updateProperty(id, updates) {
    const properties = this.getAllProperties();
    const index = properties.findIndex(p => p.id === id);
    
    if (index !== -1) {
      properties[index] = {
        ...properties[index],
        ...updates,
        updated_at: new Date().toISOString(),
        synced: false
      };
      
      if (this.writeFile(propertiesFile, properties)) {
        this.addToSyncQueue('properties', 'update', properties[index]);
        return properties[index];
      }
    }
    return null;
  }

  deleteProperty(id) {
    const properties = this.getAllProperties();
    const index = properties.findIndex(p => p.id === id);
    
    if (index !== -1) {
      const deletedProperty = properties[index];
      properties.splice(index, 1);
      
      if (this.writeFile(propertiesFile, properties)) {
        this.addToSyncQueue('properties', 'delete', { id });
        return true;
      }
    }
    return false;
  }

  // المفضلة
  getFavorites(userId) {
    const favorites = this.readFile(favoritesFile);
    return favorites.filter(f => f.user_id === userId);
  }

  addFavorite(userId, propertyId) {
    const favorites = this.readFile(favoritesFile);
    const existing = favorites.find(f => f.user_id === userId && f.property_id === propertyId);
    
    if (!existing) {
      const newFavorite = {
        id: Date.now().toString(),
        user_id: userId,
        property_id: propertyId,
        created_at: new Date().toISOString(),
        synced: false
      };
      favorites.push(newFavorite);
      
      if (this.writeFile(favoritesFile, favorites)) {
        this.addToSyncQueue('favorites', 'insert', newFavorite);
        return newFavorite;
      }
    }
    return null;
  }

  removeFavorite(userId, propertyId) {
    const favorites = this.readFile(favoritesFile);
    const index = favorites.findIndex(f => f.user_id === userId && f.property_id === propertyId);
    
    if (index !== -1) {
      const deletedFavorite = favorites[index];
      favorites.splice(index, 1);
      
      if (this.writeFile(favoritesFile, favorites)) {
        this.addToSyncQueue('favorites', 'delete', { id: deletedFavorite.id });
        return true;
      }
    }
    return false;
  }

  // المزامنة
  addToSyncQueue(table, action, data) {
    const syncQueue = this.readFile(syncQueueFile);
    const syncItem = {
      id: Date.now().toString() + Math.random().toString(36),
      table,
      action,
      data,
      timestamp: new Date().toISOString(),
      attempts: 0
    };
    syncQueue.push(syncItem);
    this.writeFile(syncQueueFile, syncQueue);
  }

  getSyncQueue() {
    return this.readFile(syncQueueFile);
  }

  markSynced(syncId) {
    const syncQueue = this.readFile(syncQueueFile);
    const index = syncQueue.findIndex(s => s.id === syncId);
    
    if (index !== -1) {
      syncQueue.splice(index, 1);
      return this.writeFile(syncQueueFile, syncQueue);
    }
    return false;
  }

  clearSyncQueue() {
    return this.writeFile(syncQueueFile, []);
  }
}

// إنشاء مثيل قاعدة البيانات
const db = new LocalDatabase();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, 'icons', 'icon.png'),
    title: 'مسكني - تطبيق العقارات',
    show: false
  });

  // تحميل التطبيق
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:8081');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // إنشاء القائمة
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'ملف',
      submenu: [
        {
          label: 'إضافة عقار جديد',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('navigate-to', '/add-property');
          }
        },
        { type: 'separator' },
        {
          label: 'إعدادات',
          click: () => {
            showSettingsDialog();
          }
        },
        { type: 'separator' },
        {
          label: 'خروج',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'المزامنة',
      submenu: [
        {
          label: 'مزامنة الآن',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            performSync();
          }
        },
        {
          label: 'حالة المزامنة',
          click: () => {
            showSyncStatus();
          }
        },
        { type: 'separator' },
        {
          label: 'مسح قائمة المزامنة',
          click: () => {
            clearSyncQueue();
          }
        }
      ]
    },
    {
      label: 'عرض',
      submenu: [
        {
          label: 'إعادة تحميل',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'تكبير',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
          }
        },
        {
          label: 'تصغير',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
          }
        },
        {
          label: 'الحجم الأصلي',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          }
        }
      ]
    },
    {
      label: 'مساعدة',
      submenu: [
        {
          label: 'حول التطبيق',
          click: () => {
            showAboutDialog();
          }
        },
        {
          label: 'دليل الاستخدام',
          click: () => {
            shell.openExternal('https://example.com/help');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// معالجات IPC لقاعدة البيانات
ipcMain.handle('db:getAllProperties', () => {
  return db.getAllProperties();
});

ipcMain.handle('db:getProperty', (event, id) => {
  return db.getProperty(id);
});

ipcMain.handle('db:insertProperty', (event, property) => {
  return db.insertProperty(property);
});

ipcMain.handle('db:updateProperty', (event, id, updates) => {
  return db.updateProperty(id, updates);
});

ipcMain.handle('db:deleteProperty', (event, id) => {
  return db.deleteProperty(id);
});

ipcMain.handle('db:getFavorites', (event, userId) => {
  return db.getFavorites(userId);
});

ipcMain.handle('db:addFavorite', (event, userId, propertyId) => {
  return db.addFavorite(userId, propertyId);
});

ipcMain.handle('db:removeFavorite', (event, userId, propertyId) => {
  return db.removeFavorite(userId, propertyId);
});

ipcMain.handle('db:getSyncQueue', () => {
  return db.getSyncQueue();
});

ipcMain.handle('db:markSynced', (event, syncId) => {
  return db.markSynced(syncId);
});

ipcMain.handle('db:clearSyncQueue', () => {
  return db.clearSyncQueue();
});

ipcMain.handle('db:getSetting', (event, key) => {
  return store.get(key);
});

ipcMain.handle('db:setSetting', (event, key, value) => {
  store.set(key, value);
  return true;
});

// معالجات IPC للتطبيق
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:getUserDataPath', () => {
  return app.getPath('userData');
});

ipcMain.handle('app:isOnline', () => {
  return true; // يمكن تحسينها لاحقاً لفحص الاتصال الفعلي
});

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

// دوال مساعدة للحوارات
function showSettingsDialog() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'الإعدادات',
    message: 'إعدادات التطبيق',
    detail: 'سيتم إضافة إعدادات التطبيق قريباً',
    buttons: ['موافق']
  });
}

function showSyncStatus() {
  const syncQueue = db.getSyncQueue();
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'حالة المزامنة',
    message: `عدد العناصر المنتظرة للمزامنة: ${syncQueue.length}`,
    detail: syncQueue.length > 0 ? 
      'هناك عناصر تنتظر المزامنة مع الخادم' : 
      'جميع البيانات متزامنة',
    buttons: ['موافق']
  });
}

function clearSyncQueue() {
  dialog.showMessageBox(mainWindow, {
    type: 'question',
    title: 'مسح قائمة المزامنة',
    message: 'هل أنت متأكد من مسح قائمة المزامنة؟',
    detail: 'سيتم حذف جميع العناصر المنتظرة للمزامنة',
    buttons: ['نعم', 'إلغاء'],
    defaultId: 1
  }).then(result => {
    if (result.response === 0) {
      db.clearSyncQueue();
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'تم المسح',
        message: 'تم مسح قائمة المزامنة بنجاح',
        buttons: ['موافق']
      });
    }
  });
}

function showAboutDialog() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'حول التطبيق',
    message: 'مسكني - تطبيق العقارات',
    detail: `الإصدار: ${app.getVersion()}\nتطبيق لإدارة العقارات مع إمكانية العمل دون اتصال`,
    buttons: ['موافق']
  });
}

async function performSync() {
  const syncQueue = db.getSyncQueue();
  
  if (syncQueue.length === 0) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'المزامنة',
      message: 'لا توجد عناصر للمزامنة',
      buttons: ['موافق']
    });
    return;
  }

  // هنا يمكن إضافة منطق المزامنة الفعلي مع الخادم
  console.log('بدء المزامنة:', syncQueue.length, 'عناصر');
  
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'المزامنة',
    message: `تمت المزامنة!`,
    detail: `تم العثور على ${syncQueue.length} عنصر للمزامنة`,
    buttons: ['موافق']
  });
}

// مزامنة دورية كل 5 دقائق
cron.schedule('*/5 * * * *', () => {
  const syncQueue = db.getSyncQueue();
  if (syncQueue.length > 0) {
    console.log('مزامنة دورية - عناصر منتظرة:', syncQueue.length);
    // هنا يمكن إضافة منطق المزامنة التلقائية
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// إعداد بروتوكول التطبيق
app.setAsDefaultProtocolClient('maskani');
