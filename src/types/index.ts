// أنواع البيانات الأساسية للتطبيق

export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  type: string; // 'للبيع' | 'للإيجار'
  status: string; // 'متاح' | 'مباع' | 'مؤجر' | 'قيد التفاوض'
  location: string;
  latitude?: number; // إحداثية العرض
  longitude?: number; // إحداثية الطول
  address?: string; // العنوان الكامل من الخريطة
  images: string[];
  features: string[];
  created_at: string;
  updated_at: string;
  user_id?: string;
  sync_status?: string;
  cloud_id?: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  created_at: string;
}

export interface Favorite {
  id: number;
  user_id: string;
  property_id: number;
  created_at: string;
  sync_status?: string;
  cloud_id?: number;
}

export interface SyncAction<TData = Record<string, unknown>> {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  data: TData;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

// أنواع بيانات الخريطة
export interface MapLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface SearchResult {
  lat: number;
  lng: number;
  name: string;
}

// أنواع الاستجابات من APIs
export interface GeocodeResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

// أنواع النماذج
export interface PropertyFormData {
  title: string;
  description: string;
  price: number;
  type: string;
  status: string;
  location: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  images: File[];
  features: string[];
}

export interface PropertyFilters {
  type?: string;
  priceMin?: number;
  priceMax?: number;
  location?: string;
  features?: string[];
}

export * from "./messaging";