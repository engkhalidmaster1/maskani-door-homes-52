import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/Layout/AppLayout";
import { AuthLayout } from "@/components/Layout/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Home } from "@/pages/Home";
import { Properties } from "@/pages/Properties";
import { AddProperty } from "@/pages/AddProperty";
import { Profile } from "@/pages/Profile";
import Dashboard from "@/pages/Dashboard";
import { EditProperty } from "@/pages/EditProperty";
import { PropertyDetails } from "@/pages/PropertyDetails";
import { Login } from "@/pages/Auth/Login";
import { Register } from "@/pages/Auth/Register";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="register" element={user ? <Navigate to="/" replace /> : <Register />} />
      </Route>

      {/* Public Routes */}
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="properties" element={<Properties />} />
        <Route path="property/:id" element={<PropertyDetails />} />
        
        {/* Protected Routes */}
        <Route path="add-property" element={
          <ProtectedRoute>
            <AddProperty />
          </ProtectedRoute>
        } />
        <Route path="profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="edit-property/:id" element={
          <ProtectedRoute>
            <EditProperty />
          </ProtectedRoute>
        } />
        
        {/* Dashboard Routes - All require admin */}
        <Route path="dashboard" element={
          <ProtectedRoute requireAdmin>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="dashboard/*" element={
          <ProtectedRoute requireAdmin>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Route>

      {/* Redirect to login if not authenticated */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <TooltipProvider>
            <AppRoutes />
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
