import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  Edit3, 
  Trash2, 
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Ban,
  Unlock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

interface UserActionsProps {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    role: string;
    created_at: string;
    properties_count: number;
  };
  onDelete: (userId: string) => Promise<void>;
  onUpdateRole: (userId: string, newRole: 'admin' | 'user') => Promise<void>;
  onBanUser: (userId: string) => Promise<void>;
  onUnbanUser: (userId: string) => Promise<void>;
  getUserProfile: (userId: string) => Promise<ProfileRow | null>;
  getUserProperties: (userId: string) => Promise<PropertyRow[]>;
}

export const UserActions: React.FC<UserActionsProps> = ({
  user,
  onDelete,
  onUpdateRole,
  onBanUser,
  onUnbanUser,
  getUserProfile,
  getUserProperties
}) => {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<ProfileRow | null>(null);
  const [userProperties, setUserProperties] = useState<PropertyRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newRole, setNewRole] = useState<'admin' | 'user'>(user.role as 'admin' | 'user');
  const [isUserBanned, setIsUserBanned] = useState(false);
  const { toast } = useToast();

  // Check if user has any published properties
  const checkUserBanStatus = useCallback(async () => {
    try {
      const properties = await getUserProperties(user.id);
      const hasPublishedProperties = properties.some(prop => prop.is_published);
      setIsUserBanned(!hasPublishedProperties && properties.length > 0);
    } catch (error) {
      console.error('Error checking user ban status:', error);
    }
  }, [getUserProperties, user.id]);

  useEffect(() => {
    checkUserBanStatus();
  }, [checkUserBanStatus]);

  const handleViewUser = async () => {
    setIsLoading(true);
    try {
      const [profile, properties] = await Promise.all([
        getUserProfile(user.id),
        getUserProperties(user.id)
      ]);
      setUserProfile(profile);
      setUserProperties(properties);
      setIsViewDialogOpen(true);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات المستخدم",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = () => {
    setNewRole(user.role as 'admin' | 'user');
    setIsEditDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (newRole === user.role) {
      setIsEditDialogOpen(false);
      return;
    }

    try {
      await onUpdateRole(user.id, newRole);
      setIsEditDialogOpen(false);
      toast({
        title: "تم التحديث",
        description: "تم تحديث دور المستخدم بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث دور المستخدم",
        variant: "destructive",
      });
    }
  };

  // Delegate deletion to parent via onDelete; do not show a toast here to avoid duplicate notifications.
  const handleDeleteUser = async () => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${user.full_name || user.email}"؟ سيتم حذف جميع عقاراته أيضاً`)) {
      return;
    }

    try {
      await onDelete(user.id);
      // Parent component is responsible for showing success/failure notifications.
    } catch (error) {
      console.error('UserActions.handleDeleteUser error:', error);
      // Intentionally not showing toast here to prevent duplicate notifications.
    }
  };

  const handleBanUser = async () => {
    if (confirm(`هل أنت متأكد من حظر المستخدم "${user.full_name || user.email}" من النشر؟ سيتم إخفاء جميع عقاراته`)) {
      try {
        await onBanUser(user.id);
        setIsUserBanned(true);
        toast({
          title: "تم الحظر",
          description: "تم حظر المستخدم من النشر بنجاح",
        });
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل في حظر المستخدم",
          variant: "destructive",
        });
      }
    }
  };

  const handleUnbanUser = async () => {
    if (confirm(`هل أنت متأكد من إلغاء حظر المستخدم "${user.full_name || user.email}"؟ سيتم نشر جميع عقاراته`)) {
      try {
        await onUnbanUser(user.id);
        setIsUserBanned(false);
        toast({
          title: "تم إلغاء الحظر",
          description: "تم إلغاء حظر المستخدم بنجاح",
        });
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل في إلغاء حظر المستخدم",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <>
      <div className="flex gap-2 items-center flex-wrap">
        {/* View Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewUser}
          disabled={isLoading}
          className="gap-2 h-9"
          aria-label="عرض تفاصيل المستخدم"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">عرض</span>
        </Button>

        {/* Edit Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleEditUser}
          className="gap-2 h-9"
          aria-label="تعديل دور المستخدم"
        >
          <Edit3 className="w-4 h-4" />
          <span className="hidden sm:inline">تعديل</span>
        </Button>

        {/* Ban/Unban Button - Show for all users */}
        {!isUserBanned ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBanUser}
            className="gap-2 h-9 text-orange-600 border-orange-200 hover:text-orange-700 hover:bg-orange-50 hover:border-orange-300"
            aria-label="حظر من النشر"
          >
            <Ban className="w-4 h-4" />
            <span className="hidden sm:inline">حظر</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnbanUser}
            className="gap-2 h-9 text-green-600 border-green-200 hover:text-green-700 hover:bg-green-50 hover:border-green-300"
            aria-label="إلغاء الحظر"
          >
            <Unlock className="w-4 h-4" />
            <span className="hidden sm:inline">إلغاء الحظر</span>
          </Button>
        )}

        {/* Delete Button - Show for all users */}
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeleteUser}
          className="gap-2 h-9"
          aria-label="حذف المستخدم"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">حذف</span>
        </Button>
      </div>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              تفاصيل المستخدم
            </DialogTitle>
            <DialogDescription>
              عرض معلومات المستخدم وعقاراته
            </DialogDescription>
          </DialogHeader>

          {userProfile && (
            <div className="space-y-6">
              {/* User Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">معلومات المستخدم</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">الاسم:</span>
                      <span>{userProfile.full_name || "غير محدد"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">البريد الإلكتروني:</span>
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">الهاتف:</span>
                      <span>{userProfile.phone || "غير محدد"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">العنوان:</span>
                      <span>{userProfile.address || "غير محدد"}</span>
                    </div>
                                         <div className="flex items-center gap-2">
                       <Calendar className="w-4 h-4 text-muted-foreground" />
                       <span className="font-medium">تاريخ التسجيل:</span>
                       <span>{new Date(userProfile.created_at).toLocaleDateString('en-US')}</span>
                     </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                        {user.role === 'admin' ? "مدير" : "مستخدم"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Properties Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    عقارات المستخدم ({userProperties.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userProperties.length > 0 ? (
                    <div className="space-y-3">
                      {userProperties.map((property) => (
                        <div key={property.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{property.title}</h4>
                            <p className="text-sm text-muted-foreground">{property.location}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={property.is_published ? "default" : "secondary"}>
                              {property.is_published ? "منشور" : "مخفي"}
                            </Badge>
                                                         <span className="text-sm font-bold">{property.price.toLocaleString()} د.ع</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      لا توجد عقارات لهذا المستخدم
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل دور المستخدم</DialogTitle>
            <DialogDescription>
              تغيير دور المستخدم من مدير إلى مستخدم أو العكس
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">المستخدم:</label>
              <p className="text-sm text-muted-foreground">{user.full_name || user.email}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الدور الحالي:</label>
              <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                {user.role === 'admin' ? "مدير" : "مستخدم"}
              </Badge>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الدور الجديد:</label>
              <Select value={newRole} onValueChange={(value: 'admin' | 'user') => setNewRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">مستخدم</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveRole}>
                حفظ التغييرات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
