// دوال مساعدة لفلترة العقارات حسب الحالة

export interface PropertyWithStatus {
  status?: string;
  listing_type?: "sale" | "rent";
}

/**
 * فلترة العقارات لإخفاء المباعة والمؤجرة من الصفحات الرئيسية
 * @param properties مصفوفة العقارات
 * @param hideCompletedDeals إخفاء الصفقات المكتملة (افتراضي: true)
 * @returns العقارات المفلترة
 */
export function filterAvailableProperties<T extends PropertyWithStatus>(
  properties: T[], 
  hideCompletedDeals: boolean = true
): T[] {
  if (!hideCompletedDeals) {
    return properties;
  }

  return properties.filter(property => {
    // إذا لم يكن هناك حقل status، نعتبر العقار متاح
    if (!property.status) {
      return true;
    }

    // إخفاء العقارات المباعة والمؤجرة
    return property.status !== 'sold' && property.status !== 'rented';
  });
}

/**
 * فحص ما إذا كان العقار متاح للعرض في الصفحات الرئيسية
 * @param property العقار
 * @returns true إذا كان العقار متاح للعرض
 */
export function isPropertyAvailable(property: PropertyWithStatus): boolean {
  return !property.status || (property.status !== 'sold' && property.status !== 'rented');
}

/**
 * فحص ما إذا كان العقار مكتمل الصفقة (مباع أو مؤجر)
 * @param property العقار
 * @returns true إذا كان العقار مباع أو مؤجر
 */
export function isPropertyCompleted(property: PropertyWithStatus): boolean {
  return property.status === 'sold' || property.status === 'rented';
}

/**
 * الحصول على نص حالة العقار بالعربية
 * @param status حالة العقار
 * @returns النص بالعربية
 */
export function getPropertyStatusText(status?: string): string {
  switch (status) {
    case 'available':
      return 'متاح';
    case 'sold':
      return 'تم البيع';
    case 'rented':
      return 'تم الإيجار';
    case 'under_negotiation':
      return 'قيد التفاوض';
    default:
      return 'متاح';
  }
}

/**
 * الحصول على لون حالة العقار
 * @param status حالة العقار
 * @returns كلاس CSS للون
 */
export function getPropertyStatusColor(status?: string): string {
  switch (status) {
    case 'available':
      return 'text-green-600';
    case 'sold':
      return 'text-red-600';
    case 'rented':
      return 'text-orange-600';
    case 'under_negotiation':
      return 'text-yellow-600';
    default:
      return 'text-green-600';
  }
}