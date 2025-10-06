// أنواع بيانات المكاتب العقارية

export interface RealEstateOffice {
  id: string;
  user_id: string;
  office_name: string;
  owner_name: string;
  phone: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  license_number?: string;
  license_expiry?: string;
  description?: string;
  website?: string;
  social_media?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  working_hours?: {
    saturday?: { open: string; close: string; closed?: boolean };
    sunday?: { open: string; close: string; closed?: boolean };
    monday?: { open: string; close: string; closed?: boolean };
    tuesday?: { open: string; close: string; closed?: boolean };
    wednesday?: { open: string; close: string; closed?: boolean };
    thursday?: { open: string; close: string; closed?: boolean };
    friday?: { open: string; close: string; closed?: boolean };
  };
  services?: string[];
  logo_url?: string;
  cover_image_url?: string;
  documents?: OfficeDocument[];
  is_verified: boolean;
  is_active: boolean;
  rating: number;
  reviews_count: number;
  properties_count: number;
  created_at: string;
  updated_at: string;
}

export interface OfficeDocument {
  id: string;
  name: string;
  type: 'license' | 'certificate' | 'identity' | 'contract' | 'other';
  url: string;
  uploaded_at: string;
  verified?: boolean;
}

export interface OfficeFormData {
  office_name: string;
  owner_name: string;
  phone: string;
  email: string;
  address: string;
  latitude?: number;
  longitude?: number;
  license_number: string;
  license_expiry: string;
  description: string;
  website: string;
  social_media: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
  };
  working_hours: {
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
  };
  services: string[];
  logo?: File;
  cover_image?: File;
  documents: File[];
}

export interface OfficeFilters {
  search?: string;
  verified?: boolean;
  services?: string[];
  location?: string;
  rating?: number;
}