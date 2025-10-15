import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

const AdminStatusUpdater = () => {
  const [copiedCommand, setCopiedCommand] = useState('');

  const sqlCommands = [
    {
      title: "إعداد سريع - 3 عقارات للاختبار",
      description: "يحدث أول 3 عقارات: واحد مباع، واحد مؤجر، واحد قيد التفاوض",
      sql: `-- إعداد سريع للاختبار
UPDATE properties SET status = 'sold' WHERE id = (
  SELECT id FROM properties ORDER BY created_at DESC LIMIT 1
);

UPDATE properties SET status = 'rented' WHERE id = (
  SELECT id FROM properties ORDER BY created_at DESC LIMIT 1 OFFSET 1
);

UPDATE properties SET status = 'under_negotiation' WHERE id = (
  SELECT id FROM properties ORDER BY created_at DESC LIMIT 1 OFFSET 2
);

-- تحقق من النتائج
SELECT id, title, status, created_at FROM properties WHERE status IS NOT NULL ORDER BY updated_at DESC LIMIT 5;`
    },
    {
      title: "تحديث عقار محدد - مباع",
      description: "استبدل [ID] برقم العقار المطلوب",
      sql: `-- تحديث عقار محدد كمباع
UPDATE properties SET status = 'sold' WHERE id = '[ID]';

-- مثال: UPDATE properties SET status = 'sold' WHERE id = '123';`
    },
    {
      title: "تحديث عقار محدد - مؤجر", 
      description: "استبدل [ID] برقم العقار المطلوب",
      sql: `-- تحديث عقار محدد كمؤجر
UPDATE properties SET status = 'rented' WHERE id = '[ID]';

-- مثال: UPDATE properties SET status = 'rented' WHERE id = '123';`
    },
    {
      title: "إعادة تعيين الكل كمتاح",
      description: "يجعل جميع العقارات متاحة",
      sql: `-- إعادة تعيين جميع العقارات كمتاحة
UPDATE properties SET status = 'available';

-- تحقق من النتائج
SELECT COUNT(*) as total_available FROM properties WHERE status = 'available';`
    },
    {
      title: "عرض حالة جميع العقارات",
      description: "استعلام لرؤية توزيع حالات العقارات",
      sql: `-- عرض إحصائيات حالة العقارات
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM properties 
GROUP BY status 
ORDER BY count DESC;

-- عرض آخر 10 عقارات محدثة
SELECT id, title, status, updated_at 
FROM properties 
ORDER BY updated_at DESC 
LIMIT 10;`
    }
  ];

  const copyToClipboard = (text: string, commandTitle: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(commandTitle);
    setTimeout(() => setCopiedCommand(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🗄️ أوامر SQL لتحديث حالة الصفقات
        </h1>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
          <h2 className="font-semibold text-blue-800 mb-2">� كيفية الاستخدام:</h2>
          <ol className="text-blue-700 text-sm space-y-1">
            <li>1. اذهب إلى <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a></li>
            <li>2. اختر مشروعك → SQL Editor</li>
            <li>3. انسخ أحد الأوامر أدناه والصقه</li>
            <li>4. اضغط Run لتنفيذ الأمر</li>
            <li>5. أعد تحميل التطبيق لرؤية النتائج</li>
          </ol>
        </div>

        <div className="space-y-6">
          {sqlCommands.map((command, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800">{command.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{command.description}</p>
              </div>
              <div className="p-4">
                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{command.sql}</code>
                  </pre>
                  <Button
                    onClick={() => copyToClipboard(command.sql, command.title)}
                    className="absolute top-2 right-2 px-3 py-1 text-xs"
                    variant={copiedCommand === command.title ? "default" : "outline"}
                  >
                    {copiedCommand === command.title ? "✅ تم النسخ" : "📋 نسخ"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ ملاحظات مهمة:</h3>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• تأكد من عمل نسخة احتياطية قبل تشغيل أوامر التحديث</li>
            <li>• استبدل [ID] بأرقام العقارات الحقيقية</li>
            <li>• أعد تحميل التطبيق بعد التحديث لرؤية التغييرات</li>
            <li>• البادجز ستظهر فقط للعقارات غير المتاحة (sold, rented, under_negotiation)</li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <Button 
            onClick={() => window.history.back()}
            variant="outline"
          >
            🔙 العودة
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminStatusUpdater;