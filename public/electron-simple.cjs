const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  console.log('إنشاء النافذة...');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: 'مسكني - تطبيق العقارات',
    show: true,
    center: true
  });

  // تحميل الملف المحلي
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  console.log('تحميل من:', indexPath);
  
  mainWindow.loadFile(indexPath);

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('تم تحميل الصفحة بنجاح');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('خطأ في التحميل:', errorCode, errorDescription);
  });
}

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
