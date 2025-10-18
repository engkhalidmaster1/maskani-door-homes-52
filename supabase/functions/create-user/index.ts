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

    const rolePermissions = {
      admin: { properties: -1, images_per_property: -1, featured_properties: -1, storage_mb: -1 },
      office: { properties: -1, images_per_property: -1, featured_properties: 50, storage_mb: -1 },
      agent: { properties: 100, images_per_property: 20, featured_properties: 10, storage_mb: 10240 },
      publisher: { properties: 20, images_per_property: 10, featured_properties: 2, storage_mb: 2048 }
    }

    const userRole = role || 'publisher'
    const limits = rolePermissions[userRole as keyof typeof rolePermissions] || rolePermissions.publisher

    const { error: permError } = await supabaseAdmin
      .from('user_permissions')
      .insert({
        user_id: userData.user.id,
        role: userRole,
        limits: limits,
        is_active: true,
        can_publish: true,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (permError) {
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id)
      return new Response(
        JSON.stringify({ error: 'فشل إضافة صلاحيات المستخدم: ' + permError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'حدث خطأ غير متوقع' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
