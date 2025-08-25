import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Property {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  property_type: string;
  listing_type: string;
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
}

export const useProperties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  // Fetch all published properties (for general viewing)
  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProperties(data || []);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      toast({
        title: "خطأ في تحميل العقارات",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Fetch user's own properties (for management)
  const fetchUserProperties = async () => {
    if (!user) return;

    try {
      let query = supabase.from('properties').select('*');
      
      // If admin, get all properties, otherwise get only user's properties
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUserProperties(data || []);
    } catch (error: any) {
      console.error('Error fetching user properties:', error);
      toast({
        title: "خطأ في تحميل عقاراتك",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Toggle property publication status
  const togglePropertyPublication = async (propertyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_published: !currentStatus })
        .eq('id', propertyId);

      if (error) {
        throw error;
      }

      toast({
        title: currentStatus ? "تم إلغاء نشر العقار" : "تم نشر العقار",
        description: currentStatus ? "العقار غير مرئي الآن" : "العقار مرئي الآن للجميع",
      });

      // Refresh both lists
      await Promise.all([fetchProperties(), fetchUserProperties()]);
    } catch (error: any) {
      console.error('Error toggling property publication:', error);
      toast({
        title: "خطأ في تعديل العقار",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Update property
  const updateProperty = async (propertyId: string, updates: Partial<Property>) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', propertyId);

      if (error) {
        throw error;
      }

      toast({
        title: "تم تحديث العقار بنجاح",
        description: "تم حفظ التغييرات",
      });

      // Refresh both lists
      await Promise.all([fetchProperties(), fetchUserProperties()]);
    } catch (error: any) {
      console.error('Error updating property:', error);
      toast({
        title: "خطأ في تحديث العقار",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Delete property (admin only)
  const deleteProperty = async (propertyId: string) => {
    if (!isAdmin) {
      toast({
        title: "غير مسموح",
        description: "لا تملك صلاحية حذف العقارات",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) {
        throw error;
      }

      toast({
        title: "تم حذف العقار",
        description: "تم حذف العقار نهائياً",
      });

      // Refresh both lists
      await Promise.all([fetchProperties(), fetchUserProperties()]);
    } catch (error: any) {
      console.error('Error deleting property:', error);
      toast({
        title: "خطأ في حذف العقار",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchProperties(), fetchUserProperties()]);
      setIsLoading(false);
    };

    loadData();
  }, [user, isAdmin]);

  return {
    properties,
    userProperties,
    isLoading,
    fetchProperties,
    fetchUserProperties,
    togglePropertyPublication,
    updateProperty,
    deleteProperty,
  };
};