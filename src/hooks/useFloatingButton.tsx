import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FloatingButtonConfig {
  id: string;
  title: string;
  message: string;
  button_color: string;
  is_enabled: boolean;
  show_on_pages: string[];
}

export const useFloatingButton = (currentPage: string = 'home') => {
  const [config, setConfig] = useState<FloatingButtonConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase.rpc('get_active_floating_button_config');
      if (error) {
        console.error('Error fetching floating button config:', error);
        return;
      }
      if (data && data.length > 0) {
        setConfig(data[0]);
      } else {
        setConfig(null);
      }
    } catch (error) {
      console.error('Error in fetchConfig:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();

    // Listen for real-time updates
    const channel = supabase
      .channel('floating_button_config_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'floating_button_config'
        },
        () => {
          fetchConfig();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Check if button should be shown on current page
  const shouldShow = config && 
    config.is_enabled && 
    config.show_on_pages.includes(currentPage);

  return {
    config,
    loading,
    shouldShow,
    refetch: fetchConfig
  };
};