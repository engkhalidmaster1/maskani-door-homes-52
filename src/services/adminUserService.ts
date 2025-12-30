import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from '@/types/appRoles';

export interface CreateUserData {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  address?: string;
  role: AppRole;
}

export interface UserPermissions {
  properties: number;
  images_per_property: number;
  storage_mb: number;
}

const ROLE_PERMISSIONS: Record<string, UserPermissions> = {
  // 👑 مدير النظام — صلاحيات غير محدودة
  admin: { properties: -1, images_per_property: -1, storage_mb: -1 },
  // 🏢 مكتب عقارات — 100 عقار، 10 صور لكل عقار
  office: { properties: 100, images_per_property: 10, storage_mb: 5000 },
  // 🏆 وكيل عقاري — 30 عقار، 10 صور لكل عقار
  agent: { properties: 30, images_per_property: 10, storage_mb: 1024 },
  // 👤 ناشر عادي — 3 عقارات، 10 صور لكل عقار
  publisher: { properties: 3, images_per_property: 10, storage_mb: 200 }
};

export const createUserWithEdgeFunction = async (userData: CreateUserData) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('غير مصرح لك بإجراء هذه العملية');
    }

    const functionUrl = `https://ugefzrktqeyspnzhxzzw.supabase.co/functions/v1/create-user`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        full_name: userData.fullName,
        phone: userData.phone,
        role: userData.role,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result.error || 'فشل إنشاء المستخدم';
      
      // معالجة رسائل الخطأ المختلفة
      if (errorMessage.includes('duplicate key') || errorMessage.includes('مستخدم مسبقاً')) {
        throw new Error('البريد الإلكتروني مستخدم بالفعل، يرجى استخدام بريد إلكتروني آخر');
      } else if (errorMessage.includes('User already registered') || errorMessage.includes('already been registered')) {
        throw new Error('هذا البريد الإلكتروني مسجل مسبقاً في النظام');
      } else if (errorMessage.includes('Invalid email')) {
        throw new Error('البريد الإلكتروني غير صحيح');
      } else if (errorMessage.includes('Password')) {
        throw new Error('كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل');
      } else if (errorMessage.includes('For security purposes')) {
        throw new Error('انتظر لحظة ثم أعد المحاولة (حد أمان مؤقت)');
      } else if (errorMessage.includes('Too Many Requests')) {
        throw new Error('تم تجاوز الحد المسموح، يرجى الانتظار دقيقة ثم المحاولة مرة أخرى');
      }
      
      throw new Error(errorMessage);
    }

    return result;
  } catch (error: unknown) {
    console.error('Error in createUserWithEdgeFunction:', error);
    throw error;
  }
};

export const createUserSimple = async (userData: CreateUserData) => {
  try {
    // تسجيل إضافي لمراقبة إنشاء المديرين
    if (userData.role === 'admin') {
      console.warn('Creating admin user:', userData.email);
    }
    
    // إنشاء المستخدم باستخدام Supabase Auth فقط
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.fullName || '',
          phone: userData.phone || '',
          role: userData.role // حفظ الدور في metadata
        }
      }
    });

    if (authError) {
      if (authError.message.includes('User already registered') || 
          authError.message.includes('already been registered')) {
        throw new Error('البريد الإلكتروني مستخدم بالفعل');
      }
      if (authError.message.includes('For security purposes')) {
        throw new Error('انتظر لحظة ثم أعد المحاولة (حد أمان مؤقت)');
      }
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('فشل إنشاء المستخدم');
    }

    // إضافة الدور الأساسي في جدول user_roles (uses app_role enum: admin | user)
    // Map our 4-role system to the 2-role system in user_roles table
    const basicRole: 'admin' | 'user' = userData.role === 'admin' ? 'admin' : 'user';
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: basicRole,
      });

    if (roleError) {
      console.error('Role creation error:', roleError);
      // لا نفشل العملية بسبب الدور، سنحاول إضافته لاحقاً
    }

    // إضافة التفاصيل في جدول user_statuses للأدوار المتخصصة
    if (userData.role !== 'admin') {
      // Map roles into 'user_status' enum values
      const statusRole = userData.role === 'office' ? 'office_agent' : userData.role === 'agent' ? 'trusted_owner' : 'publisher';
      const limits = ROLE_PERMISSIONS[userData.role] || ROLE_PERMISSIONS.publisher;

      const { error: statusError } = await supabase
        .from('user_statuses')
        .insert({
          user_id: authData.user.id,
          status: statusRole,
          can_publish: true,
          is_verified: userData.role === 'office' || userData.role === 'agent',
          properties_limit: limits.properties,
          images_limit: limits.images_per_property,
        });

      if (statusError) {
        console.error('Status creation error:', statusError);
      }
    }

    // Also add a user_permissions row so the unified permissions system is consistent
    const limits = ROLE_PERMISSIONS[userData.role] || ROLE_PERMISSIONS.publisher;
    try {
      const { error: permInsertErr } = await supabase
        .from('user_permissions')
        .insert({
          user_id: authData.user.id,
          role: userData.role,
          properties_count: 0,
          can_publish: userData.role !== 'publisher',
          is_verified: userData.role === 'office' || userData.role === 'agent',
          is_active: true,
          limits: { properties: limits.properties, images_per_property: limits.images_per_property, storage_mb: limits.storage_mb }
        });

      if (permInsertErr) {
        console.warn('Warning: failed to insert user_permissions for new user', permInsertErr);
      }
    } catch (err) {
      console.warn('Warning: exception inserting user_permissions', err);
    }

    // إنشاء الملف الشخصي
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: authData.user.id,
        full_name: userData.fullName || null,
        phone: userData.phone || null,
        address: userData.address || null,
      });

    if (profileError && !profileError.message.includes('duplicate')) {
      console.warn('Profile creation warning:', profileError);
      // لا نفشل العملية بسبب Profile
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: userData.fullName,
        role: userData.role
      }
    };

  } catch (error: unknown) {
    console.error('Error in createUserSimple:', error);
    throw error;
  }
};

export const createUser = async (userData: CreateUserData) => {
  try {
    // محاولة استخدام Edge Function أولاً
    return await createUserWithEdgeFunction(userData);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn('Edge Function failed, trying simple method:', errorMessage);
    
    // إذا فشلت Edge Function، استخدم الطريقة البسيطة
    try {
      return await createUserSimple(userData);
    } catch (simpleError: unknown) {
      const simpleErrorMessage = simpleError instanceof Error ? simpleError.message : 'Unknown simple error';
      console.error('Both methods failed:', { edgeError: errorMessage, simpleError: simpleErrorMessage });
      
      // إذا فشلت كلا الطريقتين، ارجع رسالة خطأ واضحة
      if (simpleErrorMessage.includes('already registered') || simpleErrorMessage.includes('مستخدم')) {
        throw new Error('البريد الإلكتروني مستخدم بالفعل في النظام');
      }
      
      if (simpleErrorMessage.includes('security purposes') || simpleErrorMessage.includes('حد أمان')) {
        throw new Error('يرجى الانتظار دقيقة واحدة ثم إعادة المحاولة (حد أمان مؤقت)');
      }
      
      throw new Error(`فشل إنشاء المستخدم: ${simpleErrorMessage}`);
    }
  }
};