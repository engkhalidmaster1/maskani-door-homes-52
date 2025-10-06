import { Button } from "@/components/ui/button";
import { HomePropertyCard } from "@/components/Property/HomePropertyCard";
import { ScrollingBanner } from "@/components/Layout/ScrollingBanner";
import { Search, PlusCircle, Shield, Home as HomeIcon, User, Building2, X, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export const Home = () => {
  const navigate = useNavigate();
  const { properties, isLoading } = useProperties();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // Get the latest 3 published properties
  const featuredProperties = properties.slice(0, 3);

  // Function to handle navigation with auth check
  const handleNavigation = (path: string, requiresAuth: boolean = false) => {
    if (requiresAuth && !user) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول للوصول إلى هذه الصفحة",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    navigate(path);
  };

  // Main navigation cards
  const navigationCards = [
    {
      icon: Search,
      title: "ابدأ البحث",
      description: "ابحث عن العقارات المناسبة باستخدام فلاتر متقدمة",
      path: "/properties",
      requiresAuth: false,
      bgColor: "bg-blue-50",
      iconColor: "bg-blue-500",
    },
    {
      icon: PlusCircle,
      title: "إضافة عقار جديد",
      description: "أضف عقارك للبيع أو الإيجار في دقائق",
      path: "/add-property",
      requiresAuth: true,
      bgColor: "bg-green-50",
      iconColor: "bg-green-500",
    },
    {
      icon: Building2,
      title: "العقارات المتوفرة الآن",
      description: "تصفح جميع العقارات المتاحة للبيع والإيجار",
      path: "/properties",
      requiresAuth: false,
      bgColor: "bg-purple-50",
      iconColor: "bg-purple-500",
    },
    {
      icon: User,
      title: "ملفي الشخصي",
      description: "إدارة حسابك الشخصي وإعداداتك",
      path: "/profile",
      requiresAuth: true,
      bgColor: "bg-orange-50",
      iconColor: "bg-orange-500",
    },
  ];

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
      title: "اربح معنا أكثر",
      description: "ربح سهل للدلالين و منصة امنة للبائعين",
      link: "https://api.whatsapp.com/send?phone=905013196750"
    },
  ];

  // Auto-close modal after 2 seconds
  useEffect(() => {
    if (showWelcomeModal) {
      const timer = setTimeout(() => {
        setShowWelcomeModal(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showWelcomeModal]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <ScrollingBanner />
        
        {/* Welcome Button */}
        <Button
          onClick={() => setShowWelcomeModal(true)}
          className="fixed top-20 left-4 z-50 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg rounded-full w-10 h-10 flex items-center justify-center"
        >
          <AlertCircle className="h-5 w-5" />
        </Button>

        {/* Welcome Modal */}
        {showWelcomeModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
                onClick={() => setShowWelcomeModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              
              {/* Modal Content */}
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4 text-gray-800">
                  مرحباً بك في تطبيق "سكني"
                </h1>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  منصة متكاملة للعثور على أفضل العقارات للبيع والإيجار في مجمع الدور
                </p>
                <Button
                  onClick={() => {
                    setShowWelcomeModal(false);
                    handleNavigation("/properties");
                  }}
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  ابدأ البحث
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation Cards - مثل الصورة */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {navigationCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  className={`${card.bgColor} rounded-2xl p-6 shadow-card hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100`}
                  onClick={() => handleNavigation(card.path, card.requiresAuth)}
                >
                  <div className={`${card.iconColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800">
                    {card.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {card.description}
                  </p>
                  {card.requiresAuth && !user && (
                    <div className="mt-3">
                      <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                        يتطلب تسجيل دخول
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Featured Properties */}
        <section dir="rtl">
          <h2 className="text-4xl font-bold mb-8 flex items-center gap-4 border-b-2 border-primary pb-4 text-right">
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
                <HomePropertyCard key={property.id} property={property} />
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
                onClick={() => handleNavigation('/add-property', true)} 
                className="gap-2"
              >
                <PlusCircle className="h-5 w-5" />
                إضافة عقار جديد
              </Button>
            </div>
          )}
        </section>

        {/* Feature Cards - مثل الصورة الأصلية */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold mb-8 text-center">
            مميزات المنصة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              // جعل المربع الأول (ابحث بسهولة) قابلاً للنقر
              const isSearchFeature = index === 0; // التحقق من أنه المربع الأول
              // جعل المربع الثاني (أضف عقارك) قابلاً للنقر
              const isAddFeature = index === 1; // التحقق من أنه المربع الثاني
              // جعل المربع الثالث (اربح معنا أكثر) قابلاً للنقر
              const isEarnFeature = index === 2; // التحقق من أنه المربع الثالث
              
              return (
                <div
                  key={index}
                  className={`text-center p-8 bg-card rounded-2xl shadow-card transition-all duration-300 relative
                    ${isSearchFeature || isAddFeature || isEarnFeature
                      ? 'cursor-pointer hover:shadow-xl hover:transform hover:scale-105' 
                      : 'hover-lift'}`}
                  onClick={() => {
                    if (isSearchFeature) navigate('/properties');
                    if (isAddFeature) {
                      if (user) {
                        navigate('/add-property');
                      } else {
                        navigate('/register');
                      }
                    }
                    if (isEarnFeature && feature.link) window.open(feature.link, '_blank');
                  }}
                >
                  {isAddFeature && !user && (
                    <span className="absolute top-4 right-4 text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full border border-red-300 font-medium">
                      سجل قبل إضافة العقار
                    </span>
                  )}
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