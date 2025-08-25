import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Footer } from "@/components/Layout/Footer";
import { Home } from "@/pages/Home";
import { Properties } from "@/pages/Properties";
import { AddProperty } from "@/pages/AddProperty";
import { Profile } from "@/pages/Profile";
import { Login } from "@/pages/Auth/Login";
import { Register } from "@/pages/Auth/Register";

const queryClient = new QueryClient();

const App = () => {
  const [currentPage, setCurrentPage] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <Home onPageChange={setCurrentPage} />;
      case "properties":
        return <Properties />;
      case "add-property":
        return <AddProperty onPageChange={setCurrentPage} />;
      case "profile":
        return <Profile />;
      case "login":
        return <Login onPageChange={setCurrentPage} />;
      case "register":
        return <Register onPageChange={setCurrentPage} />;
      default:
        return <Home onPageChange={setCurrentPage} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
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
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
