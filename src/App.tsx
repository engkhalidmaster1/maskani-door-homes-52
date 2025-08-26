import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Footer } from "@/components/Layout/Footer";
import { Home } from "@/pages/Home";
import { Properties } from "@/pages/Properties";
import { AddProperty } from "@/pages/AddProperty";
import { Profile } from "@/pages/Profile";
import Dashboard from "@/pages/Dashboard";
import { EditProperty } from "@/pages/EditProperty";
import { Login } from "@/pages/Auth/Login";
import { Register } from "@/pages/Auth/Register";

const queryClient = new QueryClient();

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const { user, isLoading } = useAuth();

  // Show loading screen while checking auth
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

  // Redirect to login if not authenticated and not on auth pages
  if (!user && !['login', 'register'].includes(currentPage)) {
    return <Login onPageChange={setCurrentPage} />;
  }

  // Redirect to home if authenticated and on auth pages
  if (user && ['login', 'register'].includes(currentPage)) {
    setCurrentPage("home");
  }

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <Home onPageChange={setCurrentPage} />;
      case "properties":
        return editingPropertyId ? (
          <EditProperty 
            propertyId={editingPropertyId}
            onBack={() => setEditingPropertyId(null)}
            onUpdate={() => {
              // Refresh properties data if needed
            }}
          />
        ) : (
          <Properties onEditProperty={setEditingPropertyId} />
        );
      case "add-property":
        return <AddProperty onPageChange={setCurrentPage} />;
      case "profile":
        return <Profile />;
      case "dashboard":
        return <Dashboard />;
      case "login":
        return <Login onPageChange={setCurrentPage} />;
      case "register":
        return <Register onPageChange={setCurrentPage} />;
      default:
        return <Home onPageChange={setCurrentPage} />;
    }
  };

  // Show auth pages without header/footer
  if (['login', 'register'].includes(currentPage)) {
    return (
      <div className="min-h-screen bg-background">
        <main>
          {renderPage()}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onSidebarToggle={() => setSidebarOpen(true)}
      />
      
      <Sidebar
        isOpen={sidebarOpen}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onClose={() => setSidebarOpen(false)}
      />
      
      <main className="min-h-[calc(100vh-4rem)]">
        {renderPage()}
      </main>
      
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
