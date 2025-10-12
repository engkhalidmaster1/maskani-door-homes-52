import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AuthActionResult = {
  error: AuthError | Error | null;
  data?: unknown;
};

interface AuthState {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<AuthActionResult>;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
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

/**
 * معالجة أخطاء المصادقة وتحويلها لرسائل مفهومة
 */
const handleAuthError = (error: AuthError | Error | null): string | null => {
  if (!error) return null;

  const errorMessage = error.message;
  
  // رسائل خطأ مخصصة باللغة العربية
  const errorMappings: Record<string, string> = {
    'Invalid login credentials': 'بيانات تسجيل الدخول غير صحيحة',
    'Email not confirmed': 'يرجى تأكيد البريد الإلكتروني أولاً',
    'Too many requests': 'محاولات كثيرة، يرجى المحاولة لاحقاً',
    'Password should be at least 6 characters': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    'User already registered': 'المستخدم مسجل مسبقاً',
    'Signup disabled': 'التسجيل معطل حالياً',
    'Invalid email': 'البريد الإلكتروني غير صحيح',
    'Weak password': 'كلمة المرور ضعيفة',
    'Email already in use': 'البريد الإلكتروني مستخدم مسبقاً'
  };

  return errorMappings[errorMessage] || errorMessage || 'حدث خطأ غير متوقع';
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    userRole: null,
    isLoading: true,
    error: null
  });
  const { toast } = useToast();

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const fetchUserRole = useCallback(async (userId: string): Promise<string | null> => {
    try {
      console.log('Fetching role for user:', userId);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // لا يوجد دور محدد، افتراضياً user
          console.log('No role found, defaulting to user');
          return 'user';
        }
        console.error('Error fetching user role:', error);
        return 'user'; // افتراضي عند الخطأ
      }
      
      console.log('User role data:', data);
      return data?.role || 'user';
    } catch (error) {
      console.error('Error fetching user role:', error);
      return 'user'; // افتراضي عند الخطأ
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        const errorMessage = handleAuthError(error);
        setAuthState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false
        }));
        return;
      }

      if (session?.user) {
        const userRole = await fetchUserRole(session.user.id);
        setAuthState({
          user: session.user,
          session,
          userRole,
          isLoading: false,
          error: null
        });
      } else {
        setAuthState({
          user: null,
          session: null,
          userRole: null,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      const errorMessage = handleAuthError(error as Error);
      setAuthState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
    }
  }, [fetchUserRole]);

  useEffect(() => {
    let mounted = true;

    const handleAuthStateChange = async (event: string, session: Session | null) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (!mounted) return;

      try {
        if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            session: null,
            userRole: null,
            isLoading: false,
            error: null
          });
          return;
        }
        
        if (session?.user) {
          const userRole = await fetchUserRole(session.user.id);
          
          if (mounted) {
            setAuthState({
              user: session.user,
              session,
              userRole,
              isLoading: false,
              error: null
            });
          }
        } else {
          if (mounted) {
            setAuthState({
              user: null,
              session: null,
              userRole: null,
              isLoading: false,
              error: null
            });
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        if (mounted) {
          const errorMessage = handleAuthError(error as Error);
          setAuthState(prev => ({
            ...prev,
            error: errorMessage,
            isLoading: false
          }));
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        if (mounted) {
          const errorMessage = handleAuthError(error);
          setAuthState(prev => ({
            ...prev,
            error: errorMessage,
            isLoading: false
          }));
        }
      } else {
        handleAuthStateChange('INITIAL_SESSION', session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone: string
  ): Promise<AuthActionResult> => {
    try {
      clearError();
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
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
        const errorMessage = handleAuthError(error);
        setAuthState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
        toast({
          title: "خطأ في التسجيل",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم إنشاء الحساب بنجاح!",
          description: "يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب",
        });
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
      
      return { error, data };
    } catch (error) {
      const errorMessage = handleAuthError(error as Error);
      setAuthState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      toast({
        title: "خطأ في التسجيل",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthActionResult> => {
    try {
      clearError();
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        const errorMessage = handleAuthError(error);
        setAuthState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
        toast({
          title: "خطأ في تسجيل الدخول",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "مرحباً بك!",
          description: "تم تسجيل الدخول بنجاح",
        });
        // سيتم تحديث الحالة تلقائياً من خلال onAuthStateChange
      }
      
      return { error, data };
    } catch (error) {
      const errorMessage = handleAuthError(error as Error);
      setAuthState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      toast({
        title: "خطأ في تسجيل الدخول",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: error as Error };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      clearError();
      console.log('AuthProvider: Signing out user');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        const errorMessage = handleAuthError(error);
        toast({
          title: "خطأ في تسجيل الخروج",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم تسجيل الخروج",
          description: "نراك قريباً!",
        });
      }
      
      // سيتم تنظيف الحالة تلقائياً من خلال onAuthStateChange
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      const errorMessage = handleAuthError(error as Error);
      toast({
        title: "خطأ في تسجيل الخروج",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const value: AuthContextType = {
    ...authState,
    signUp,
    signIn,
    signOut,
    refreshUser,
    clearError,
    isAdmin: authState.userRole === 'admin'
  };

  console.log('Auth state:', {
    user: authState.user?.email,
    userRole: authState.userRole,
    isAdmin: authState.userRole === 'admin',
    isLoading: authState.isLoading,
    error: authState.error
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};