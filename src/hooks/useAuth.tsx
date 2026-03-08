import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback, ErrorInfo, Component } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';
import { useToast } from "@/hooks/use-toast";

type AuthActionResult = {
  error: AuthError | Error | null;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<AuthActionResult>;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserRole = useCallback(async (userId: string): Promise<string> => {
    try {
      // First, ask the server whether this user is an admin (authoritative)
      try {
        const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin', { uid: userId });
        if (!isAdminError && isAdminData !== undefined && isAdminData !== null) {
          let isAdminFlag = false;
          if (typeof isAdminData === 'boolean') {
            isAdminFlag = isAdminData;
          } else if (Array.isArray(isAdminData) && isAdminData.length > 0) {
            isAdminFlag = Boolean(isAdminData[0]);
          }

          if (isAdminFlag) {
            setUserRole('admin');
            return 'admin';
          }
        }
      } catch (rpcErr) {
        // Continue to fallback logic below
      }

      // First try unified permissions table (typed)
      type PermRole = Database['public']['Tables']['user_permissions']['Row']['role'];
      const { data: permData, error: permError } = await supabase
        .from('user_permissions')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (!permError && permData) {
        const maybeRole = (permData as { role?: PermRole }).role;
        if (maybeRole) {
          setUserRole(maybeRole);
          return maybeRole;
        }
      }

      // Fallback to legacy user_roles table
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        setUserRole('publisher');
        return 'publisher';
      }

      console.log('User role data:', data);
  const role = data.role || 'publisher';
      console.log('User role fetched:', role);
      setUserRole(role);
      return role;
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      setUserRole('publisher');
      return 'publisher';
    }
  }, [user?.email]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_OUT') {
          // Clear all state when user signs out
          setSession(null);
          setUser(null);
          setUserRole(null);
          setIsLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user role after session is established
          setTimeout(async () => {
            const role = await fetchUserRole(session.user.id);
            console.log('User role fetched:', role);
            setUserRole(role);

          }, 0);
        } else {
          setUserRole(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          const role = await fetchUserRole(session.user.id);
          setUserRole(role);
        }, 0);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserRole]);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone: string
  ): Promise<AuthActionResult> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone: phone,
          }
        }
      });
      
      if (error) {
        toast({
          title: "خطأ في التسجيل",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم إنشاء الحساب بنجاح!",
          description: "يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب",
        });
      }
      
      return { error };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء التسجيل";
      toast({
        title: "خطأ في التسجيل",
        description: message,
        variant: "destructive",
      });
      return { error: new Error(message) };
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthActionResult> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "🎉 مرحباً بعودتك!",
          description: "تم تسجيل الدخول بنجاح - استمتع بتصفح العقارات",
          duration: 8000, // زمن أطول لإعطاء المستخدم وقت لرؤية الزر
        });
      }
      
      return { error };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء تسجيل الدخول";
      toast({
        title: "خطأ في تسجيل الدخول",
        description: message,
        variant: "destructive",
      });
      return { error: new Error(message) };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      
      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        toast({
          title: "خطأ في تسجيل الخروج",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      console.log('Sign out successful');
      
      // Clear local state after successful sign out
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      toast({
        title: "تم تسجيل الخروج",
        description: "نراك قريباً!",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء تسجيل الخروج";
      console.error('Sign out error:', error);
      toast({
        title: "خطأ في تسجيل الخروج",
        description: message,
        variant: "destructive",
      });
    }
  };

  const isAdmin = userRole === 'admin';
  console.log('Auth state:', { user: user?.email, userRole, isAdmin, isLoading });

  const value = {
    user,
    session,
    userRole,
    isLoading,
    signUp,
    signIn,
    signOut,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Error Boundary للـ AuthProvider
interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AuthErrorBoundary extends Component<
  { children: ReactNode },
  AuthErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AuthProvider Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              خطأ في نظام المصادقة
            </h2>
            <p className="text-gray-600 mb-4">
              حدث خطأ في تحميل بيانات المستخدم. يرجى إعادة تحميل الصفحة.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component مع Error Boundary
export const AuthProviderWithBoundary = ({ children }: AuthProviderProps) => {
  return (
    <AuthErrorBoundary>
      <AuthProvider>{children}</AuthProvider>
    </AuthErrorBoundary>
  );
};