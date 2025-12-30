-- تنظيف البيانات المكررة من جدول البطاقات
-- هذا الملف يحذف التكرارات مع الحفاظ على الترتيب الصحيح

-- عرض البيانات قبل التنظيف
SELECT COUNT(*) as total_cards_before FROM home_cards;

-- حذف التكرارات (الحفاظ على الصف الأقدم لكل عنوان)
DELETE FROM home_cards
WHERE id NOT IN (
    SELECT DISTINCT ON (title) id
    FROM home_cards
    ORDER BY title, created_at ASC
);

-- عرض البيانات بعد التنظيف
SELECT COUNT(*) as total_cards_after FROM home_cards;

-- عرض البيانات النهائية مرتبة
SELECT title, description, display_order
FROM home_cards
ORDER BY display_order ASC;