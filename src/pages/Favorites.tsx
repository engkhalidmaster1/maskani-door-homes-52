import React from 'react';
import { PropertyCard } from "@/components/Property/PropertyCard";
import { Button } from "@/components/ui/button";
import { Heart, Building, ArrowRight } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const Favorites = () => {
  const { user } = useAuth();
  const { favoriteProperties, isLoading, getFavoritesCount } = useFavorites();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">تسجيل الدخول مطلوب</h2>
          <p className="text-muted-foreground mb-6">
            يجب تسجيل الدخول لعرض مفضلتك
          </p>
          <Button onClick={() => navigate('/auth/login')}>
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل مفضلتك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-3 md:gap-4 border-b-2 border-primary pb-3 md:pb-4">
              <div className="bg-primary text-primary-foreground p-2 md:p-3 rounded-lg md:rounded-xl">
                <Heart className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              المفضلة
            </h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              {getFavoritesCount()} عقار محفوظ في مفضلتك
            </p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/properties')}
            className="gap-2"
          >
            <Building className="w-4 h-4" />
            تصفح العقارات
          </Button>
        </div>

        {/* Favorites Grid */}
        {favoriteProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {favoriteProperties.map((property) => (
              <PropertyCard 
                key={property.id} 
                property={property}
                showActions={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-2xl font-semibold mb-4">لا توجد عقارات محفوظة</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              ابدأ بحفظ العقارات المفضلة لديك لتجدها هنا بسهولة
            </p>
            <div className="space-y-4">
              <Button 
                onClick={() => navigate('/properties')}
                className="gap-2"
              >
                <Building className="w-5 h-5" />
                استكشف العقارات
              </Button>
              <div>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/')}
                  className="gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  العودة للرئيسية
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

