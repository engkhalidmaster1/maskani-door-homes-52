import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  ChevronDown, 
  User, 
  Shield, 
  Building2, 
  Info,
  Crown,
  Users
} from "lucide-react";
import { useUserStatus } from "@/hooks/useUserStatus";
import { Database } from "@/integrations/supabase/types";

type UserStatus = Database["public"]["Enums"]["user_status"];

interface UserStatusControlProps {
  userId: string;
  currentStatus: UserStatus;
  userName: string;
  onStatusUpdate?: () => void;
}

export const UserStatusControl: React.FC<UserStatusControlProps> = ({
  userId,
  currentStatus,
  userName,
  onStatusUpdate
}) => {
  const { updateUserStatus, isUpdating, getStatusLabel, getStatusColor } = useUserStatus();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<UserStatus | null>(null);

  const statusOptions: { value: UserStatus; label: string; icon: React.ReactNode; description: string; limits: string }[] = [
    {
      value: 'publisher',
      label: 'ناشر',
      icon: <User className="w-4 h-4" />,
      description: 'مستخدم عادي يمكنه نشر عقار واحد فقط',
      limits: 'عقار واحد • صورتان فقط'
    },
    {
      value: 'trusted_owner',
      label: 'مالك موثوق',
      icon: <Shield className="w-4 h-4" />,
      description: 'مالك موثوق يمكنه نشر عدة عقارات',
      limits: '5 عقارات • 5 صور لكل عقار'
    },
    {
      value: 'office_agent',
      label: 'مكلف بالنشر',
      icon: <Building2 className="w-4 h-4" />,
      description: 'صاحب مكتب دلالية أو مكلف بالنشر',
      limits: 'عقارات غير محدودة • 7 صور لكل عقار'
    }
  ];

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (newStatus === currentStatus) return;
    
    setPendingStatus(newStatus);
    setShowConfirmDialog(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;

    const success = await updateUserStatus(userId, pendingStatus);
    if (success && onStatusUpdate) {
      onStatusUpdate();
    }
    
    setShowConfirmDialog(false);
    setPendingStatus(null);
  };

  const currentOption = statusOptions.find(option => option.value === currentStatus);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 min-w-[140px] justify-between"
            disabled={isUpdating}
          >
            <div className="flex items-center gap-2">
              {currentOption?.icon}
              <span className="text-sm">{getStatusLabel(currentStatus)}</span>
            </div>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-80 p-2" align="end">
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b mb-2">
            تغيير حالة المستخدم
          </div>
          
          {statusOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={`p-3 cursor-pointer ${
                option.value === currentStatus ? 'bg-muted' : ''
              }`}
            >
              <div className="flex items-start gap-3 w-full">
                <div className="flex-shrink-0 mt-0.5">
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{option.label}</span>
                    {option.value === currentStatus && (
                      <Badge variant="secondary" className="text-xs">
                        الحالي
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {option.description}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Info className="w-3 h-3" />
                    {option.limits}
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <div className="px-2 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1 mb-1">
              <Crown className="w-3 h-3" />
              <span className="font-medium">ملاحظة:</span>
            </div>
            <p>فقط المديرون يمكنهم تغيير حالات المستخدمين</p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              تأكيد تغيير حالة المستخدم
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div>
                هل أنت متأكد من تغيير حالة المستخدم <strong>{userName}</strong> إلى:
              </div>
              {pendingStatus && (
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {statusOptions.find(o => o.value === pendingStatus)?.icon}
                    <strong>{getStatusLabel(pendingStatus)}</strong>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {statusOptions.find(o => o.value === pendingStatus)?.description}
                  </p>
                  <div className="text-sm text-blue-600 mt-1">
                    الحدود الجديدة: {statusOptions.find(o => o.value === pendingStatus)?.limits}
                  </div>
                </div>
              )}
              <p className="text-sm text-orange-600">
                سيتم تطبيق الحدود الجديدة فوراً على هذا المستخدم.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmStatusChange}
              disabled={isUpdating}
            >
              {isUpdating ? "جاري التحديث..." : "تأكيد التغيير"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};








