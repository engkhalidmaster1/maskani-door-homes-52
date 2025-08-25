import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Building, PlusCircle, User, Menu, X } from "lucide-react";

interface HeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onSidebarToggle: () => void;
}

export const Header = ({ currentPage, onPageChange, onSidebarToggle }: HeaderProps) => {
  const navItems = [
    { id: "home", label: "الرئيسية", icon: Home },
    { id: "properties", label: "العقارات", icon: Building },
    { id: "add-property", label: "إضافة عقار", icon: PlusCircle },
    { id: "profile", label: "الملف الشخصي", icon: User },
  ];

  return (
    <header className="gradient-primary text-primary-foreground shadow-elegant sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-primary-foreground hover:bg-white/20"
            onClick={onSidebarToggle}
          >
            <Menu className="h-6 w-6" />
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-accent text-accent-foreground p-2 rounded-xl">
              <Home className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">سكني</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`text-primary-foreground hover:bg-white/20 gap-2 ${
                    currentPage === item.id ? "bg-white/25" : ""
                  }`}
                  onClick={() => onPageChange(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Login Button */}
          <Button
            variant="accent"
            onClick={() => onPageChange("login")}
            className="gap-2"
          >
            <User className="h-4 w-4" />
            تسجيل الدخول
          </Button>
        </div>
      </div>
    </header>
  );
};