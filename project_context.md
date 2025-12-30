# وثيقة تعريفية لنظام مسكني (Maskani)

## وصف النظام

**مسكني** هو نظام إدارة عقارات شامل مبني بتقنيات الويب الحديثة، يدعم العمل باللغة العربية مع واجهة مستخدم متجاوبة. النظام يجمع بين تطبيق ويب وتطبيق سطح مكتب (Electron) لإدارة العقارات في السوق العقاري السعودي.

### الميزات الرئيسية

- **إدارة العقارات:** إضافة، تعديل، حذف، وعرض العقارات مع صور وخرائط
- **نظام المستخدمين:** مصادقة آمنة مع أدوار متعددة (مستخدم عادي، ناشر، مالك موثوق، وكيل مكتب، مدير)
- **العمل دون اتصال:** تخزين محلي مع مزامنة تلقائية
- **واجهة عربية كاملة:** دعم RTL مع خطوط عربية وتصميم متجاوب
- **إدارة الصور:** رفع وتحسين الصور تلقائياً
- **نظام المفضلة:** حفظ العقارات المفضلة
- **سجلات التدقيق:** تسجيل جميع العمليات للمراجعة

## بنية الملفات

```bash
maskani-1.0.0.0/
├── src/
│   ├── main.tsx                    # نقطة دخول React 18
│   ├── App.tsx                     # الراوتر الرئيسي مع المسارات المحمية
│   ├── components/
│   │   ├── Layout/                 # AppLayout, Header, Sidebar, Footer
│   │   ├── ui/                     # مكونات shadcn/ui الأساسية (Button, Card, etc.)
│   │   └── Property/               # مكونات إدارة العقارات
│   │       └── AddProperty/        # مكونات نموذج إضافة العقار
│   ├── pages/                      # الصفحات الرئيسية
│   │   ├── Home.tsx                # الصفحة الرئيسية
│   │   ├── AddProperty.tsx         # إضافة عقار جديد
│   │   ├── PropertiesManagement.tsx # إدارة العقارات
│   │   ├── Dashboard.tsx           # لوحة التحكم
│   │   ├── MapPage.tsx             # صفحة الخريطة
│   │   ├── Profile.tsx             # ملف المستخدم
│   │   ├── Favorites.tsx           # المفضلة
│   │   ├── Login.tsx               # تسجيل الدخول
│   │   └── Register.tsx            # إنشاء حساب
│   ├── hooks/                      # Custom hooks
│   │   ├── useAuth.tsx             # إدارة المصادقة
│   │   ├── useProperties.tsx       # إدارة بيانات العقارات
│   │   ├── useAddPropertyForm.ts   # منطق نموذج إضافة العقار
│   │   ├── useOfflineSync.tsx      # المزامنة دون اتصال
│   │   ├── useUserStatus.tsx       # حالة المستخدم
│   │   └── useOptimizedImageUpload.tsx # رفع الصور المحسنة
│   ├── integrations/supabase/      # تكامل Supabase
│   │   ├── client.ts               # عميل Supabase
│   │   └── types.ts                # أنواع قاعدة البيانات
│   ├── constants/                  # الثوابت
│   │   ├── markets.ts              # أسواق الرياض
│   │   └── propertyTypes.ts        # أنواع العقارات
│   ├── context/                    # React Context
│   │   └── SettingsContext.tsx     # إعدادات التطبيق
│   ├── services/                   # الخدمات
│   │   └── RBACManager.ts          # إدارة الصلاحيات
│   └── lib/                        # المساعدات
│       ├── utils.ts                # دوال مساعدة
│       └── formatters.ts           # تنسيق البيانات
├── public/
│   ├── electron.cjs               # عملية Electron الرئيسية
│   ├── preload.cjs                # جسر IPC الآمن
│   └── favicon.ico                # أيقونة التطبيق
├── dist-electron/                 # مخرجات بناء Electron
├── package.json                   # إعدادات المشروع والتبعيات
├── vite.config.ts                 # إعدادات Vite
├── tailwind.config.ts             # إعدادات Tailwind
├── tsconfig.json                  # إعدادات TypeScript
├── electron-builder.json          # إعدادات بناء Electron
└── index.html                     # صفحة HTML الرئيسية
```

## التقنيات المستخدمة

### Frontend Framework

- **React 18** مع **TypeScript** للتطوير الآمن
- **Vite** كأداة بناء سريعة مع دعم HMR
- **React Router** للتنقل بين الصفحات

### UI/UX

- **Radix UI** كمكونات أساسية غير مصممة
- **shadcn/ui** لبناء مكونات جميلة ومتسقة
- **Tailwind CSS** للتصميم مع دعم RTL كامل
- **Lucide React** للأيقونات

### State Management

- **TanStack Query** لإدارة البيانات من الخادم
- **React Context** للحالة العامة
- **Custom Hooks** للمنطق التجاري المعقد

### Backend & Database

- **Supabase** (PostgreSQL) كقاعدة بيانات مع RLS
- **Supabase Auth** للمصادقة
- **Supabase Storage** لتخزين الصور
- **Row Level Security** للأمان على مستوى الصفوف

### Desktop Application

- **Electron** للتطبيق المكتبي
- **IPC** آمن عبر preload scripts
- **electron-builder** للتغليف

### Maps & Location

- **Leaflet** مع **React-Leaflet** للخرائط
- **GPS Integration** لتحديد المواقع الدقيقة

### Development Tools

- **ESLint** لفحص الكود
- **TypeScript** للتحقق من الأنواع
- **React DevTools** للتطوير
- **Vite Dev Server** للتطوير المحلي

### Performance & PWA

- **Manual Code Splitting** لتحسين الأداء
- **Image Optimization** للصور
- **PWA Support** للتطبيق المحمول
- **Lazy Loading** للصفحات

## نقاط الضعف في الكود المولّد من Lovable

### 1. مشاكل في إدارة الحالة

- استخدام useState المفرط في المكونات الكبيرة
- عدم فصل منطق الأعمال عن مكونات UI
- نقص في memoization للمكونات المعقدة

### 2. مشاكل في الأداء

- عدم تحسين re-renders في القوائم الكبيرة
- تحميل البيانات غير الفعال في بعض الصفحات
- نقص في error boundaries

### 3. مشاكل في إدارة الأخطاء

- معالجة أخطاء غير شاملة في hooks
- عدم وجود fallback UI للحالات الخطأ
- logging غير كافي للأخطاء

### 4. مشاكل في التصميم

- عدم اتساق في أنماط التصميم
- responsive design غير مثالي في بعض المكونات
- accessibility غير كامل

### 5. مشاكل في الكود

- تكرار في الكود (DRY principle)
- عدم وجود constants للقيم الثابتة
- TypeScript types غير دقيقة في بعض الأماكن

### 6. مشاكل في الاختبار

- عدم وجود unit tests
- عدم وجود integration tests
- عدم وجود E2E tests

## المطلوب إنجازه

### الأولوية العالية

1. **إصلاح مشاكل الأداء**
   - تحسين re-renders في PropertyCard و PropertiesList
   - إضافة React.memo للمكونات الثقيلة
   - تحسين lazy loading

2. **تحسين إدارة الأخطاء**
   - إضافة error boundaries شاملة
   - تحسين error handling في جميع hooks
   - إضافة logging شامل

3. **إكمال الميزات الناقصة**
   - إكمال نظام المفضلة
   - تحسين GPS accuracy
   - إضافة bulk operations

### الأولوية المتوسطة

1. **تحسين التصميم**
   - توحيد أنماط التصميم
   - تحسين responsive design
   - إضافة dark mode

2. **إضافة الاختبارات**
   - unit tests للمكونات الأساسية
   - integration tests للـ API
   - E2E tests للتدفقات الرئيسية

### الأولوية المنخفضة

1. **تحسين الميزات المتقدمة**
   - إضافة notifications
   - تحسين search و filtering
   - إضافة analytics

2. **تحسين البنية**
   - إعادة هيكلة المكونات الكبيرة
   - فصل concerns بشكل أفضل
   - تحسين TypeScript types

---

تم إنشاء هذه الوثيقة في 19 نوفمبر 2025 لتكون مرجعاً شاملاً لتطوير نظام مسكني
