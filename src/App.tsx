import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from "@/components/Layout/AppLayout";
import { OfflineStatusIndicator } from "@/components/OfflineStatusIndicator";
import { useOfflineSync } from '@/hooks/useOfflineSync';
// Lazy-loaded pages/components
const Home = lazy(() => import("@/pages/Home").then(m => ({ default: m.Home })));
const DashboardPage = lazy(() => import("@/pages/Dashboard"));
const Offices = lazy(() => import("@/pages/Offices"));
const AddProperty = lazy(() => import("@/pages/AddProperty").then(m => ({ default: m.AddProperty })));
const EditProperty = lazy(() => import("@/pages/EditProperty").then(m => ({ default: m.EditProperty })));
const PropertiesManagement = lazy(() => import("@/pages/PropertiesManagement").then(m => ({ default: m.PropertiesManagement })));
const Profile = lazy(() => import("@/pages/Profile").then(m => ({ default: m.Profile })));
import ErrorBoundary from "@/components/ErrorBoundary";
import SettingsProvider from '@/context/SettingsContext';
import { AuthProviderWithBoundary } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
const Favorites = lazy(() => import("@/pages/Favorites").then(m => ({ default: m.Favorites })));
const ImageDiagnostics = lazy(() => import("@/pages/ImageDiagnostics").then(m => ({ default: m.ImageDiagnostics })));
const Login = lazy(() => import("@/pages/Auth/Login").then(m => ({ default: m.Login })));
const Register = lazy(() => import("@/pages/Auth/Register").then(m => ({ default: m.Register })));
const MapPage = lazy(() => import("@/pages/MapPage").then(m => ({ default: m.MapPage })));
const EditOffice = lazy(() => import("@/pages/EditOffice").then(m => ({ default: m.EditOffice })));
const PropertyDetails = lazy(() => import("@/pages/PropertyDetails").then(m => ({ default: m.PropertyDetails })));
const UsersView = lazy(() => import("@/pages/UsersView"));
const AdminDebug = lazy(() => import("@/pages/AdminDebug").then(m => ({ default: m.AdminDebug })));
const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
const AdminAddUser = lazy(() => import("@/pages/AdminAddUser"));
const SystemDocumentation = lazy(() => import("@/pages/SystemDocumentation"));
const SettingsTab = lazy(() => import("@/components/Dashboard/SettingsTab").then(m => ({ default: m.SettingsTab })));
// import { SmartSearchPage } from "@/pages/SmartSearchPage"; // مخفي مؤقتاً  
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
  // Service Worker تم تعطيله مؤقتاً لحل مشكلة الشاشة البيضاء

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
        <AuthProviderWithBoundary>
          <Router>
            {/* مؤشر حالة الاتصال - يظهر عند الحاجة فقط */}
            <ConditionalOfflineStatusIndicator />
            
            <Suspense fallback={<div className="p-6">جاري تحميل الصفحة...</div>}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/properties" element={<PropertiesManagement />} />
                <Route path="/offices" element={<Offices />} />
                <Route path="/map" element={<MapPage />} />
                {/* <Route path="/smart-search" element={<SmartSearchPage />} /> */} {/* مخفي مؤقتاً */}
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                {/* Dashboard: redirect bare /dashboard to a default tab and allow tab-specific routes */}
                <Route path="/dashboard" element={<Navigate to="/dashboard/overview" replace />} />
                <Route path="/dashboard/:tab" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                {/* Removed legacy /admin/settings mapping - RBAC and sidebar now point to /dashboard/settings */}
                <Route path="/add-property" element={<ProtectedRoute><AddProperty /></ProtectedRoute>} />
                <Route path="/edit-property/:id" element={<ProtectedRoute><EditProperty /></ProtectedRoute>} />
                <Route path="/properties-management" element={<ProtectedRoute><PropertiesManagement /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/edit-office/:id" element={<ProtectedRoute><EditOffice /></ProtectedRoute>} />
                <Route path="/image-diagnostics" element={<ProtectedRoute><ImageDiagnostics /></ProtectedRoute>} />
                <Route path="/admin/debug" element={<ProtectedRoute><AdminDebug /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
                <Route path="/admin/add-user" element={<ProtectedRoute><AdminAddUser /></ProtectedRoute>} />
                
                <Route path="/system-documentation" element={<ProtectedRoute><SystemDocumentation /></ProtectedRoute>} />
                <Route path="/users-view" element={<ProtectedRoute><UsersView /></ProtectedRoute>} />
                <Route path="/property/:id" element={<PropertyDetails />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
            </Suspense>
            </Router>
            <Toaster />
        </AuthProviderWithBoundary>
        </SettingsProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
