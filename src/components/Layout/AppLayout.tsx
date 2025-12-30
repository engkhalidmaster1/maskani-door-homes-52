import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { useAuth } from '@/hooks/useAuth';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAdmin } = useAuth();


  return (
    <div className="min-h-screen bg-background">
      <Header
        onSidebarToggle={() => setSidebarOpen(true)}
      />
      
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <main className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
};
