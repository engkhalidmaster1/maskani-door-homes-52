import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from "@/components/Layout/AppLayout";
import { OfflineStatusIndicator } from "@/components/OfflineStatusIndicator";
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Home } from "@/pages/Home";
import { PropertiesOffline } from "@/pages/PropertiesOffline";
import { Dashboard } from "@/pages/Dashboard";
import { AddProperty } from "@/pages/AddProperty";
import { EditProperty } from "@/pages/EditProperty";
import { PropertiesManagement } from "@/pages/PropertiesManagement";
import { Profile } from "@/pages/Profile";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Favorites } from "@/pages/Favorites";
import { ImageDiagnostics } from "@/pages/ImageDiagnostics";
import { TestImages } from "@/pages/TestImages";
import { Login } from "@/pages/Auth/Login";
import { Register } from "@/pages/Auth/Register";
import { MapPage } from "@/pages/MapPage";
import { EditOffice } from "@/pages/EditOffice";
import { useEffect } from "react";

const queryClient = new QueryClient();

// مكون شرطي لإظهار مؤشر المزامنة فقط عند الحاجة
function ConditionalOfflineStatusIndicator() {
  const { isOnline, pendingActions } = useOfflineSync();
  
  // إظهار المكون فقط في حالات معينة:
  // 1. عدم وجود اتصال
  // 2. وجود عمليات معلقة
  const shouldShow = !isOnline || pendingActions.length > 0;
  
  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <OfflineStatusIndicator />
    </div>
  );
}

function App() {
  // تسجيل Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          {/* مؤشر حالة الاتصال - يظهر عند الحاجة فقط */}
          <ConditionalOfflineStatusIndicator />
          
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/properties" element={<PropertiesOffline />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/add-property" element={<ProtectedRoute><AddProperty /></ProtectedRoute>} />
              <Route path="/edit-property/:id" element={<ProtectedRoute><EditProperty /></ProtectedRoute>} />
              <Route path="/properties-management" element={<ProtectedRoute><PropertiesManagement /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/edit-office/:id" element={<ProtectedRoute><EditOffice /></ProtectedRoute>} />
              <Route path="/image-diagnostics" element={<ProtectedRoute><ImageDiagnostics /></ProtectedRoute>} />
              <Route path="/test-images" element={<ProtectedRoute><TestImages /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
