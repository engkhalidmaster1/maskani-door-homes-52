import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useHomePageSettings } from "@/hooks/useHomePageSettings";
import { Save, Eye, EyeOff, Search } from "lucide-react";

export const SearchBarSettings = () => {
  const { settings, updateSettings, isUpdating } = useHomePageSettings();
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [searchBarTitle, setSearchBarTitle] = useState('');
  const [searchBarSubtitle, setSearchBarSubtitle] = useState('');

  useEffect(() => {
    if (settings) {
      setShowSearchBar(settings.show_search_bar);
      setSearchBarTitle(settings.search_bar_title);
      setSearchBarSubtitle(settings.search_bar_subtitle);
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings({
      show_search_bar: showSearchBar,
      search_bar_title: searchBarTitle,
      search_bar_subtitle: searchBarSubtitle,
    });
  };

  const handleReset = () => {
    setSearchBarTitle('ابحث عن عقارك المثالي');
    setSearchBarSubtitle('أسرع طريقة للعثور على منزل أحلامك');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            إعدادات شريط البحث المتقدم
          </CardTitle>
          <CardDescription>
            تحكم في إظهار وإخفاء شريط البحث المتقدم وتخصيص العناوين
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* تفعيل/تعطيل شريط البحث */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-semibold">عرض شريط البحث</Label>
              <p className="text-sm text-gray-600">
                إظهار أو إخفاء شريط البحث المتقدم في الصفحة الرئيسية
              </p>
            </div>
            <div className="flex items-center gap-3">
              {showSearchBar ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Eye className="h-5 w-5" />
                  <span className="text-sm font-medium">ظاهر</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <EyeOff className="h-5 w-5" />
                  <span className="text-sm font-medium">مخفي</span>
                </div>
              )}
              <Switch
                checked={showSearchBar}
                onCheckedChange={setShowSearchBar}
              />
            </div>
          </div>

          {/* عنوان شريط البحث */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">عنوان شريط البحث</Label>
            <Input
              value={searchBarTitle}
              onChange={(e) => setSearchBarTitle(e.target.value)}
              placeholder="ابحث عن عقارك المثالي"
              className="text-lg"
            />
            <p className="text-sm text-gray-500">
              العنوان الرئيسي الذي يظهر فوق شريط البحث
            </p>
          </div>

          {/* نص فرعي لشريط البحث */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">النص الفرعي</Label>
            <Input
              value={searchBarSubtitle}
              onChange={(e) => setSearchBarSubtitle(e.target.value)}
              placeholder="أسرع طريقة للعثور على منزل أحلامك"
            />
            <p className="text-sm text-gray-500">
              النص الوصفي الذي يظهر أسفل العنوان
            </p>
          </div>

          {/* معاينة */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">معاينة</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-white">
              {showSearchBar ? (
                <div className="text-center space-y-3">
                  {searchBarTitle && (
                    <h3 className="text-2xl font-bold text-gray-900">
                      {searchBarTitle}
                    </h3>
                  )}
                  {searchBarSubtitle && (
                    <p className="text-gray-600">
                      {searchBarSubtitle}
                    </p>
                  )}
                  <div className="bg-gray-100 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Search className="h-5 w-5" />
                      <span>شريط البحث سيظهر هنا...</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <EyeOff className="h-12 w-12 mx-auto mb-3" />
                  <p>شريط البحث مخفي</p>
                </div>
              )}
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1"
            >
              استعادة القيم الافتراضية
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* معلومات إضافية */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">معلومات حول شريط البحث المتقدم</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <div className="bg-primary/10 text-primary rounded-full p-1 mt-0.5">
              <Search className="h-3 w-3" />
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">بحث فوري وذكي</p>
              <p>يعرض نتائج البحث بشكل فوري أثناء الكتابة مع اقتراحات ذكية</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="bg-primary/10 text-primary rounded-full p-1 mt-0.5">
              <Search className="h-3 w-3" />
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">فلاتر متقدمة</p>
              <p>يحتوي على فلاتر للنوع، السعر، الموقع، وعدد الغرف</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="bg-primary/10 text-primary rounded-full p-1 mt-0.5">
              <Search className="h-3 w-3" />
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">تجربة مستخدم ممتازة</p>
              <p>تصميم احترافي ومتجاوب يعمل على جميع الأجهزة</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
