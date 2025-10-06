import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type FavoriteRow = Database["public"]["Tables"]["favorites"]["Row"];
type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

type FavoriteWithProperty = FavoriteRow & {
  properties: PropertyRow | null;
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [favoriteProperties, setFavoriteProperties] = useState<PropertyRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's favorites
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setFavoriteProperties([]);
      setIsLoading(false);
      return;
    }

    try {
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
            amenities
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const favoritesData = (data as FavoriteWithProperty[] | null) ?? [];
      setFavorites(favoritesData.map(({ properties: _properties, ...fav }) => fav));

      const properties = favoritesData
        .map((fav) => fav.properties)
        .filter((prop): prop is PropertyRow => Boolean(prop && prop.is_published));

      setFavoriteProperties(properties);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast({
        title: "خطأ في تحميل المفضلة",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user]);

  // Check if property is in favorites
  const isFavorite = useCallback(
    (propertyId: string): boolean => favorites.some((fav) => fav.property_id === propertyId),
    [favorites]
  );

  // Add to favorites
  const addToFavorites = useCallback(async (propertyId: string) => {
    if (!user) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول لحفظ العقارات في المفضلة",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          property_id: propertyId,
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "موجود مسبقاً",
            description: "هذا العقار موجود في مفضلتك بالفعل",
            variant: "default",
          });
          return false;
        }
        throw error;
      }

      toast({
        title: "تم الحفظ ✨",
        description: "تم إضافة العقار إلى مفضلتك بنجاح",
      });

      // Refresh favorites
      await fetchFavorites();
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast({
        title: "خطأ في الحفظ",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      return false;
    }
  }, [fetchFavorites, toast, user]);

  // Remove from favorites
  const removeFromFavorites = useCallback(async (propertyId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', propertyId);

      if (error) {
        throw error;
      }

      toast({
        title: "تم الإزالة",
        description: "تم إزالة العقار من مفضلتك",
      });

      // Refresh favorites
      await fetchFavorites();
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast({
        title: "خطأ في الإزالة",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      return false;
    }
  }, [fetchFavorites, toast, user]);

  // Toggle favorite status
  const toggleFavorite = useCallback(
    async (propertyId: string) => {
      const isCurrentlyFavorite = isFavorite(propertyId);

      if (isCurrentlyFavorite) {
        return await removeFromFavorites(propertyId);
      }

      return await addToFavorites(propertyId);
    },
    [addToFavorites, isFavorite, removeFromFavorites]
  );

  // Get favorites count
  const getFavoritesCount = (): number => {
    return favorites.length;
  };

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    favorites,
    favoriteProperties,
    isLoading,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    getFavoritesCount,
    fetchFavorites,
  };
};

