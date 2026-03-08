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

export const ROLE_PERMISSIONS: Record<string, UserPermissions> = {
  admin: { properties: -1, images_per_property: -1, storage_mb: -1 },
  office: { properties: 100, images_per_property: 10, storage_mb: 5000 },
  agent: { properties: 30, images_per_property: 10, storage_mb: 1024 },
  publisher: { properties: 3, images_per_property: 10, storage_mb: 200 }
};

const createUserWithEdgeFunction = async (userData: CreateUserData) => {
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
    
    if (errorMessage.includes('duplicate key') || errorMessage.includes('مستخدم مسبقاً')) {
      throw new Error('البريد الإلكتروني مستخدم بالفعل');
    } else if (errorMessage.includes('User already registered') || errorMessage.includes('already been registered')) {
      throw new Error('هذا البريد الإلكتروني مسجل مسبقاً في النظام');
    } else if (errorMessage.includes('Invalid email')) {
      throw new Error('البريد الإلكتروني غير صحيح');
    } else if (errorMessage.includes('Password')) {
      throw new Error('كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل');
    } else if (errorMessage.includes('For security purposes')) {
      throw new Error('انتظر لحظة ثم أعد المحاولة (حد أمان مؤقت)');
    } else if (errorMessage.includes('Too Many Requests')) {
      throw new Error('تم تجاوز الحد المسموح، يرجى الانتظار دقيقة');
    }
    
    throw new Error(errorMessage);
  }

  return result;
};

export const createUser = createUserWithEdgeFunction;
