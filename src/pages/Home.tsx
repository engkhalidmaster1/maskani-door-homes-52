import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/Property/PropertyCard";
import { ScrollingBanner } from "@/components/Layout/ScrollingBanner";
import { Search, PlusCircle, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProperties } from "@/hooks/useProperties";
import heroImage from "@/assets/hero-bg.jpg";

export const Home = () => {
  const navigate = useNavigate();
  const { properties, isLoading } = useProperties();
  
  // Get the latest 3 published properties
  const featuredProperties = properties.slice(0, 3);

  const features = [
    {
      icon: Search,
      title: "ابحث بسهولة",
      description: "ابحث عن العقارات المناسبة باستخدام فلاتر متقدمة",
    },
    {
      icon: PlusCircle,
      title: "أضف عقارك",
      description: "أضف عقارك للبيع أو الإيجار في دقائق",
    },
    {
      icon: Shield,
      title: "آمن وموثوق",
      description: "منصة آمنة للتعاملات العقارية",
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <ScrollingBanner />
        
        {/* Hero Section */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-elegant mb-16 min-h-[500px] flex items-center justify-center text-center"
          style={{
            backgroundImage: `linear-gradient(rgba(30, 41, 59, 0.85), rgba(30, 41, 59, 0.9)), url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="text-white max-w-4xl px-8">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gradient-primary">
              مرحباً بك في تطبيق "سكني"
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 leading-relaxed">
              منصة متكاملة للعثور على أفضل العقارات للبيع والإيجار في مجمع الدور
            </p>
            <Button
              variant="hero"
              onClick={() => navigate("/properties")}
              className="gap-3"
            >
              <Search className="h-5 w-5" />
              ابدأ البحث
            </Button>
          </div>
        </div>

        {/* Featured Properties */}
        <section>
          <h2 className="text-4xl font-bold mb-8 flex items-center gap-4 border-b-2 border-primary pb-4">
            <div className="bg-primary text-primary-foreground p-3 rounded-xl">
              <Search className="h-6 w-6" />
            </div>
            أحدث العقارات
          </h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">جاري تحميل العقارات...</p>
              </div>
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد عقارات متاحة</h3>
              <p className="text-muted-foreground mb-6">
                كن أول من يضيف عقاراً في مجمع الدور
              </p>
              <Button 
                onClick={() => navigate('/add-property')} 
                className="gap-2"
              >
                <PlusCircle className="h-5 w-5" />
                إضافة عقار جديد
              </Button>
            </div>
          )}
        </section>

        {/* Features */}
        <section className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="text-center p-8 bg-card rounded-2xl shadow-card hover-lift"
                >
                  <div className="bg-primary text-primary-foreground w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-card-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};