// Supabase Edge Function - Create User
// Deploy: supabase functions deploy create-user

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email, password, full_name, phone, role } = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // أولاً، التحقق من وجود المستخدم مسبقاً
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUser.users.find((user: any) => user.email === email)

    if (userExists) {
      return new Response(
        JSON.stringify({ error: 'البريد الإلكتروني مستخدم مسبقاً' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || '', phone: phone || '' }
    })

    if (createError || !userData.user) {
      return new Response(
        JSON.stringify({ error: createError?.message || 'فشل إنشاء المستخدم' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Role limits per product owner request
    const rolePermissions = {
      admin: { properties: -1, images_per_property: -1, storage_mb: -1 },
      office: { properties: 100, images_per_property: 10, storage_mb: 5000 },
      agent: { properties: 30, images_per_property: 10, storage_mb: 1024 },
      publisher: { properties: 3, images_per_property: 10, storage_mb: 200 }
    }

    const userRole = role || 'publisher'
    const limits = rolePermissions[userRole as keyof typeof rolePermissions] || rolePermissions.publisher

    // إضافة الدور الأساسي في جدول user_roles (admin أو user فقط)
    const basicRole = userRole === 'admin' ? 'admin' : 'user'
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userData.user.id,
        role: basicRole,
      })

    if (roleError) {
      console.error('Role creation error:', roleError)
      // لا نفشل العملية بسبب الدور
    }

    // إضافة التفاصيل في جدول user_statuses للأدوار المتخصصة
    if (userRole !== 'admin') {
      // Map app roles into the user_status enum
      const statusRole = userRole === 'office' ? 'office_agent' : userRole === 'agent' ? 'trusted_owner' : 'publisher'
      
      const { error: statusError } = await supabaseAdmin
        .from('user_statuses')
        .insert({
          user_id: userData.user.id,
          status: statusRole,
          can_publish: true,
          is_verified: userRole === 'office' || userRole === 'agent',
          properties_limit: limits.properties,
          images_limit: limits.images_per_property,
        })

      if (statusError) {
        console.error('Status creation error:', statusError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userData.user.id,
          email: userData.user.email,
          full_name: full_name,
          role: userRole
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message || 'حدث خطأ غير متوقع' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
