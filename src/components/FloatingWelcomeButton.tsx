import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FloatingButtonConfig {
  id: string;
  title: string;
  message: string;
  button_color: string;
  is_enabled: boolean;
  show_on_pages: string[];
}

interface FloatingWelcomeButtonProps {
  currentPage?: string;
}

export const FloatingWelcomeButton = ({ currentPage = 'home' }: FloatingWelcomeButtonProps) => {
  const [showModal, setShowModal] = useState(false);
  const [config, setConfig] = useState<FloatingButtonConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      // Get config from localStorage for now (until database is set up)
      const storedConfig = localStorage.getItem('floating_button_config');
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        
        if (parsedConfig.is_enabled) {
          // Check time constraints
          const now = new Date();
          const currentTime = now.toTimeString().substring(0, 5);
          const startTime = parsedConfig.start_time || '00:00';
          const endTime = parsedConfig.end_time || '23:59';
          
          // Check date constraints
          const currentDate = now.toISOString().split('T')[0];
          const startDate = parsedConfig.start_date ? parsedConfig.start_date.split('T')[0] : null;
          const endDate = parsedConfig.end_date ? parsedConfig.end_date.split('T')[0] : null;

          const isWithinTimeRange = currentTime >= startTime && currentTime <= endTime;
          const isWithinDateRange = (!startDate || currentDate >= startDate) && 
                                   (!endDate || currentDate <= endDate);

          if (isWithinTimeRange && isWithinDateRange) {
            setConfig(parsedConfig);
          } else {
            setConfig(null);
          }
        } else {
          setConfig(null);
        }
      } else {
        // Default config
        const defaultConfig = {
          id: 'default',
          title: 'مرحباً بك في تطبيق "سكني"',
          message: 'منصة متكاملة للعثور على أفضل العقارات للبيع والإيجار في مجمع الدور',
          button_color: 'primary',
          is_enabled: true,
          show_on_pages: ['home']
        };
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error('Error in fetchConfig:', error);
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();

    // Listen for localStorage changes
    const handleStorageChange = () => {
      fetchConfig();
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom events for same-tab updates
    window.addEventListener('floating_button_config_updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('floating_button_config_updated', handleStorageChange);
    };
  }, []);

  // Close modal when currentPage changes
  useEffect(() => {
    setShowModal(false);
  }, [currentPage]);

  // Don't show if loading, no config, or not enabled for current page
  if (loading || !config || !config.is_enabled) {
    return null;
  }

  // Check if should show on current page
  const shouldShow = config.show_on_pages.includes('all') || 
                    config.show_on_pages.includes(currentPage);

  if (!shouldShow) {
    return null;
  }

  const getButtonColorClass = (color: string) => {
    switch (color) {
      case 'primary':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'secondary':
        return 'bg-gray-500 hover:bg-gray-600 text-white';
      case 'success':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'destructive':
        return 'bg-red-500 hover:bg-red-600 text-white';
      default:
        return 'bg-blue-500 hover:bg-blue-600 text-white';
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setShowModal(true)}
        className={`fixed top-20 left-4 z-50 shadow-lg rounded-full w-10 h-10 flex items-center justify-center ${getButtonColorClass(config.button_color)}`}
        aria-label="عرض رسالة الترحيب"
      >
        <AlertCircle className="h-5 w-5" />
      </Button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
              onClick={() => setShowModal(false)}
              aria-label="إغلاق الرسالة الترحيبية"
            >
              <X className="h-5 w-5" />
            </Button>
            
            {/* Modal Content */}
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4 text-gray-800">
                {config.title}
              </h1>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {config.message}
              </p>
              <Button
                onClick={() => setShowModal(false)}
                className={`px-6 py-2 rounded-lg ${getButtonColorClass(config.button_color)}`}
              >
                تصفح العقارات
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};