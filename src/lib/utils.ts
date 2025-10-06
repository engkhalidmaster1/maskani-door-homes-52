import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ترجمة أنواع العقارات
export const getPropertyTypeLabel = (type: string): string => {
  const propertyTypes: Record<string, string> = {
    apartment: "شقة",
    house: "بيت", 
    commercial: "محل تجاري"
  };
  
  return propertyTypes[type] || type;
};

// أيقونات أنواع العقارات (emoji)
export const getPropertyTypeEmoji = (type: string): string => {
  const propertyEmojis: Record<string, string> = {
    apartment: "🏢",
    house: "🏠",
    commercial: "🏪"
  };
  
  return propertyEmojis[type] || "🏠";
};

// أنواع العقارات المتاحة
export const PROPERTY_TYPES = [
  { value: "apartment", label: "شقة", emoji: "🏢" },
  { value: "house", label: "بيت", emoji: "🏠" },
  { value: "commercial", label: "محل تجاري", emoji: "🏪" }
] as const;

export function formatNumber(number: number): string {
  return new Intl.NumberFormat('ar-IQ').format(number);
}
