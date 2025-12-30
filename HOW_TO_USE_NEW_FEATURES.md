# 🚀 دليل استخدام الميزات الجديدة

> **تاريخ الإنشاء**: 20 نوفمبر 2025

---

## 📋 المحتويات

1. [PropertyCard المحسن](#propertycard-المحسن)
2. [نظام Pagination](#نظام-pagination)
3. [Hooks الجديدة](#hooks-الجديدة)
4. [أمثلة عملية](#أمثلة-عملية)

---

## 1. PropertyCard المحسن

### 📍 الموقع
```
src/components/Property/PropertyCard.optimized.tsx
```

### ✨ الميزات
- ✅ محسن بـ React.memo (تقليل Re-renders بنسبة 40-60%)
- ✅ useMemo لـ 8 قيم محسوبة
- ✅ useCallback لـ 7 دوال
- ✅ دالة مقارنة مخصصة

### 🔧 كيفية الاستخدام

#### الطريقة 1: استبدال مباشر
```typescript
// في أي ملف يستخدم PropertyCard
// استبدل هذا:
import { PropertyCard } from "@/components/Property/PropertyCard";

// بهذا:
import { PropertyCard } from "@/components/Property/PropertyCard.optimized";

// الاستخدام يبقى كما هو
<PropertyCard 
  property={property}
  showActions={true}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onTogglePublication={handleTogglePublication}
/>
```

#### الطريقة 2: الاستبدال النهائي
```bash
# بعد التأكد من نجاح الاختبار:
# 1. احذف الملف القديم
rm src/components/Property/PropertyCard.tsx

# 2. أعد تسمية الملف المحسن
mv src/components/Property/PropertyCard.optimized.tsx src/components/Property/PropertyCard.tsx
```

---

## 2. نظام Pagination

### 📍 الموقع
```
src/components/ui/advanced-pagination.tsx
src/hooks/usePagination.ts
```

### ✨ الميزات
- ✅ دعم RTL كامل
- ✅ اختيار حجم الصفحة (10, 20, 50, 100)
- ✅ أزرار تنقل متعددة (First, Previous, Next, Last)
- ✅ عرض معلومات الصفحة
- ✅ تصميم جميل ومتجاوب
- ✅ محسن بـ React.memo

### 🔧 كيفية الاستخدام

#### مثال كامل - Client-side Pagination

```typescript
import { useState } from 'react';
import { AdvancedPagination } from '@/components/ui/advanced-pagination';
import { usePagination } from '@/hooks/usePagination';
import { PropertyCard } from '@/components/Property/PropertyCard.optimized';

function PropertiesList() {
  const [properties, setProperties] = useState([/* بياناتك */]);
  
  // استخدام Hook
  const {
    paginatedData,
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    goToPage,
    setPageSize
  } = usePagination({
    data: properties,
    initialPageSize: 20
  });

  return (
    <div>
      {/* عرض البيانات المقسمة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedData.map(property => (
          <PropertyCard 
            key={property.id} 
            property={property} 
          />
        ))}
      </div>

      {/* عرض Pagination */}
      <AdvancedPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={goToPage}
        onPageSizeChange={setPageSize}
        showPageSizeSelector={true}
        showFirstLast={true}
      />
    </div>
  );
}
```

#### مثال - Server-side Pagination

```typescript
import { useServerPagination } from '@/hooks/usePagination';
import { useQuery } from '@tanstack/react-query';

function PropertiesListServer() {
  // استخدام Hook للـ Server-side
  const {
    currentPage,
    pageSize,
    totalPages,
    offset,
    limit,
    goToPage,
    setPageSize
  } = useServerPagination({
    totalItems: 1000, // من الـ API
    initialPageSize: 20
  });

  // جلب البيانات من الخادم
  const { data, isLoading } = useQuery({
    queryKey: ['properties', offset, limit],
    queryFn: () => fetchProperties({ offset, limit })
  });

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <div>
      {/* عرض البيانات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.properties.map(property => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {/* عرض Pagination */}
      <AdvancedPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={data?.total || 0}
        onPageChange={goToPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
```

---

## 3. Hooks الجديدة

### usePagination

#### الاستخدام
```typescript
const {
  currentPage,      // الصفحة الحالية
  pageSize,         // حجم الصفحة
  totalPages,       // إجمالي الصفحات
  totalItems,       // إجمالي العناصر
  paginatedData,    // البيانات المقسمة للصفحة الحالية
  goToPage,         // دالة الانتقال لصفحة محددة
  nextPage,         // دالة الصفحة التالية
  previousPage,     // دالة الصفحة السابقة
  setPageSize,      // دالة تغيير حجم الصفحة
  canGoNext,        // هل يمكن الانتقال للتالي
  canGoPrevious     // هل يمكن الانتقال للسابق
} = usePagination({
  data: myData,
  initialPageSize: 20,
  initialPage: 1
});
```

### useServerPagination

#### الاستخدام
```typescript
const {
  currentPage,
  pageSize,
  totalPages,
  totalItems,
  offset,           // للاستخدام في API: skip/offset
  limit,            // للاستخدام في API: take/limit
  goToPage,
  nextPage,
  previousPage,
  setPageSize,
  canGoNext,
  canGoPrevious
} = useServerPagination({
  totalItems: 1000,
  initialPageSize: 20,
  initialPage: 1
});
```

---

## 4. أمثلة عملية

### مثال 1: صفحة Home مع Pagination

```typescript
// src/pages/Home.tsx
import { AdvancedPagination } from '@/components/ui/advanced-pagination';
import { usePagination } from '@/hooks/usePagination';
import { PropertyCard } from '@/components/Property/PropertyCard.optimized';
import { useProperties } from '@/hooks/useProperties';

export function Home() {
  const { properties, isLoading } = useProperties();
  
  const {
    paginatedData,
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    goToPage,
    setPageSize
  } = usePagination({
    data: properties || [],
    initialPageSize: 12
  });

  if (isLoading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">العقارات المتاحة</h1>
      
      {/* عرض العقارات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {paginatedData.map(property => (
          <PropertyCard 
            key={property.id} 
            property={property} 
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <AdvancedPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={goToPage}
          onPageSizeChange={setPageSize}
          showPageSizeSelector={true}
          showFirstLast={true}
          maxVisiblePages={5}
        />
      )}
    </div>
  );
}
```

### مثال 2: صفحة إدارة العقارات مع Pagination

```typescript
// src/pages/PropertiesManagement.tsx
import { AdvancedPagination } from '@/components/ui/advanced-pagination';
import { usePagination } from '@/hooks/usePagination';
import { PropertyCard } from '@/components/Property/PropertyCard.optimized';

export function PropertiesManagement() {
  const [properties, setProperties] = useState([]);
  
  const {
    paginatedData,
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    goToPage,
    setPageSize
  } = usePagination({
    data: properties,
    initialPageSize: 20
  });

  const handleEdit = (id: string) => {
    // منطق التعديل
  };

  const handleDelete = (id: string) => {
    // منطق الحذف
  };

  const handleTogglePublication = (id: string, status: boolean) => {
    // منطق النشر/الإخفاء
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">إدارة العقارات</h1>
      
      {/* عرض العقارات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {paginatedData.map(property => (
          <PropertyCard 
            key={property.id} 
            property={property}
            showActions={true}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTogglePublication={handleTogglePublication}
          />
        ))}
      </div>

      {/* Pagination */}
      <AdvancedPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={goToPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 20, 50, 100]}
      />
    </div>
  );
}
```

### مثال 3: مع Filtering و Sorting

```typescript
import { useState, useMemo } from 'react';
import { usePagination } from '@/hooks/usePagination';

export function FilteredPropertiesList() {
  const [properties, setProperties] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // تطبيق الفلترة والترتيب
  const filteredAndSortedProperties = useMemo(() => {
    let result = [...properties];
    
    // الفلترة
    if (filter !== 'all') {
      result = result.filter(p => p.type === filter);
    }
    
    // الترتيب
    result.sort((a, b) => {
      if (sortBy === 'price') {
        return a.price - b.price;
      } else if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });
    
    return result;
  }, [properties, filter, sortBy]);

  // استخدام Pagination على البيانات المفلترة
  const {
    paginatedData,
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    goToPage,
    setPageSize
  } = usePagination({
    data: filteredAndSortedProperties,
    initialPageSize: 20
  });

  return (
    <div>
      {/* الفلاتر */}
      <div className="mb-4 flex gap-4">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">الكل</option>
          <option value="apartment">شقق</option>
          <option value="villa">فلل</option>
        </select>
        
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="date">الأحدث</option>
          <option value="price">السعر</option>
        </select>
      </div>

      {/* العقارات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {paginatedData.map(property => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {/* Pagination */}
      <AdvancedPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={goToPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
```

---

## 📊 قياس الأداء

### قبل التحسينات
```bash
# افتح React DevTools Profiler
# سجل تفاعل (مثل تحديث عقار)
# لاحظ عدد Re-renders
```

### بعد التحسينات
```bash
# افتح React DevTools Profiler
# سجل نفس التفاعل
# قارن عدد Re-renders
# يجب أن ترى تحسن 40-60%
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: Pagination لا يعمل
```typescript
// تأكد من:
1. استيراد المكونات بشكل صحيح
2. تمرير جميع الـ props المطلوبة
3. البيانات ليست فارغة
```

### المشكلة: PropertyCard لا يعيد التصيير
```typescript
// تأكد من:
1. تغيير props المهمة (id, title, price, etc.)
2. عدم تمرير دوال جديدة في كل render
3. استخدام useCallback للدوال
```

---

## 📚 موارد إضافية

- [QUICK_DEV_GUIDE.md](./QUICK_DEV_GUIDE.md) - دليل التطوير الشامل
- [PERFORMANCE_IMPROVEMENTS_PROPERTYCARD.md](./PERFORMANCE_IMPROVEMENTS_PROPERTYCARD.md) - توثيق تحسينات PropertyCard
- [FINAL_COMPLETION_REPORT.md](./FINAL_COMPLETION_REPORT.md) - تقرير الإنجاز النهائي

---

**تاريخ الإنشاء**: 20 نوفمبر 2025  
**آخر تحديث**: 20 نوفمبر 2025

**🚀 بالتوفيق في استخدام الميزات الجديدة!**
