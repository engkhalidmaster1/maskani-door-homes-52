# خطة تنفيذ المرحلة الأولى - تطبيق سكني

## نظرة عامة على المرحلة الأولى

**المدة المتوقعة**: 2-3 أسابيع  
**الأولوية**: عالية  
**الهدف**: تحسين تجربة المستخدم وإضافة ميزات التواصل الأساسية

---

## 1. نظام الرسائل والتواصل المباشر

### 1.1 إنشاء قاعدة البيانات

#### جدول المحادثات (conversations)
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(property_id, buyer_id, seller_id)
);
```

#### جدول الرسائل (messages)
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- text, image, file
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 1.2 المكونات المطلوبة

#### صفحة المحادثات (ConversationsPage)
- قائمة المحادثات النشطة
- عرض آخر رسالة
- وقت آخر رسالة
- عدد الرسائل غير المقروءة
- البحث في المحادثات

#### صفحة المحادثة (ChatPage)
- عرض الرسائل
- إرسال رسائل جديدة
- إرسال صور
- مؤشر الكتابة
- إشعارات الرسائل الجديدة

#### مكونات إضافية
- `MessageBubble` - فقاعة الرسالة
- `MessageInput` - حقل إدخال الرسالة
- `ConversationList` - قائمة المحادثات
- `ChatHeader` - رأس المحادثة

### 1.3 الوظائف المطلوبة

#### Hook: useConversations
```typescript
interface UseConversations {
  conversations: Conversation[];
  isLoading: boolean;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  createConversation: (propertyId: string, sellerId: string) => Promise<string>;
}
```

#### Hook: useChat
```typescript
interface UseChat {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  sendImage: (file: File) => Promise<void>;
  markAsRead: () => Promise<void>;
}
```

### 1.4 التنفيذ

#### الأسبوع الأول
- [ ] إنشاء جداول قاعدة البيانات
- [ ] إنشاء الواجهات البرمجية (APIs)
- [ ] تطوير Hooks الأساسية
- [ ] إنشاء صفحة المحادثات

#### الأسبوع الثاني
- [ ] تطوير صفحة المحادثة
- [ ] إضافة إرسال الصور
- [ ] إضافة الإشعارات
- [ ] اختبار النظام

---

## 2. معرض صور محسن

### 2.1 المكونات المطلوبة

#### معرض الصور التفاعلي (ImageGallery)
- عرض الصور في شبكة
- معرض Lightbox
- التنقل بين الصور
- تكبير وتصغير الصور
- تحميل الصور

#### رفع الصور المحسن (EnhancedImageUpload)
- سحب وإفلات (Drag & Drop)
- معاينة فورية
- تحرير أساسي (قص، تدوير)
- ضغط تلقائي
- التحقق من نوع الملف

### 2.2 المكتبات المطلوبة

```json
{
  "react-image-lightbox": "^5.1.4",
  "react-dropzone": "^14.2.3",
  "react-image-crop": "^10.1.8",
  "browser-image-compression": "^2.0.2"
}
```

### 2.3 الميزات

#### معرض Lightbox
- عرض الصور بحجم كامل
- التنقل بالسهم أو النقر
- إغلاق بالضغط على ESC
- تحميل تدريجي للصور

#### تحرير الصور
- قص الصور
- تدوير الصور
- ضبط السطوع والتباين
- حفظ التعديلات

#### تحسين الأداء
- ضغط الصور تلقائياً
- تحميل تدريجي
- تخزين مؤقت
- تحسين للهواتف

### 2.4 التنفيذ

#### الأسبوع الأول
- [ ] تثبيت المكتبات المطلوبة
- [ ] تطوير معرض Lightbox
- [ ] إضافة سحب وإفلات

#### الأسبوع الثاني
- [ ] تطوير تحرير الصور
- [ ] إضافة ضغط الصور
- [ ] تحسين الأداء
- [ ] اختبار على الأجهزة المختلفة

---

## 3. نظام المقارنة بين العقارات

### 3.1 قاعدة البيانات

#### جدول المقارنات (comparisons)
```sql
CREATE TABLE comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### جدول عقارات المقارنة (comparison_properties)
```sql
CREATE TABLE comparison_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_id UUID REFERENCES comparisons(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comparison_id, property_id)
);
```

### 3.2 المكونات المطلوبة

#### زر المقارنة (CompareButton)
- إضافة/إزالة من المقارنة
- عداد العقارات المختارة
- إشعار عند الإضافة

#### صفحة المقارنة (ComparisonPage)
- عرض العقارات جنباً إلى جنب
- مقارنة تفصيلية
- إزالة عقارات
- حفظ المقارنة

#### جدول المقارنة (ComparisonTable)
- مقارنة السعر
- مقارنة المساحة
- مقارنة المميزات
- مقارنة الموقع

### 3.3 الميزات

#### المقارنة التفصيلية
- السعر والمساحة
- عدد الغرف والحمامات
- المميزات والخدمات
- الموقع والمنطقة
- الصور

#### إدارة المقارنات
- إنشاء مقارنات متعددة
- حفظ المقارنات
- مشاركة المقارنات
- تصدير المقارنات

### 3.4 التنفيذ

#### الأسبوع الثاني
- [ ] إنشاء جداول قاعدة البيانات
- [ ] تطوير زر المقارنة
- [ ] إنشاء صفحة المقارنة

#### الأسبوع الثالث
- [ ] تطوير جدول المقارنة
- [ ] إضافة حفظ المقارنات
- [ ] اختبار النظام

---

## الجدول الزمني التفصيلي

### الأسبوع الأول
**الهدف**: نظام الرسائل + معرض الصور الأساسي

#### الأيام 1-2: قاعدة البيانات
- [ ] إنشاء جداول المحادثات والرسائل
- [ ] إنشاء الواجهات البرمجية
- [ ] اختبار قاعدة البيانات

#### الأيام 3-4: نظام الرسائل الأساسي
- [ ] تطوير Hooks الأساسية
- [ ] إنشاء صفحة المحادثات
- [ ] إنشاء صفحة المحادثة الأساسية

#### الأيام 5-7: معرض الصور
- [ ] تثبيت المكتبات
- [ ] تطوير معرض Lightbox
- [ ] إضافة سحب وإفلات

### الأسبوع الثاني
**الهدف**: إكمال نظام الرسائل + تحسين معرض الصور

#### الأيام 1-3: إكمال نظام الرسائل
- [ ] إضافة إرسال الصور
- [ ] إضافة الإشعارات
- [ ] تحسين الواجهة

#### الأيام 4-5: تحسين معرض الصور
- [ ] تطوير تحرير الصور
- [ ] إضافة ضغط الصور
- [ ] تحسين الأداء

#### الأيام 6-7: نظام المقارنة الأساسي
- [ ] إنشاء جداول المقارنة
- [ ] تطوير زر المقارنة
- [ ] إنشاء صفحة المقارنة الأساسية

### الأسبوع الثالث
**الهدف**: إكمال نظام المقارنة + اختبار شامل

#### الأيام 1-3: إكمال نظام المقارنة
- [ ] تطوير جدول المقارنة التفصيلي
- [ ] إضافة حفظ المقارنات
- [ ] تحسين الواجهة

#### الأيام 4-5: اختبار شامل
- [ ] اختبار نظام الرسائل
- [ ] اختبار معرض الصور
- [ ] اختبار نظام المقارنة

#### الأيام 6-7: تحسينات نهائية
- [ ] إصلاح الأخطاء
- [ ] تحسين الأداء
- [ ] تحسين تجربة المستخدم

---

## معايير النجاح

### نظام الرسائل
- [ ] إرسال واستقبال الرسائل النصية
- [ ] إرسال الصور
- [ ] إشعارات في الوقت الفعلي
- [ ] البحث في المحادثات
- [ ] واجهة سهلة الاستخدام

### معرض الصور
- [ ] معرض Lightbox يعمل بشكل مثالي
- [ ] سحب وإفلات للصور
- [ ] تحرير أساسي للصور
- [ ] ضغط تلقائي للصور
- [ ] أداء جيد على جميع الأجهزة

### نظام المقارنة
- [ ] إضافة/إزالة من المقارنة
- [ ] مقارنة تفصيلية
- [ ] حفظ المقارنات
- [ ] واجهة واضحة وسهلة

---

## المخاطر والتحديات

### مخاطر تقنية
1. **أداء معرض الصور**: قد يكون بطيئاً مع الصور الكبيرة
   - **الحل**: ضغط الصور وتحسين التحميل

2. **مزامنة الرسائل**: قد تكون هناك مشاكل في المزامنة
   - **الحل**: استخدام WebSockets أو Polling

3. **تخزين المقارنات**: قد تستهلك مساحة كبيرة
   - **الحل**: تحديد عدد العقارات في المقارنة

### مخاطر التصميم
1. **تعقيد الواجهة**: قد تكون معقدة للمستخدمين
   - **الحل**: تصميم بسيط وواضح

2. **الأداء على الهواتف**: قد يكون بطيئاً
   - **الحل**: تحسين للأجهزة المحمولة

---

## المخرجات النهائية

### ملفات جديدة
- `src/pages/Conversations.tsx`
- `src/pages/Chat.tsx`
- `src/pages/Comparison.tsx`
- `src/components/Chat/`
- `src/components/Comparison/`
- `src/hooks/useConversations.tsx`
- `src/hooks/useChat.tsx`
- `src/hooks/useComparison.tsx`

### تحديثات قاعدة البيانات
- جدول `conversations`
- جدول `messages`
- جدول `comparisons`
- جدول `comparison_properties`

### تحديثات الواجهة
- تحسين معرض الصور
- إضافة أزرار المقارنة
- إضافة أيقونات الرسائل

---

*آخر تحديث: يناير 2025*


