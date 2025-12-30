# Copilot Instructions — النسخة المنسّقة (Markdown)


## المعمارية ونقاط الدخول

- SPA مبنية بـ Vite + React + TypeScript. نقطة الدخول `src/main.tsx`، التوجيه داخل `src/App.tsx` باستخدام React Router.
- التخطيط العام عبر `AppLayout` على مستوى الراوتر: لا تضع Layout داخل كل صفحة؛ الصفحات تُعرض داخل `<Route element={<AppLayout />}>`.
- الواجهة: shadcn-ui في `src/components/ui/*` مع Tailwind و`cn()` من `src/lib/utils.ts`. RTL مفعّل عالميًا والخط Tajawal في `src/index.css`.
- Alias: استخدم `@` → `src` (موافِق لـ `vite.config.ts` و `tsconfig*.json`).


## القواعد الأساسية للتوجيه (Routing)

- جميع المسارات تُسجّل في `src/App.tsx`.
- الصفحات التي تتطلب دخول يجب لفّها داخل `<ProtectedRoute> ... </ProtectedRoute>`.
- `/dashboard` يعيد التوجيه إلى تبويب افتراضي (`/dashboard/overview`).
- اجعل الصفحات خفيفة؛ انقل المنطق الثقيل إلى hooks.
- استخدم lazy imports للصفحات الثقيلة لتقليل الباندل المبدئي.


## طبقات البيانات

- الويب: `useOfflineSync.tsx` يتعامل مع التخزين المحلي والمزامنة الدورية. لا تنشئ مفاتيح `localStorage` جديدة؛ التزم بالأسماء المعتمدة.
- سطح المكتب (Electron): تخزين JSON في `%APPDATA%/maskani-desktop/data/*` عبر IPC مكشوف من `public/preload.cjs`، ولا يُستدعى Electron مباشرة من الـ renderer.


## Supabase / الصلاحيات

- العميل في `src/integrations/supabase/client.ts` (URL + anon key مضمنة؛ لا حاجة لملف .env).
- تحديد الدور:
	1. استدعاء RPC `is_admin` أولًا.
	2. عند الفشل: fallback محلي محدود. يمكن استدعاء `ensure_super_admin` فقط في تدفقات محددة.
- لا تُعدّل RLS ولا تُنشئ RPCs جديدة.


## سطح IPC المسموح به (أمثلة)

```ts
// قاعدة البيانات المحلية (Electron)
const all = await window.electronAPI.db.getAllProperties();
await window.electronAPI.db.insertProperty({ /* ... */ });

// المفضلة
const favs = await window.electronAPI.db.getFavorites(userId);

// المزامنة
await window.electronSync.syncNow();
const status = await window.electronSync.getSyncStatus();
```

- لا تُنشئ قنوات IPC جديدة، لا تتجاوز `preload.cjs`، ولفّ الاستدعاءات بـ try/catch.
- لا تستخدم `fs` أو وحدات Electron مباشرة من الـ renderer.


## إضافة صفحة جديدة (النموذج الصحيح لهذا المشروع)

1. أنشئ: `src/pages/NewPage.tsx`

```tsx
export default function NewPage() {
	return <div className=\"p-4\">Hello</div>;
}
```

1. سجل المسار في `src/App.tsx` (لا حاجة لاستيراد Layout داخل الصفحة):

```tsx
<Route path=\"/new\" element={
	<ProtectedRoute>
		<NewPage />
	</ProtectedRoute>
} />
```


## البناء والتشغيل

- التثبيت: `npm i`
- تطوير الويب: `npm run dev` (المنفذ 8081)
- تطوير Electron: `npm run electron-dev` (ينتظر 8081؛ وملف main يحاول 8084 → 8080 عند الحاجة)
- الفحص: `npm run lint`
- بناء الويب: `npm run build`
- تغليف سطح المكتب: `npm run package-win|package-mac|package-linux` أو `npm run dist-all` (المخرجات في `dist-electron/`)


## Vite والأداء

- `manualChunks` مفعّلة لتقسيم الباندل (مثل `vendor-react`, `vendor-radix`, `vendor-supabase`, إلخ). تجنّب استيراد مكتبات ثقيلة في مسارات عليا.
- PWA مهيّأة كـ stub يدوي؛ لا تفعل service workers.


## لا تفعل

- لا تستخدم `useState` لبيانات الخادم؛ استخدم React Query عبر hooks.
- لا تُدخل مكتبات UI جديدة.
- لا تُنشئ قنوات IPC جديدة.
- لا تعدّل `vite.config.ts` بلا سبب وجيه.
- لا تستبدل استيراد `@` بمسارات نسبية.
- لا تتجاوز `AppLayout` أو `ProtectedRoute`.
- لا تُنشئ طبقات بيانات/مزامنة بديلة.
- لا تُضف RPCs جديدة في Supabase.


## مسارات وملفات مفتاحية

- `src/App.tsx` — تعريف الراوت، `ProtectedRoute`، وتحويل `/dashboard`.
- `src/hooks/useAuth.tsx` — الجلسات والأدوار وfallback.
- `src/hooks/useOfflineSync.tsx` — مزامنة الويب والتخزين المحلي.
- `public/electron.cjs` و `public/preload.cjs` — main و surface الآمن للـ IPC.
- `src/lib/utils.ts` — دالة `cn()`.
- `src/index.css` — RTL، الخطوط، متغيرات الثيم.

