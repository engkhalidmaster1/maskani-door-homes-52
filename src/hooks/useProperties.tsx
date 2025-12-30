import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCachedFetch, useDataCache } from "@/hooks/useImageCache";
import { PostgrestError } from "@supabase/supabase-js";
import { MarketValue, getMarketLabel, resolveMarketValue } from "@/constants/markets";

interface Property {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  property_type: string;
  listing_type: "sale" | "rent";
  price: number;
  area: number | null;
  bedrooms: number;
  bathrooms: number;
  location: string | null;
  address: string | null;
  amenities: string[] | null;
  images: string[] | null;
  is_published: boolean;
  is_hidden?: boolean;
  status?: string; // available, sold, rented, under_negotiation
  created_at: string;
  updated_at: string;
  ownership_type?: string | null;
  property_code?: string;
  latitude?: number | null;
  longitude?: number | null;
  market?: MarketValue | null;
  marketLabel?: string | null;
}

type RawProperty = Record<string, unknown>;

const parseCoordinate = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const numericValue = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const toProperty = (item: RawProperty | Property): Property => {
  const raw = item as RawProperty;
  const existing = item as Property;

  const listingTypeRaw = raw["listing_type"];
  const listing_type: "sale" | "rent" = listingTypeRaw === "rent" ? "rent" : "sale";

  const latitude = parseCoordinate(raw["latitude"]);
  const longitude = parseCoordinate(raw["longitude"]);

  const resolvedMarket = resolveMarketValue(
    (raw["market"] as string | null | undefined) ??
      (raw["market_name"] as string | null | undefined) ??
      (raw["market_label"] as string | null | undefined) ??
      (raw["market_slug"] as string | null | undefined) ??
      (raw["location"] as string | null | undefined) ??
      existing.market ??
      null
  );

  const status = (raw["status"] as string) || existing.status || 'available';

  return {
    ...existing,
    listing_type,
    status,
    latitude: latitude ?? existing.latitude ?? null,
    longitude: longitude ?? existing.longitude ?? null,
    market: resolvedMarket ?? null,
    marketLabel: resolvedMarket ? getMarketLabel(resolvedMarket) : existing.marketLabel ?? null,
  };
};

export const useProperties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const { clearDataCache } = useDataCache();

  // Fetch all published properties (for general viewing)
  const fetchProperties = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_published', true)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(100); // Limit to prevent memory issues

      if (error) {
        throw error;
      }

      // Validate data size to prevent memory issues
      const dataSize = JSON.stringify(data).length;
      const MAX_DATA_SIZE = 5 * 1024 * 1024; // 5MB limit

      if (dataSize > MAX_DATA_SIZE) {
        console.warn('Properties data size too large, truncating...');
        data.splice(50); // Keep only first 50 items
      }

      // التأكد من أن listing_type يتوافق مع الأنواع المتوقعة
      const validatedData = (data || []).map((item) => toProperty(item as RawProperty));

      // فلترة العقارات لإخفاء المباعة والمؤجرة من العرض العام
      const filteredData = validatedData.filter(property => {
        // إذا لم يكن هناك حقل status، نعتبر العقار متاح
        if (!property.status) {
          return true;
        }
        // إخفاء العقارات المباعة والمؤجرة من الصفحة الرئيسية
        return property.status !== 'sold' && property.status !== 'rented';
      });

      setProperties(filteredData);
    } catch (error: unknown) {
      console.error('Error fetching properties:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      toast({
        title: "خطأ في تحميل العقارات",
        description: errorMessage,
        variant: "destructive",
      });
      // Set empty array on error to prevent crashes
      setProperties([]);
    }
  }, [toast]);

  // Fetch all properties (for admin dashboard)
  const fetchAllProperties = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500); // Higher limit for admin but still controlled

      if (error) {
        throw error;
      }

      // Validate data size to prevent memory issues
      const dataSize = JSON.stringify(data).length;
      const MAX_DATA_SIZE = 20 * 1024 * 1024; // 20MB limit for admin data

      if (dataSize > MAX_DATA_SIZE) {
        console.warn('All properties data size too large, truncating...');
        data.splice(250); // Keep only first 250 items
      }

      return data || [];
    } catch (error: unknown) {
      console.error('Error fetching all properties:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      toast({
        title: "خطأ في تحميل جميع العقارات",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    }
  }, [isAdmin, toast]);

  // Fetch user's own properties (for management)
  const fetchUserProperties = useCallback(async () => {
    if (!user) return;

    try {
      // Always get only the current user's properties, regardless of admin status
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200); // Higher limit for user dashboard but still controlled

      if (error) {
        throw error;
      }

      // Validate data size to prevent memory issues
      const dataSize = JSON.stringify(data).length;
      const MAX_DATA_SIZE = 10 * 1024 * 1024; // 10MB limit for user data

      if (dataSize > MAX_DATA_SIZE) {
        console.warn('User properties data size too large, truncating...');
        data.splice(100); // Keep only first 100 items
      }

      // التأكد من أن listing_type يتوافق مع الأنواع المتوقعة
      const validatedData = (data || []).map((item) => toProperty(item as RawProperty));

      setUserProperties(validatedData);
    } catch (error: unknown) {
      const postgrestError = error as PostgrestError;
      console.error('Error fetching user properties:', error);
      toast({
        title: "خطأ في تحميل عقاراتك",
        description: postgrestError.message,
        variant: "destructive",
      });
      // Set empty array on error to prevent crashes
      setUserProperties([]);
    }
  }, [user, toast]);

  // Toggle property publication status
  const togglePropertyPublication = async (propertyId: string, currentStatus: boolean) => {
    try {
      const newPublished = !currentStatus;
      const newHidden = currentStatus; // إذا ألغينا النشر نخفي العقار
      const { error } = await supabase
        .from('properties')
        .update({ is_published: newPublished, is_hidden: newHidden })
        .eq('id', propertyId);

      if (error) {
        throw error;
      }

      toast({
        title: currentStatus ? "تم إلغاء نشر العقار" : "تم نشر العقار",
        description: currentStatus ? "العقار غير مرئي الآن" : "العقار مرئي الآن للجميع",
      });

      // Clear cache and refresh both lists
      clearDataCache('properties');
      clearDataCache('user-properties');
      await Promise.all([fetchProperties(), fetchUserProperties()]);
    } catch (error: unknown) {
      const postgrestError = error as PostgrestError;
      console.error('Error toggling property publication:', error);
      toast({
        title: "خطأ في تعديل العقار",
        description: postgrestError.message,
        variant: "destructive",
      });
    }
  };

  // Update property
  const updateProperty = async (propertyId: string, updates: Partial<Property>) => {
    try {
      // التحقق من ملكية العقار
      const { data: property, error: fetchError } = await supabase
        .from('properties')
        .select('user_id')
        .eq('id', propertyId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // التحقق من الصلاحيات
      if (!isAdmin && property.user_id !== user?.id) {
        toast({
          title: "غير مسموح",
          description: "لا تملك صلاحية تعديل هذا العقار",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', propertyId);

      if (error) {
        throw error;
      }

      toast({
        title: "تم تحديث العقار بنجاح",
        description: "تم حفظ جميع التغييرات",
      });

      // Clear cache and refresh lists
      clearDataCache('properties');
      clearDataCache('user-properties');
      await Promise.all([fetchProperties(), fetchUserProperties()]);
    } catch (error: unknown) {
      const postgrestError = error as PostgrestError;
      console.error('Error updating property:', error);
      toast({
        title: "خطأ في تحديث العقار",
        description: postgrestError.message,
        variant: "destructive",
      });
    }
  };

  // Delete property (admin only)
  const deleteProperty = async (propertyId: string) => {
    try {
      // التحقق من ملكية العقار
      const { data: property, error: fetchError } = await supabase
        .from('properties')
        .select('user_id')
        .eq('id', propertyId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // التحقق من الصلاحيات
      if (!isAdmin && property.user_id !== user?.id) {
        toast({
          title: "غير مسموح",
          description: "لا تملك صلاحية حذف هذا العقار",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) {
        throw error;
      }

      toast({
        title: "تم حذف العقار",
        description: "تم حذف العقار بنجاح",
      });

      // Clear cache and refresh lists
      clearDataCache('properties');
      clearDataCache('user-properties');
      await Promise.all([fetchProperties(), fetchUserProperties()]);
    } catch (error: unknown) {
      const postgrestError = error as PostgrestError;
      console.error('Error deleting property:', error);
      toast({
        title: "خطأ في حذف العقار",
        description: postgrestError.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([fetchProperties(), fetchUserProperties()]);
      } catch (error) {
        console.error('Error loading properties:', error);
        toast({
          title: "خطأ في تحميل العقارات",
          description: "حدث خطأ أثناء تحميل العقارات. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, isAdmin, fetchProperties, fetchUserProperties, toast]);

  // Fetch all published properties without filtering (for management pages)
  const fetchAllPublishedProperties = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_published', true)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(300); // Controlled limit for management pages

      if (error) {
        throw error;
      }

      // Validate data size to prevent memory issues
      const dataSize = JSON.stringify(data).length;
      const MAX_DATA_SIZE = 15 * 1024 * 1024; // 15MB limit for published properties

      if (dataSize > MAX_DATA_SIZE) {
        console.warn('Published properties data size too large, truncating...');
        data.splice(150); // Keep only first 150 items
      }

      // التأكد من أن listing_type يتوافق مع الأنواع المتوقعة - بدون فلترة للحالة
      const validatedData = (data || []).map((item) => toProperty(item as RawProperty));

      return validatedData;
    } catch (error: unknown) {
      console.error('Error fetching all published properties:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      throw new Error(errorMessage);
    }
  }, []);

  return {
    properties,
    userProperties,
    isLoading,
    fetchProperties,
    fetchAllProperties,
    fetchAllPublishedProperties,
    fetchUserProperties,
    togglePropertyPublication,
    updateProperty,
    deleteProperty,
  };
};