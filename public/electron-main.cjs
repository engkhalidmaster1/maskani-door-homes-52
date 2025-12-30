const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const Store = require('electron-store');
const cron = require('node-cron');

const isDev = process.env.NODE_ENV === 'development';

// تهيئة المتجر المحلي
const store = new Store();

// قاعدة البيانات المحلية
let db;

// تهيئة live reload في وضع التطوير
if (isDev) {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (err) {
    // electron-reload غير مثبت
  }
}

let mainWindow;

// دالة تهيئة قاعدة البيانات
function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'maskani.db');
  
  // التأكد من وجود مجلد البيانات
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  
  // إنشاء قاعدة البيانات
  db = new Database(dbPath);
  
  // إنشاء الجداول
  createTables();
  
  console.log('قاعدة البيانات المحلية جاهزة في:', dbPath);
}

// دالة إنشاء الجداول
function createTables() {
  // جدول العقارات
  db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      property_type TEXT NOT NULL,
      listing_type TEXT NOT NULL CHECK (listing_type IN ('sale', 'rent')),
      price REAL NOT NULL,
      area REAL,
      bedrooms INTEGER,
      bathrooms INTEGER,
      location TEXT,
      address TEXT,
      amenities TEXT, -- JSON string
      images TEXT,    -- JSON string
      is_published BOOLEAN DEFAULT 1,
      ownership_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced BOOLEAN DEFAULT 0,
      needs_sync BOOLEAN DEFAULT 1
    )
  `);

  // جدول المفضلة
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      property_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced BOOLEAN DEFAULT 0,
      UNIQUE(user_id, property_id)
    )
  `);

  // جدول المستخدمين
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT,
      phone TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // جدول المزامنة
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
      data TEXT, -- JSON string
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      retry_count INTEGER DEFAULT 0,
      last_retry DATETIME,
      synced BOOLEAN DEFAULT 0
    )
  `);

  // جدول إعدادات التطبيق
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('جداول قاعدة البيانات جاهزة');
}

function createWindow() {
  // إنشاء نافذة التطبيق
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: !isDev
    },
    icon: path.join(__dirname, 'icons', 'icon.png'),
    title: 'مسكني - تطبيق العقارات',
    show: false,
    titleBarStyle: 'default',
    autoHideMenuBar: false
  });

  // تحميل التطبيق
  const startUrl = isDev 
    ? 'http://localhost:8081' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // إظهار النافذة عند الجاهزية
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // التعامل مع إغلاق النافذة
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // التعامل مع الروابط الخارجية
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // منع فتح روابط خارجية
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:8081' && !navigationUrl.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  createMenu();
}

// دوال قاعدة البيانات - العقارات
function getAllProperties() {
  try {
    const stmt = db.prepare('SELECT * FROM properties ORDER BY created_at DESC');
    const properties = stmt.all();
    return properties.map(prop => ({
      ...prop,
      amenities: prop.amenities ? JSON.parse(prop.amenities) : [],
      images: prop.images ? JSON.parse(prop.images) : []
    }));
  } catch (error) {
    console.error('Error getting properties:', error);
    return [];
  }
}

function getProperty(id) {
  try {
    const stmt = db.prepare('SELECT * FROM properties WHERE id = ?');
    const property = stmt.get(id);
    if (property) {
      property.amenities = property.amenities ? JSON.parse(property.amenities) : [];
      property.images = property.images ? JSON.parse(property.images) : [];
    }
    return property;
  } catch (error) {
    console.error('Error getting property:', error);
    return null;
  }
}

function insertProperty(property) {
  try {
    const stmt = db.prepare(`
      INSERT INTO properties (
        id, user_id, title, description, property_type, listing_type, 
        price, area, bedrooms, bathrooms, location, address, 
        amenities, images, is_published, ownership_type, needs_sync
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    
    const result = stmt.run(
      property.id, property.user_id, property.title, property.description,
      property.property_type, property.listing_type, property.price,
      property.area, property.bedrooms, property.bathrooms,
      property.location, property.address, 
      JSON.stringify(property.amenities || []), 
      JSON.stringify(property.images || []),
      property.is_published, property.ownership_type
    );
    
    addToSyncQueue('properties', property.id, 'CREATE', property);
    return result;
  } catch (error) {
    console.error('Error inserting property:', error);
    throw error;
  }
}

function updateProperty(id, updates) {
  try {
    const allowedFields = ['title', 'description', 'property_type', 'listing_type', 
                          'price', 'area', 'bedrooms', 'bathrooms', 'location', 
                          'address', 'amenities', 'images', 'is_published', 'ownership_type'];
    
    const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key));
    const setClause = updateFields.map(key => `${key} = ?`).join(', ');
    const values = updateFields.map(key => {
      if (key === 'amenities' || key === 'images') {
        return JSON.stringify(updates[key] || []);
      }
      return updates[key];
    });
    
    const stmt = db.prepare(`
      UPDATE properties 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP, needs_sync = 1
      WHERE id = ?
    `);
    
    const result = stmt.run(...values, id);
    addToSyncQueue('properties', id, 'UPDATE', updates);
    return result;
  } catch (error) {
    console.error('Error updating property:', error);
    throw error;
  }
}

function deleteProperty(id) {
  try {
    const stmt = db.prepare('DELETE FROM properties WHERE id = ?');
    const result = stmt.run(id);
    addToSyncQueue('properties', id, 'DELETE', { id });
    return result;
  } catch (error) {
    console.error('Error deleting property:', error);
    throw error;
  }
}

// دوال المفضلة
function getFavorites(userId) {
  try {
    const stmt = db.prepare(`
      SELECT f.*, p.title, p.price, p.location, p.images 
      FROM favorites f 
      JOIN properties p ON f.property_id = p.id 
      WHERE f.user_id = ?
    `);
    const favorites = stmt.all(userId);
    return favorites.map(fav => ({
      ...fav,
      images: fav.images ? JSON.parse(fav.images) : []
    }));
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
}

function addFavorite(userId, propertyId) {
  try {
    const id = `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stmt = db.prepare(`
      INSERT INTO favorites (id, user_id, property_id) 
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(id, userId, propertyId);
    addToSyncQueue('favorites', id, 'CREATE', { id, user_id: userId, property_id: propertyId });
    return result;
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }
}

function removeFavorite(userId, propertyId) {
  try {
    const stmt = db.prepare('DELETE FROM favorites WHERE user_id = ? AND property_id = ?');
    const result = stmt.run(userId, propertyId);
    addToSyncQueue('favorites', propertyId, 'DELETE', { user_id: userId, property_id: propertyId });
    return result;
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
}

// دوال المزامنة
function addToSyncQueue(tableName, recordId, action, data) {
  try {
    const stmt = db.prepare(`
      INSERT INTO sync_queue (table_name, record_id, action, data)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(tableName, recordId, action, JSON.stringify(data));
  } catch (error) {
    console.error('Error adding to sync queue:', error);
  }
}

function getSyncQueue() {
  try {
    const stmt = db.prepare('SELECT * FROM sync_queue WHERE synced = 0 ORDER BY created_at ASC');
    return stmt.all();
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
}

function markSynced(syncId) {
  try {
    const stmt = db.prepare('UPDATE sync_queue SET synced = 1 WHERE id = ?');
    stmt.run(syncId);
  } catch (error) {
    console.error('Error marking as synced:', error);
  }
}

function clearSyncQueue() {
  try {
    const stmt = db.prepare('DELETE FROM sync_queue WHERE synced = 1');
    stmt.run();
  } catch (error) {
    console.error('Error clearing sync queue:', error);
  }
}

// IPC Handlers
function setupIpcHandlers() {
  // العقارات
  ipcMain.handle('db:getAllProperties', () => getAllProperties());
  ipcMain.handle('db:getProperty', (event, id) => getProperty(id));
  ipcMain.handle('db:insertProperty', (event, property) => insertProperty(property));
  ipcMain.handle('db:updateProperty', (event, id, updates) => updateProperty(id, updates));
  ipcMain.handle('db:deleteProperty', (event, id) => deleteProperty(id));
  
  // المفضلة
  ipcMain.handle('db:getFavorites', (event, userId) => getFavorites(userId));
  ipcMain.handle('db:addFavorite', (event, userId, propertyId) => addFavorite(userId, propertyId));
  ipcMain.handle('db:removeFavorite', (event, userId, propertyId) => removeFavorite(userId, propertyId));
  
  // المزامنة
  ipcMain.handle('db:getSyncQueue', () => getSyncQueue());
  ipcMain.handle('db:markSynced', (event, syncId) => markSynced(syncId));
  ipcMain.handle('db:clearSyncQueue', () => clearSyncQueue());
  
  // إعدادات
  ipcMain.handle('db:getSetting', (event, key) => {
    try {
      const stmt = db.prepare('SELECT value FROM app_settings WHERE key = ?');
      const result = stmt.get(key);
      return result ? result.value : null;
    } catch (error) {
      console.error('Error getting setting:', error);
      return null;
    }
  });
  
  ipcMain.handle('db:setSetting', (event, key, value) => {
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO app_settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `);
      stmt.run(key, value);
      return true;
    } catch (error) {
      console.error('Error setting value:', error);
      return false;
    }
  });
  
  // معلومات التطبيق
  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.handle('app:getUserDataPath', () => app.getPath('userData'));
  ipcMain.handle('app:isOnline', async () => {
    try {
      const dns = require('dns');
      return new Promise((resolve) => {
        dns.resolve('google.com', (err) => {
          resolve(!err);
        });
      });
    } catch {
      return false;
    }
  });
}

function createMenu() {
  const template = [
    {
      label: 'ملف',
      submenu: [
        {
          label: 'الصفحة الرئيسية',
          accelerator: 'CmdOrCtrl+Home',
          click: () => {
            mainWindow.webContents.executeJavaScript('window.location.href = "/"');
          }
        },
        { type: 'separator' },
        {
          label: 'تحديث',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        { type: 'separator' },
        {
          label: 'خروج',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'عرض',
      submenu: [
        {
          label: 'تكبير',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const webContents = mainWindow.webContents;
            webContents.setZoomLevel(webContents.getZoomLevel() + 0.5);
          }
        },
        {
          label: 'تصغير',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const webContents = mainWindow.webContents;
            webContents.setZoomLevel(webContents.getZoomLevel() - 0.5);
          }
        },
        {
          label: 'الحجم الطبيعي',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          }
        },
        { type: 'separator' },
        {
          label: 'أدوات المطور',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'تزامن',
      submenu: [
        {
          label: 'مزامنة الآن',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              if (window.electronSync && typeof window.electronSync.syncNow === 'function') {
                window.electronSync.syncNow();
              }
            `);
          }
        },
        {
          label: 'عرض قائمة المزامنة',
          click: () => {
            const syncQueue = getSyncQueue();
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'قائمة المزامنة',
              message: `عدد العناصر في انتظار المزامنة: ${syncQueue.length}`,
              detail: syncQueue.length > 0 ? 
                syncQueue.map(item => `${item.action} - ${item.table_name}`).join('\n') :
                'لا توجد عناصر في انتظار المزامنة'
            });
          }
        },
        {
          label: 'مسح قائمة المزامنة',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'warning',
              buttons: ['نعم', 'إلغاء'],
              title: 'تأكيد المسح',
              message: 'هل تريد مسح قائمة المزامنة؟',
              detail: 'سيتم حذف جميع العناصر المتزامنة من القائمة'
            }).then((result) => {
              if (result.response === 0) {
                clearSyncQueue();
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'تم المسح',
                  message: 'تم مسح قائمة المزامنة بنجاح'
                });
              }
            });
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
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'حول مسكني',
              message: 'مسكني - تطبيق العقارات',
              detail: `الإصدار: ${app.getVersion()}\nتطبيق عقارات ذكي مع مزامنة محلية\nيعمل مع وجود الإنترنت وبدونه`
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// تهيئة مزامنة دورية كل 5 دقائق
function setupPeriodicSync() {
  cron.schedule('*/5 * * * *', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.executeJavaScript(`
        if (window.electronSync && typeof window.electronSync.periodicSync === 'function') {
          window.electronSync.periodicSync();
        }
      `).catch(() => {
        // تجاهل الأخطاء
      });
    }
  });
}

// أحداث التطبيق
app.whenReady().then(() => {
  initDatabase();
  setupIpcHandlers();
  createWindow();
  setupPeriodicSync();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db) {
      db.close();
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  if (db) {
    db.close();
  }
});

// التعامل مع الأخطاء
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
