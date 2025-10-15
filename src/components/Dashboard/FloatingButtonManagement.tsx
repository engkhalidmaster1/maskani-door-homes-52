import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface FloatingButtonConfig {
  id?: string;
  title: string;
  message: string;
  button_color: string;
  is_enabled: boolean;
  show_on_pages: string[];
  start_date?: Date | null;
  end_date?: Date | null;
  start_time: string;
  end_time: string;
}

const pageOptions = [
  { value: 'home', label: 'الصفحة الرئيسية' },
  { value: 'properties', label: 'صفحة العقارات' },
  { value: 'about', label: 'من نحن' },
  { value: 'contact', label: 'اتصل بنا' },
  { value: 'all', label: 'جميع الصفحات' }
];

const colorOptions = [
  { value: 'primary', label: 'أزرق أساسي', color: 'bg-blue-500' },
  { value: 'secondary', label: 'رمادي ثانوي', color: 'bg-gray-500' },
  { value: 'success', label: 'أخضر نجاح', color: 'bg-green-500' },
  { value: 'warning', label: 'أصفر تحذير', color: 'bg-yellow-500' },
  { value: 'destructive', label: 'أحمر خطر', color: 'bg-red-500' }
];

export const FloatingButtonManagement = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<FloatingButtonConfig>({
    title: 'مرحباً بك في تطبيق "سكني"',
    message: 'منصة متكاملة للعثور على أفضل العقارات للبيع والإيجار في مجمع الدور',
    button_color: 'primary',
    is_enabled: true,
    show_on_pages: ['home'],
    start_date: null,
    end_date: null,
    start_time: '00:00',
    end_time: '23:59'
  });

  const fetchConfig = async () => {
    try {
      const storedConfig = localStorage.getItem('floating_button_config');
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        setConfig({
          ...parsedConfig,
          start_date: parsedConfig.start_date ? new Date(parsedConfig.start_date) : null,
          end_date: parsedConfig.end_date ? new Date(parsedConfig.end_date) : null,
          start_time: parsedConfig.start_time || '00:00',
          end_time: parsedConfig.end_time || '23:59'
        });
      }
    } catch (error) {
      console.error('Error in fetchConfig:', error);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!isAdmin) {
      toast({
        title: "غير مسموح",
        description: "يجب أن تكون مديراً لحفظ الإعدادات",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const configData = {
        id: config.id || 'default',
        title: config.title,
        message: config.message,
        button_color: config.button_color,
        is_enabled: config.is_enabled,
        show_on_pages: config.show_on_pages,
        start_date: config.start_date?.toISOString(),
        end_date: config.end_date?.toISOString(),
        start_time: config.start_time,
        end_time: config.end_time,
        updated_at: new Date().toISOString()
      };

      // Save to localStorage
      localStorage.setItem('floating_button_config', JSON.stringify(configData));
      
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new CustomEvent('floating_button_config_updated'));

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ إعدادات الزر العائم بنجاح"
      });

      fetchConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageToggle = (page: string) => {
    if (page === 'all') {
      setConfig(prev => ({
        ...prev,
        show_on_pages: prev.show_on_pages.includes('all') 
          ? [] 
          : ['all']
      }));
    } else {
      setConfig(prev => {
        const newPages = prev.show_on_pages.includes('all') 
          ? [page]
          : prev.show_on_pages.includes(page)
            ? prev.show_on_pages.filter(p => p !== page)
            : [...prev.show_on_pages.filter(p => p !== 'all'), page];
        return { ...prev, show_on_pages: newPages };
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">يجب أن تكون مديراً للوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">إدارة الزر العائم</h3>
        <Switch
          checked={config.is_enabled}
          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_enabled: checked }))}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>محتوى الرسالة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان الرسالة</Label>
              <Input
                id="title"
                value={config.title}
                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                placeholder="عنوان الرسالة الترحيبية"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">نص الرسالة</Label>
              <Textarea
                id="message"
                value={config.message}
                onChange={(e) => setConfig(prev => ({ ...prev, message: e.target.value }))}
                placeholder="نص الرسالة الترحيبية"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">لون الزر</Label>
              <Select value={config.button_color} onValueChange={(value) => setConfig(prev => ({ ...prev, button_color: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر لون الزر" />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${color.color}`} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Display Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>إعدادات العرض</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>الصفحات المعروض فيها</Label>
              <div className="grid grid-cols-2 gap-2">
                {pageOptions.map((page) => (
                  <Label key={page.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.show_on_pages.includes(page.value)}
                      onChange={() => handlePageToggle(page.value)}
                      className="rounded"
                      aria-label={page.label}
                    />
                    <span className="text-sm">{page.label}</span>
                  </Label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>وقت البداية</Label>
                <Input
                  type="time"
                  value={config.start_time}
                  onChange={(e) => setConfig(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>وقت النهاية</Label>
                <Input
                  type="time"
                  value={config.end_time}
                  onChange={(e) => setConfig(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ البداية (اختياري)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {config.start_date ? format(config.start_date, "PPP", { locale: ar }) : "اختر تاريخ البداية"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={config.start_date || undefined}
                      onSelect={(date) => setConfig(prev => ({ ...prev, start_date: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>تاريخ النهاية (اختياري)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {config.end_date ? format(config.end_date, "PPP", { locale: ar }) : "اختر تاريخ النهاية"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={config.end_date || undefined}
                      onSelect={(date) => setConfig(prev => ({ ...prev, end_date: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>معاينة الزر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 h-32">
            <div className="text-sm text-muted-foreground mb-4">معاينة موضع الزر:</div>
            <Button
              className={`absolute top-4 left-4 rounded-full w-10 h-10 flex items-center justify-center shadow-lg ${
                config.button_color === 'primary' ? 'bg-blue-500 hover:bg-blue-600' :
                config.button_color === 'secondary' ? 'bg-gray-500 hover:bg-gray-600' :
                config.button_color === 'success' ? 'bg-green-500 hover:bg-green-600' :
                config.button_color === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' :
                config.button_color === 'destructive' ? 'bg-red-500 hover:bg-red-600' :
                'bg-blue-500 hover:bg-blue-600'
              }`}
              disabled
            >
              <Clock className="h-5 w-5" />
            </Button>
          </div>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold">{config.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{config.message}</p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} size="lg">
          {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
      </div>
    </div>
  );
};