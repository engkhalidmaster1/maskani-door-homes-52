// بطاقة مستخدم موحدة للعرض في الشبكة
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RoleBadge, PropertyLimitBadge, UserStatusBadge } from "./RoleBadge";
import { 
  Eye, 
  Edit3, 
  Trash2, 
  Ban, 
  Unlock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Home
} from "lucide-react";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

type UserRole = 'admin' | 'office' | 'agent' | 'publisher';

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  role: UserRole;
  created_at: string;
  properties_count: number;
  properties_limit: number;
  images_limit?: number;
  can_publish?: boolean;
  is_active?: boolean;
  is_verified?: boolean;
  last_sign_in_at?: string | null;
}

interface UserCardProps {
  user: UserData;
  onView?: (user: UserData) => void;
  onEdit?: (user: UserData) => void;
  onDelete?: (user: UserData) => void;
  onBanToggle?: (user: UserData) => void;
  showActions?: boolean;
}

export function UserCard({ 
  user, 
  onView, 
  onEdit, 
  onDelete, 
  onBanToggle,
  showActions = true 
}: UserCardProps) {
  const initials = user.full_name 
    ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : user.email.substring(0, 2).toUpperCase();

  const isBanned = user.can_publish === false || user.is_active === false;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2">
      <CardContent className="p-6">
        {/* Header with Avatar and Role */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-lg">{user.full_name || 'غير محدد'}</h3>
              <div className="mt-1">
                <RoleBadge role={user.role} variant="compact" />
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          <UserStatusBadge 
            isActive={user.is_active ?? true}
            canPublish={user.can_publish ?? true}
            isVerified={user.is_verified ?? false}
          />
        </div>

        {/* User Info */}
        <div className="space-y-2 mb-4 text-sm">
          {user.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span className="truncate">{user.email}</span>
            </div>
          )}
          {user.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span dir="ltr">{user.phone}</span>
            </div>
          )}
          {user.address && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{user.address}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(user.created_at), 'dd MMM yyyy', { locale: ar })}</span>
          </div>
        </div>

        {/* Properties Limit */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
          <Home className="w-4 h-4 text-muted-foreground" />
          <PropertyLimitBadge 
            current={user.properties_count} 
            limit={user.properties_limit}
            imagesLimit={user.images_limit}
            role={user.role}
          />
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 flex-wrap">
            {onView && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onView(user)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 ml-1" />
                عرض
              </Button>
            )}
            {onEdit && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onEdit(user)}
                className="flex-1"
              >
                <Edit3 className="w-4 h-4 ml-1" />
                تعديل
              </Button>
            )}
            {onBanToggle && (
              <Button 
                size="sm" 
                variant={isBanned ? "default" : "destructive"}
                onClick={() => onBanToggle(user)}
              >
                {isBanned ? (
                  <><Unlock className="w-4 h-4 ml-1" /> إلغاء الحظر</>
                ) : (
                  <><Ban className="w-4 h-4 ml-1" /> حظر</>
                )}
              </Button>
            )}
            {onDelete && !isBanned && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => onDelete(user)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Last Sign In */}
        {user.last_sign_in_at && (
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground text-center">
            آخر دخول: {format(new Date(user.last_sign_in_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
