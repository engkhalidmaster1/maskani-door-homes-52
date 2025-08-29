// Image utilities for property images

export const getPropertyDefaultImage = (propertyType: string): string => {
  const baseUrl = 'https://images.unsplash.com';
  
  switch (propertyType.toLowerCase()) {
    case 'apartment':
    case 'شقة':
      return `${baseUrl}/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80`;
    case 'house':
    case 'منزل':
      return `${baseUrl}/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80`;
    case 'villa':
    case 'فيلا':
      return `${baseUrl}/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80`;
    case 'office':
    case 'مكتب':
      return `${baseUrl}/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80`;
    default:
      return `${baseUrl}/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80`;
  }
};

export const validateImageUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const getValidImages = (images: string[] | null | undefined): string[] => {
  if (!images || !Array.isArray(images)) {
    return [];
  }
  
  return images.filter(url => url && validateImageUrl(url));
};

export const getImageForProperty = (
  images: string[] | null | undefined, 
  propertyType: string,
  index: number = 0
): string | null => {
  const validImages = getValidImages(images);
  
  // إرجاع الصورة المرفوعة فقط إذا وجدت
  if (validImages.length > 0 && validImages[index]) {
    return validImages[index];
  }
  
  // إرجاع null إذا لم توجد صور مرفوعة (بدلاً من الصورة الافتراضية)
  return null;
};

export const hasValidImages = (images: string[] | null | undefined): boolean => {
  return getValidImages(images).length > 0;
};
