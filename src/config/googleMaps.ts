// Google Maps API Configuration
export const GOOGLE_MAPS_CONFIG = {
  // ضع مفتاح Google Maps API الخاص بك هنا
  API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE',
  
  // إعدادات الخريطة الافتراضية
  DEFAULT_CENTER: {
    lat: 33.3152, // بغداد
    lng: 44.3661
  },
  
  DEFAULT_ZOOM: 10,
  
  // مناطق العراق الرئيسية
  REGIONS: {
    BAGHDAD: { lat: 33.3152, lng: 44.3661, name: 'بغداد' },
    ERBIL: { lat: 36.1911, lng: 44.0094, name: 'أربيل' },
    BASRA: { lat: 30.5033, lng: 47.7963, name: 'البصرة' },
    MOSUL: { lat: 36.3500, lng: 43.1500, name: 'الموصل' },
    NAJAF: { lat: 32.0028, lng: 44.3284, name: 'النجف' },
    KARBALA: { lat: 32.6055, lng: 44.0249, name: 'كربلاء' }
  },
  
  // إعدادات البحث
  SEARCH_RADIUS: 50000, // 50 كم
  MAX_RESULTS: 20,
  
  // أنماط الخريطة
  MAP_STYLES: {
    STANDARD: [],
    SATELLITE: 'satellite',
    HYBRID: 'hybrid',
    TERRAIN: 'terrain'
  }
};

// دالة مساعدة للحصول على مفتاح API
export const getGoogleMapsApiKey = () => {
  const apiKey = GOOGLE_MAPS_CONFIG.API_KEY;
  
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    console.warn('⚠️ Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your environment variables.');
    return null;
  }
  
  return apiKey;
};

// دالة للتحقق من صحة مفتاح API
export const isGoogleMapsApiKeyValid = () => {
  const apiKey = getGoogleMapsApiKey();
  return apiKey !== null && apiKey.length > 0;
};