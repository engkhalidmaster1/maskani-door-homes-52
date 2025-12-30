-- إنشاء جدول بطاقات الصفحة الرئيسية
CREATE TABLE IF NOT EXISTS home_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name VARCHAR(50) NOT NULL, -- Search, Building2, PlusCircle, User
    path VARCHAR(100) NOT NULL,
    requires_auth BOOLEAN DEFAULT FALSE,
    bg_color VARCHAR(50) DEFAULT 'bg-blue-50',
    icon_color VARCHAR(50) DEFAULT 'bg-blue-500',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول إعدادات الصفحة الرئيسية
CREATE TABLE IF NOT EXISTS home_page_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    show_search_bar BOOLEAN DEFAULT TRUE,
    search_bar_title TEXT DEFAULT 'ابحث عن عقارك المثالي',
    search_bar_subtitle TEXT DEFAULT 'أسرع طريقة للعثور على منزل أحلامك',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تنظيف البيانات المكررة من جدول البطاقات
DELETE FROM home_cards
WHERE id NOT IN (
    SELECT DISTINCT ON (title) id
    FROM home_cards
    ORDER BY title, created_at ASC
);

-- إدراج الإعدادات الافتراضية
INSERT INTO home_page_settings (show_search_bar, search_bar_title, search_bar_subtitle)
VALUES (true, 'ابحث عن عقارك المثالي', 'أسرع طريقة للعثور على منزل أحلامك')
ON CONFLICT DO NOTHING;

-- إدراج البيانات الافتراضية (مع تجنب التكرار)
INSERT INTO home_cards (title, description, icon_name, path, requires_auth, bg_color, icon_color, display_order)
VALUES
    ('وين اسكن', 'اختر سكنك بسرعة و سهولة على الخريطة', 'Search', '/map', false, 'bg-blue-50', 'bg-blue-500', 1),
    ('العقارات المتوفرة الآن', 'تصفح جميع العقارات المتاحة للبيع والإيجار', 'Building2', '/properties', false, 'bg-purple-50', 'bg-purple-500', 2),
    ('إضافة عقار جديد', 'أضف عقارك للبيع أو الإيجار في دقائق', 'PlusCircle', '/add-property', true, 'bg-green-50', 'bg-green-500', 3),
    ('ملفي الشخصي', 'إدارة حسابك الشخصي وإعداداتك', 'User', '/profile', true, 'bg-orange-50', 'bg-orange-500', 4)
ON CONFLICT DO NOTHING;

-- إنشاء فهرس للترتيب
CREATE INDEX IF NOT EXISTS idx_home_cards_order ON home_cards(display_order);

-- دالة للحصول على البطاقات النشطة مرتبة
CREATE OR REPLACE FUNCTION get_active_home_cards()
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    icon_name VARCHAR(50),
    path VARCHAR(100),
    requires_auth BOOLEAN,
    bg_color VARCHAR(50),
    icon_color VARCHAR(50),
    display_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        hc.id,
        hc.title,
        hc.description,
        hc.icon_name,
        hc.path,
        hc.requires_auth,
        hc.bg_color,
        hc.icon_color,
        hc.display_order
    FROM home_cards hc
    WHERE hc.is_active = TRUE
    ORDER BY hc.display_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لتحديث ترتيب البطاقة
CREATE OR REPLACE FUNCTION update_card_order(
    p_card_id UUID,
    p_new_order INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE home_cards
    SET 
        display_order = p_new_order,
        updated_at = NOW()
    WHERE id = p_card_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لتحديث بيانات البطاقة
CREATE OR REPLACE FUNCTION update_home_card(
    p_card_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_icon_name VARCHAR(50),
    p_path VARCHAR(100),
    p_requires_auth BOOLEAN,
    p_bg_color VARCHAR(50),
    p_icon_color VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE home_cards
    SET 
        title = p_title,
        description = p_description,
        icon_name = p_icon_name,
        path = p_path,
        requires_auth = p_requires_auth,
        bg_color = p_bg_color,
        icon_color = p_icon_color,
        updated_at = NOW()
    WHERE id = p_card_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للحصول على إعدادات الصفحة الرئيسية
CREATE OR REPLACE FUNCTION get_home_page_settings()
RETURNS TABLE (
    id UUID,
    show_search_bar BOOLEAN,
    search_bar_title TEXT,
    search_bar_subtitle TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        hps.id,
        hps.show_search_bar,
        hps.search_bar_title,
        hps.search_bar_subtitle
    FROM home_page_settings hps
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لتحديث إعدادات الصفحة الرئيسية
CREATE OR REPLACE FUNCTION update_home_page_settings(
    p_show_search_bar BOOLEAN,
    p_search_bar_title TEXT,
    p_search_bar_subtitle TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE home_page_settings
    SET 
        show_search_bar = p_show_search_bar,
        search_bar_title = p_search_bar_title,
        search_bar_subtitle = p_search_bar_subtitle,
        updated_at = NOW()
    WHERE id = (SELECT id FROM home_page_settings LIMIT 1);
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح الصلاحيات
GRANT SELECT ON home_cards TO authenticated;
GRANT SELECT ON home_page_settings TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_home_cards() TO authenticated;
GRANT EXECUTE ON FUNCTION update_card_order(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_home_card(UUID, TEXT, TEXT, VARCHAR, VARCHAR, BOOLEAN, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_home_page_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION update_home_page_settings(BOOLEAN, TEXT, TEXT) TO authenticated;