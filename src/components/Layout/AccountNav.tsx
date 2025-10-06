import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Settings, LogOut, UserCircle, Menu } from "lucide-react";

export function AccountNav() {
  const { user, signOut } = useAuth();
  const { profileData } = useProfile();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative flex items-center gap-3 px-4 py-2 hover:bg-white/20 text-primary-foreground group"
        >
          <Menu className="h-6 w-6" />
          <span className="text-base font-medium">القائمة</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
        <DropdownMenuGroup className="space-y-1">
          <DropdownMenuItem className="p-3 cursor-pointer hover:bg-accent rounded-lg transition-colors">
            <UserCircle className="ml-3 h-5 w-5 text-primary" />
            <span className="font-medium">الملف الشخصي</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="p-3 cursor-pointer hover:bg-accent rounded-lg transition-colors">
            <Settings className="ml-3 h-5 w-5 text-primary" />
            <span className="font-medium">الإعدادات</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem 
          onClick={signOut}
          className="p-3 cursor-pointer hover:bg-destructive hover:text-destructive-foreground rounded-lg transition-colors"
        >
          <LogOut className="ml-3 h-5 w-5" />
          <span className="font-medium">تسجيل الخروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
