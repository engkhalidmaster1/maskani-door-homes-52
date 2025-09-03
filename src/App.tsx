import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from "@/components/Layout/AppLayout";
import { Home } from "@/pages/Home";
import { Properties } from "@/pages/Properties";
import PropertyDetails from "@/pages/PropertyDetails";
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

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/property/:id" element={<PropertyDetails />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-property"
                element={
                  <ProtectedRoute>
                    <AddProperty />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-property/:id"
                element={
                  <ProtectedRoute>
                    <EditProperty />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/properties-management"
                element={
                  <ProtectedRoute>
                    <PropertiesManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/image-diagnostics" element={<ImageDiagnostics />} />
              <Route path="/test-images" element={<TestImages />} />
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
