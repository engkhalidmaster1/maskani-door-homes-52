import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { MobileHeader } from "./MobileHeader";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <Header
        onSidebarToggle={() => setSidebarOpen(true)}
      />
      
      {/* Mobile Header */}
      <MobileHeader
        onSidebarToggle={() => setSidebarOpen(true)}
      />
      
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <main className="min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
};
