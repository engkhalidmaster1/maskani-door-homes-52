import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type FavoriteRow = Database["public"]["Tables"]["favorites"]["Row"];
type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

type FavoriteWithProperty = FavoriteRow & {
  properties: PropertyRow | null;
};

export const useFavorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // مفتاح الكاش للبحث
  const queryKey = ["favorites", user?.id];

  // جلب المفضلة باستخدام React Query
  const { data: favoritesData = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          properties:property_id (
            id,
            title,
            price,
            location,
            property_type,
            listing_type,
            images,
            is_published,
            created_at,
            bedrooms,
            bathrooms,
            area,
            description,
            amenities,
            address,
            market,
            updated_at,
            user_id,
            latitude,
            longitude,
            property_code
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as FavoriteWithProperty[]) ?? [];
    },
    enabled: !!user, // لا تقم بالبحث إلا إذا كان المستخدم مسجلاً
    staleTime: 1000 * 60 * 5, // البيانات صالحة لمدة 5 دقائق
    gcTime: 1000 * 60 * 30, // الاحتفاظ بالكاش لمدة 30 دقيقة
  });

  // استخراج العقارات فقط
  const favoriteProperties = favoritesData
    .map((fav) => fav.properties)
    .filter((prop): prop is PropertyRow => Boolean(prop && prop.is_published));

  // التحقق مما إذا كان العقار في المفضلة
  const isFavorite = useCallback(
    (propertyId: string): boolean => {
      return favoritesData.some((fav) => fav.property_id === propertyId);
    },
    [favoritesData]
  );

  // إضافة للمفضلة
  const addMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user) throw new Error("يجب تسجيل الدخول");

      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          property_id: propertyId,
        });

      if (error) {
        if (error.code === '23505') return; // موجود مسبقاً
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "تم الحفظ ✨",
        description: "تم إضافة العقار إلى مفضلتك بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // إزالة من المفضلة
  const removeMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user) throw new Error("يجب تسجيل الدخول");

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', propertyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "تم الإزالة",
        description: "تم إزالة العقار من مفضلتك",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const toggleFavorite = async (propertyId: string) => {
    if (!user) {
      toast({
        title: "تنبيه",
        description: "يجب تسجيل الدخول لاستخدام المفضلة",
        variant: "destructive",
      });
      return false;
    }

    if (isFavorite(propertyId)) {
      await removeMutation.mutateAsync(propertyId);
    } else {
      await addMutation.mutateAsync(propertyId);
    }
    return true;
  };

  return {
    favorites: favoritesData,
    favoriteProperties,
    isLoading,
    isFavorite,
    addToFavorites: (id: string) => addMutation.mutateAsync(id),
    removeFromFavorites: (id: string) => removeMutation.mutateAsync(id),
    toggleFavorite,
    getFavoritesCount: () => favoritesData.length,
    fetchFavorites: () => queryClient.invalidateQueries({ queryKey }),
  };
};
