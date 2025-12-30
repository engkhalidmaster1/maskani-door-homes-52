import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Google Analytics Measurement ID - يجب استبداله بمعرف حقيقي
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export const useAnalytics = () => {
  const location = useLocation();

  // Track page views
  useEffect(() => {
    if (window.gtag) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  const trackEvent = (
    action: string,
    category: string,
    label?: string,
    value?: number
  ) => {
    if (window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  };

  const trackPropertyView = (propertyId: string, propertyTitle: string) => {
    trackEvent('view_property', 'engagement', propertyTitle, parseInt(propertyId));
  };

  const trackPropertyAdd = (propertyType: string) => {
    trackEvent('add_property', 'conversion', propertyType);
  };

  const trackSearch = (searchTerm: string, resultsCount: number) => {
    trackEvent('search', 'engagement', searchTerm, resultsCount);
  };

  const trackUserRegistration = (method: string) => {
    trackEvent('sign_up', 'conversion', method);
  };

  const trackUserLogin = (method: string) => {
    trackEvent('login', 'engagement', method);
  };

  const trackFavoriteAdd = (propertyId: string) => {
    trackEvent('add_favorite', 'engagement', propertyId);
  };

  const trackContactClick = (propertyId: string, contactType: string) => {
    trackEvent('contact_click', 'conversion', `${propertyId}_${contactType}`);
  };

  return {
    trackEvent,
    trackPropertyView,
    trackPropertyAdd,
    trackSearch,
    trackUserRegistration,
    trackUserLogin,
    trackFavoriteAdd,
    trackContactClick,
  };
};

// Initialize Google Analytics
export const initAnalytics = () => {
  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_features: false,
  });
};

// Analytics utility functions
export const analytics = {
  // User engagement
  trackUserEngagement: (action: string, details?: Record<string, unknown>) => {
    if (window.gtag) {
      window.gtag('event', 'user_engagement', {
        action,
        ...details,
      });
    }
  },

  // Performance tracking
  trackPerformance: (metric: string, value: number, unit: string = 'ms') => {
    if (window.gtag) {
      window.gtag('event', 'performance_metric', {
        metric_name: metric,
        value,
        unit,
      });
    }
  },

  // Error tracking
  trackError: (error: Error, context?: string) => {
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        context,
      });
    }
  },

  // Custom timing
  trackTiming: (name: string, value: number, category: string = 'user_timing') => {
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name,
        value,
        event_category: category,
      });
    }
  },

  // E-commerce tracking (for future property transactions)
  trackPurchase: (transactionId: string, value: number, currency: string = 'SAR') => {
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: transactionId,
        value,
        currency,
        items: [{
          item_id: transactionId,
          item_name: 'property_transaction',
          price: value,
          quantity: 1,
        }],
      });
    }
  },
};