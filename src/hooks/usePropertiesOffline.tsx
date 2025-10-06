import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useLocalData } from "@/hooks/useLocalData";
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
  created_at: string;
  updated_at: string;
  ownership_type?: "ملك صرف" | "سر قفلية" | null;
  market?: MarketValue | null;
  marketLabel?: string | null;
}

type RawProperty = Record<string, unknown>;

const transformProperty = (property: RawProperty | Property, fallback?: Property): Property => {
  const raw = property as RawProperty;

  const listingRaw = raw["listing_type"];
  const listingType: "sale" | "rent" =
    listingRaw === "sale" || listingRaw === "rent" ? (listingRaw as "sale" | "rent") : "sale";

  const marketSource =
    (raw["market"] as string | null | undefined) ??
    (raw["market_name"] as string | null | undefined) ??
    (raw["market_label"] as string | null | undefined) ??
    (raw["market_slug"] as string | null | undefined) ??
    (raw["location"] as string | null | undefined) ??
    fallback?.market ??
    null;

  const resolvedMarket = resolveMarketValue(marketSource);

  return {
    ...(property as Property),
    listing_type: listingType,
    market: resolvedMarket ?? fallback?.market ?? null,
    marketLabel: resolvedMarket ? getMarketLabel(resolvedMarket) : fallback?.marketLabel ?? null,
  };
};

export const usePropertiesOffline = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline, addOfflineAction } = useOfflineSync();
  
  // استخدام التخزين المحلي للعقارات
  const {
    localData: localProperties,
    addLocalData,
    updateLocalData,
    deleteLocalData,
    getUnsyncedData,
  } = useLocalData<Property>('properties');

  // دمج البيانات المحلية مع البيانات المخزنة مؤقتاً
  const getAllProperties = useCallback(() => {
    const allProps = [...properties, ...localProperties];
    // إزالة المكررات بناءً على ID
    const uniqueProps = allProps.filter((prop, index, self) => 
      index === self.findIndex(p => p.id === prop.id)
    );
    return uniqueProps;
  }, [properties, localProperties]);

  // جلب العقارات من الخادم
  const fetchProperties = useCallback(async () => {
    if (!isOnline) {
      setProperties([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const validatedData: Property[] = data.map((property) => transformProperty(property));

      setProperties(validatedData);
    } catch (error: unknown) {
      console.error('Error fetching properties:', error);
      toast({
        title: "خطأ في جلب العقارات",
        description: "تعذر جلب قائمة العقارات من الخادم",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, toast]);

  // جلب عقارات المستخدم
  const fetchUserProperties = useCallback(async () => {
    if (!user || !isOnline) {
      setUserProperties([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const validatedData: Property[] = data.map((property) => transformProperty(property));

      setUserProperties(validatedData);
    } catch (error: unknown) {
      console.error('Error fetching user properties:', error);
      toast({
        title: "خطأ في جلب عقاراتك",
        description: "تعذر جلب قائمة عقاراتك",
        variant: "destructive",
      });
    }
  }, [user, isOnline, toast]);

  // إضافة عقار جديد
  const addProperty = useCallback(async (propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول لإضافة عقار",
        variant: "destructive",
      });
      return false;
    }

    const newProperty: Property = transformProperty({
      ...propertyData,
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } satisfies RawProperty);

    try {
      if (isOnline) {
        // محاولة الإضافة مباشرة
        const { data, error } = await supabase
          .from('properties')
          .insert([{
            ...propertyData,
            user_id: user.id,
          }])
          .select()
          .single();

        if (error) throw error;

        const validatedProperty = transformProperty(data, newProperty);

        setUserProperties(prev => [validatedProperty, ...prev]);
        toast({
          title: "تم إضافة العقار",
          description: "تم إضافة العقار بنجاح",
        });
        return true;
      } else {
        // حفظ محلياً وإضافة للقائمة المعلقة
        await addLocalData(newProperty);
        addOfflineAction({
          type: 'CREATE',
          endpoint: '/api/properties',
          data: { ...propertyData, user_id: user.id },
        });

        toast({
          title: "تم حفظ العقار محلياً",
          description: "سيتم رفعه عند عودة الاتصال",
        });
        return true;
      }
    } catch (error: unknown) {
      console.error('Error adding property:', error);
      
      // في حالة الفشل، حفظ محلياً
      if (isOnline) {
        await addLocalData(newProperty);
        addOfflineAction({
          type: 'CREATE',
          endpoint: '/api/properties',
          data: { ...propertyData, user_id: user.id },
        });

        toast({
          title: "تم حفظ العقار محلياً",
          description: "فشل الرفع، سيتم المحاولة لاحقاً",
          variant: "destructive",
        });
      }
      return false;
    }
  }, [user, isOnline, addLocalData, addOfflineAction, toast]);

  // تحديث عقار
  const updateProperty = useCallback(async (id: string, updates: Partial<Property>) => {
    if (!user) return false;

    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('properties')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        const validatedProperty = transformProperty(data);

        setUserProperties(prev => 
          prev.map(prop => prop.id === id ? validatedProperty : prop)
        );
        
        toast({
          title: "تم تحديث العقار",
          description: "تم تحديث العقار بنجاح",
        });
        return true;
      } else {
        // تحديث محلياً
        await updateLocalData(id, {
          ...updates,
          updated_at: new Date().toISOString(),
        });

        addOfflineAction({
          type: 'UPDATE',
          endpoint: `/api/properties/${id}`,
          data: updates,
        });

        toast({
          title: "تم حفظ التحديث محلياً",
          description: "سيتم مزامنته عند عودة الاتصال",
        });
        return true;
      }
    } catch (error: unknown) {
      console.error('Error updating property:', error);
      
      // في حالة الفشل، حفظ محلياً
      if (isOnline) {
        await updateLocalData(id, {
          ...updates,
          updated_at: new Date().toISOString(),
        });

        addOfflineAction({
          type: 'UPDATE',
          endpoint: `/api/properties/${id}`,
          data: updates,
        });

        toast({
          title: "تم حفظ التحديث محلياً",
          description: "فشل التحديث، سيتم المحاولة لاحقاً",
          variant: "destructive",
        });
      }
      return false;
    }
  }, [user, isOnline, updateLocalData, addOfflineAction, toast]);

  // حذف عقار
  const deleteProperty = useCallback(async (id: string) => {
    if (!user) return false;

    try {
      if (isOnline) {
        const { error } = await supabase
          .from('properties')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        setUserProperties(prev => prev.filter(prop => prop.id !== id));
        toast({
          title: "تم حذف العقار",
          description: "تم حذف العقار بنجاح",
        });
        return true;
      } else {
        // حذف محلياً
        await deleteLocalData(id);
        addOfflineAction({
          type: 'DELETE',
          endpoint: `/api/properties/${id}`,
          data: { id },
        });

        toast({
          title: "تم حذف العقار محلياً",
          description: "سيتم مزامنة الحذف عند عودة الاتصال",
        });
        return true;
      }
    } catch (error: unknown) {
      console.error('Error deleting property:', error);
      
      // في حالة الفشل، حذف محلياً
      if (isOnline) {
        await deleteLocalData(id);
        addOfflineAction({
          type: 'DELETE',
          endpoint: `/api/properties/${id}`,
          data: { id },
        });

        toast({
          title: "تم حذف العقار محلياً",
          description: "فشل الحذف، سيتم المحاولة لاحقاً",
          variant: "destructive",
        });
      }
      return false;
    }
  }, [user, isOnline, deleteLocalData, addOfflineAction, toast]);

  // مزامنة البيانات غير المتزامنة
  const syncUnsyncedData = useCallback(async () => {
    if (!isOnline || !user) return;

    try {
      const unsyncedProperties = await getUnsyncedData();
      
      for (const property of unsyncedProperties) {
        if (property.id.startsWith('temp_')) {
          // عقار جديد يحتاج للرفع
          const { data, error } = await supabase
            .from('properties')
            .insert([{
              ...property,
              id: undefined, // إزالة ID المؤقت
              user_id: user.id,
            }])
            .select()
            .single();

          if (!error) {
            await deleteLocalData(property.id);
            setUserProperties(prev => [transformProperty(data), ...prev.filter(p => p.id !== property.id)]);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing unsynced data:', error);
    }
  }, [isOnline, user, getUnsyncedData, deleteLocalData]);

  // تحديث البيانات عند تغيير حالة الاتصال
  useEffect(() => {
    if (isOnline) {
      fetchProperties();
      fetchUserProperties();
      syncUnsyncedData();
    }
  }, [isOnline, fetchProperties, fetchUserProperties, syncUnsyncedData]);

  // تحديث أولي
  useEffect(() => {
    fetchProperties();
    if (user) {
      fetchUserProperties();
    }
  }, [fetchProperties, fetchUserProperties, user]);

  return {
    properties: getAllProperties(),
    userProperties: [...userProperties, ...localProperties.filter(p => p.user_id === user?.id)],
    isLoading,
    isOnline,
    addProperty,
    updateProperty,
    deleteProperty,
    fetchProperties,
    fetchUserProperties,
    syncUnsyncedData,
  };
};
