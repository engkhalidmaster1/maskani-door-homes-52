import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Favorite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
}

interface FavoriteProperty {
  id: string;
  title: string;
  price: number;
  location: string;
  property_type: string;
  listing_type: string;
  images: string[];
  is_published: boolean;
  created_at: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
  amenities: string[];
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoriteProperties, setFavoriteProperties] = useState<FavoriteProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's favorites
  const fetchFavorites = async () => {
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

      setFavorites(data || []);
      
      // Extract properties from favorites data
      const properties = data
        ?.map(fav => fav.properties)
        .filter(prop => prop && prop.is_published) || [];
      
      setFavoriteProperties(properties as FavoriteProperty[]);
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
      toast({
        title: "خطأ في تحميل المفضلة",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if property is in favorites
  const isFavorite = (propertyId: string): boolean => {
    return favorites.some(fav => fav.property_id === propertyId);
  };

  // Add to favorites
  const addToFavorites = async (propertyId: string) => {
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
    } catch (error: any) {
      console.error('Error adding to favorites:', error);
      toast({
        title: "خطأ في الحفظ",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Remove from favorites
  const removeFromFavorites = async (propertyId: string) => {
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
    } catch (error: any) {
      console.error('Error removing from favorites:', error);
      toast({
        title: "خطأ في الإزالة",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (propertyId: string) => {
    const isCurrentlyFavorite = isFavorite(propertyId);
    
    if (isCurrentlyFavorite) {
      return await removeFromFavorites(propertyId);
    } else {
      return await addToFavorites(propertyId);
    }
  };

  // Get favorites count
  const getFavoritesCount = (): number => {
    return favorites.length;
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

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

