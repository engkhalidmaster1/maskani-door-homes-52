import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, CheckCircle, XCircle } from "lucide-react";

export const AdminDebug = () => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setUserInfo(user);

      if (user) {
        // Check admin status
        const { data: adminData, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .single();

        setAdminInfo(adminData);
        console.log('Admin Data:', adminData);
        console.log('Admin Error:', error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "✅ تم النسخ",
      description: "تم نسخ المعلومات إلى الحافظة",
    });
  };

  const addAsAdmin = async () => {
    if (!userInfo) return;

    try {
      // محاولة التحديث أولاً
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({
          role: 'super_admin',
          active: true,
          permissions: {
            approve_offices: true,
            manage_users: true,
            view_reports: true,
            delete_users: true
          }
        })
        .eq('user_id', userInfo.id);

      // إذا نجح التحديث
      if (!updateError) {
        toast({
          title: "✅ تم التحديث",
          description: "تم تحديث صلاحياتك كمدير عام بنجاح!",
        });
        checkStatus();
        return;
      }

      // إذا لم يوجد سجل للتحديث، أضف سجل جديد
      const { error: insertError } = await supabase
        .from('admin_users')
        .insert({
          user_id: userInfo.id,
          role: 'super_admin',
          created_by: userInfo.id,
          active: true,
          permissions: {
            approve_offices: true,
            manage_users: true,
            view_reports: true,
            delete_users: true
          }
        });

      if (insertError) {
        toast({
          title: "❌ خطأ",
          description: insertError.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ نجح",
          description: "تم إضافتك كمدير عام بنجاح!",
        });
        checkStatus();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      toast({
        title: "❌ خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-8">جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">🔍 معلومات المستخدم والصلاحيات</h1>

        {/* User Info */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            👤 معلومات المستخدم
          </h2>
          {userInfo ? (
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg font-mono text-sm">
              <div>
                <strong>البريد الإلكتروني:</strong> 
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-blue-100 px-2 py-1 rounded">{userInfo.email}</code>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => copyToClipboard(userInfo.email)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <strong>User ID:</strong>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">{userInfo.id}</code>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => copyToClipboard(userInfo.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <strong>تاريخ التسجيل:</strong> {new Date(userInfo.created_at).toLocaleString('ar-IQ')}
              </div>
            </div>
          ) : (
            <p className="text-red-600">⚠️ لا يوجد مستخدم مسجل دخول</p>
          )}
        </Card>

        {/* Admin Info */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🛡️ معلومات صلاحيات المدير
          </h2>
          {adminInfo ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 text-lg font-bold">
                <CheckCircle className="h-6 w-6" />
                <span>✅ لديك صلاحيات مدير</span>
              </div>
              <div className="bg-green-50 p-4 rounded-lg space-y-2">
                <div><strong>الدور:</strong> <span className="text-green-700 font-bold">{adminInfo.role}</span></div>
                <div><strong>الحالة:</strong> <span className={adminInfo.active ? 'text-green-600' : 'text-red-600'}>{adminInfo.active ? 'مفعّل ✅' : 'معطّل ❌'}</span></div>
                <div>
                  <strong>الصلاحيات:</strong>
                  <pre className="mt-2 bg-white p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(adminInfo.permissions, null, 2)}
                  </pre>
                </div>
              </div>
              
              {/* إذا كان الحساب معطل أو الدور ليس super_admin */}
              {(!adminInfo.active || (adminInfo.role !== 'super_admin' && adminInfo.role !== 'admin')) && (
                <Button 
                  onClick={addAsAdmin}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                >
                  🔄 تحديث الصلاحيات وتفعيل الحساب
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-600 text-lg font-bold">
                <XCircle className="h-6 w-6" />
                <span>❌ لا توجد صلاحيات مدير</span>
              </div>
              <p className="text-gray-600">لإضافة صلاحيات المدير، انقر على الزر أدناه أو نفذ الأمر SQL التالي في Supabase:</p>
              
              <div className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-auto">
                <code className="text-xs">
{`INSERT INTO admin_users (user_id, role, created_by, permissions)
VALUES (
  '${userInfo?.id}',
  'super_admin',
  '${userInfo?.id}',
  '{"approve_offices": true, "manage_users": true, "view_reports": true, "delete_users": true}'::jsonb
);`}
                </code>
              </div>

              <Button 
                onClick={addAsAdmin}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                ➕ إضافتي كمدير عام الآن
              </Button>
            </div>
          )}
        </Card>

        {/* SQL Commands */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">📝 أوامر SQL مفيدة</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold mb-2">1️⃣ عرض جميع المديرين:</h3>
              <div className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-auto">
                <code>
{`SELECT au.*, u.email 
FROM admin_users au 
JOIN auth.users u ON u.id = au.user_id;`}
                </code>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">2️⃣ تحديث صلاحيات مدير موجود:</h3>
              <div className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-auto">
                <code>
{`UPDATE admin_users 
SET role = 'super_admin', active = true
WHERE user_id = '${userInfo?.id}';`}
                </code>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">3️⃣ حذف صلاحيات مدير:</h3>
              <div className="bg-gray-800 text-red-400 p-3 rounded text-xs overflow-auto">
                <code>
{`DELETE FROM admin_users 
WHERE user_id = 'USER_ID_HERE';`}
                </code>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-4">
          <Button onClick={checkStatus} variant="outline" className="flex-1">
            🔄 إعادة التحقق
          </Button>
          <Button 
            onClick={() => window.location.href = '/admin/users'} 
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
          >
            👉 الذهاب إلى صفحة إدارة المستخدمين
          </Button>
        </div>
      </div>
    </div>
  );
};
