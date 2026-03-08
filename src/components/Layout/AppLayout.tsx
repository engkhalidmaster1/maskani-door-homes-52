import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from "@/hooks/use-mobile";

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAdmin } = useAuth();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <Header
        onSidebarToggle={() => setSidebarOpen(true)}
      />
      
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Add bottom padding on mobile to account for bottom nav */}
      <main className={`min-h-[calc(100vh-4rem)] ${isMobile ? 'pb-20' : ''}`}>
        <Outlet />
      </main>
      
      {/* Footer only on desktop */}
      {!isMobile && <Footer />}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav onDrawerOpen={() => setSidebarOpen(true)} />
      )}
    </div>
  );
};
