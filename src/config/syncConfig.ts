// تكوين التزامن الذكي
export const syncConfig = {
  // إعدادات المزامنة
  syncInterval: 30000, // 30 ثانية
  maxRetryAttempts: 3,
  retryDelay: 5000, // 5 ثواني
  
  // إعدادات التخزين المحلي
  maxLocalStorageItems: 1000,
  maxLocalStorageSize: 50 * 1024 * 1024, // 50 MB
  
  // إعدادات Service Worker
  cacheVersion: 'v3',
  staticCacheUrls: [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/maskani-icon-192x192.png',
    '/maskani-icon-512x512.png',
  ],
  
  // إعدادات الإشعارات
  showOfflineNotification: true,
  showSyncNotification: true,
  notificationDuration: 3000,
  
  // إعدادات البيانات
  dataCacheDuration: 24 * 60 * 60 * 1000, // 24 ساعة
  imageCacheDuration: 7 * 24 * 60 * 60 * 1000, // أسبوع
  
  // قائمة الـ API endpoints للتخزين المؤقت
  apiEndpoints: [
    '/api/properties',
    '/api/favorites',
    '/api/users',
    '/api/images',
  ],
  
  // إعدادات الضغط
  enableCompression: true,
  compressionLevel: 6,
  
  // إعدادات الأمان
  encryptLocalData: true,
  dataRetentionDays: 30,
};

// دوال مساعدة للتكوين
export const getSyncConfig = (key: keyof typeof syncConfig) => {
  return syncConfig[key];
};

export const updateSyncConfig = (updates: Partial<typeof syncConfig>) => {
  Object.assign(syncConfig, updates);
};

// إعدادات البيئة
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';

// URLs الخادم
export const serverConfig = {
  apiBaseUrl: isProduction ? 'https://api.maskani.com' : 'http://localhost:3000',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

export default syncConfig;
