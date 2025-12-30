#!/bin/bash
# Script للتحديث التلقائي لمؤشرات النظام
# يمكن تشغيله كـ cron job

# إعداد متغيرات البيئة (استبدل بالقيم الصحيحة)
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-anon-key"
DATABASE_URL="postgresql://username:password@host:port/database"

echo "$(date): بدء تحديث مؤشرات النظام"

# تشغيل SQL للتحديث
psql "$DATABASE_URL" -f UPDATE_SYSTEM_METRICS.sql

if [ $? -eq 0 ]; then
    echo "$(date): تم تحديث مؤشرات النظام بنجاح"
else
    echo "$(date): خطأ في تحديث مؤشرات النظام"
    exit 1
fi

echo "$(date): انتهاء تحديث مؤشرات النظام"