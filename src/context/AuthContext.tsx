import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { getAuthMobileCallbackUrl } from '../constants/appLinks';
import { translateSupabaseError } from '../utils/supabaseErrorMessages';
import { markLoggedInBefore } from '../utils/welcome';
import { AUTH_MOBILE } from '../shared/auth-messages';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  image_url?: string;
  is_verified?: boolean;
}

interface UserWithProfile extends User {
  profile?: Profile;
}

interface SignUpResult {
  needsEmailVerification: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserWithProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    full_name: string,
    username: string,
  ) => Promise<SignUpResult>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  verifyRecoveryOtp: (email: string, token: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  resendSignupConfirmation: (email: string) => Promise<void>;
  isEmailConfirmed: boolean;
  refreshAuthSession: () => Promise<void>;
  logout: () => Promise<void>;
  reloadAuth: () => void;
  unreadNotificationCount: number | undefined;
  setUnreadNotificationCount: (count: number) => void;
}
// Extracting the type of unreadNotificationCount
type UnreadNotificationCountType = AuthContextType['unreadNotificationCount'];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCountState] = useState<UnreadNotificationCountType>(undefined);

  const userIdRef = useRef<string | undefined>(undefined);

  const setUnreadNotificationCount = (count: number) => {
    setUnreadNotificationCountState(count);
  };

  const ensureProfile = async (authUser: User): Promise<Profile | null> => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name, image_url, is_verified')
      .eq('id', authUser.id)
      .single();

    if (profileData) {
      return profileData as Profile;
    }

    if (!profileError) {
      return null;
    }

    if (profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
      return null;
    }

    const userMetadata = authUser.user_metadata || {};

    let username = '';
    const rawUsername = userMetadata.username;
    if (typeof rawUsername === 'string' && rawUsername.trim().length > 0) {
      username = rawUsername.trim();
    }

    if (!username) {
      username = `user_${authUser.id.slice(0, 8)}`;
    }

    let fullName = '';
    const rawFullName = userMetadata.full_name;
    if (typeof rawFullName === 'string' && rawFullName.trim().length > 0) {
      fullName = rawFullName.trim();
    }

    if (!fullName) {
      const email = authUser.email || '';
      const emailPrefix = email.split('@')[0] || '';
      const normalized = emailPrefix.replace(/[._-]+/g, ' ').trim();
      fullName = normalized.length > 0 ? normalized : 'Kullanıcı';
    }

    const { data: upsertedProfile, error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: authUser.id,
        username,
        full_name: fullName,
        image_url: '',
        is_verified: false,
      })
      .select('id, username, full_name, image_url, is_verified')
      .single();

    if (upsertError) {
      console.error('Profile creation/upsert error:', upsertError);
      return null;
    }

    if (!upsertedProfile) {
      return null;
    }

    return upsertedProfile as Profile;
  };

  const applySession = async (session: Session | null) => {
    if (!session?.user) {
      setIsAuthenticated(false);
      setUser(null);
      userIdRef.current = undefined;

      return;
    }

    setIsAuthenticated(true);
    userIdRef.current = session.user.id;

    await markLoggedInBefore();

    const profileData = await ensureProfile(session.user);

    setUser({
      ...session.user,
      profile: profileData || undefined,
    });
  };

  useEffect(() => {
    const fetchUnreadNotificationCount = async (recipientId: string | undefined) => {
      if (!recipientId) {
        return;
      }

      try {
        const { data, error: countError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact' })
          .eq('is_read', false)
          .eq('recipient_id', recipientId);

        if (countError) {
          throw countError;
        }

        setUnreadNotificationCountState(data?.length || 0);
      } catch (error) {
        console.error('Error fetching unread notification count:', error);
      }
    };

    const interval = setInterval(() => {
      const recipientId = userIdRef.current;

      if (!recipientId) {
        return;
      }

      fetchUnreadNotificationCount(recipientId);
    }, 5000);

    const fetchSessionAndProfile = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          setIsAuthenticated(false);
          setUser(null);
          userIdRef.current = undefined;

          setIsLoading(false);

          return;
        }

        await applySession(session);

        setIsLoading(false);

        await fetchUnreadNotificationCount(session.user.id);
      } catch (error) {
        console.error('Error fetching session or profile:', error);
        setIsLoading(false);
      }
    };

    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setIsAuthenticated(false);
        setUser(null);
        userIdRef.current = undefined;

        return;
      }

      setIsAuthenticated(true);
      userIdRef.current = session.user.id;

      // Supabase: auth listener içinde await ile başka auth/DB çağrısı deadlock üretebilir.
      setTimeout(() => {
        void (async () => {
          const profileData = await ensureProfile(session.user);

          setUser({
            ...session.user,
            profile: profileData || undefined,
          });

          await fetchUnreadNotificationCount(session.user.id);
        })();
      }, 0);
    });

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  //* Signin
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      await applySession(session);
    } catch (error) {
      console.error('Sign in error:', error);
      throw new Error(translateSupabaseError(error, 'Giriş yaparken bir hata oluştu.'));
    }
  };

  //* Signup
  const signUp = async (
    email: string,
    password: string,
    full_name: string,
    username: string,
  ): Promise<SignUpResult> => {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthMobileCallbackUrl('signup'),
          data: {
            username,
            full_name,
            image_url: '',
          },
        },
      });

      if (signUpError) {
        throw new Error(translateSupabaseError(signUpError, 'Kayıt olurken bir hata oluştu.'));
      }

      if (!authData.user) {
        throw new Error('No user data returned from signup');
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (session?.user) {
        await applySession(session);

        return { needsEmailVerification: false };
      }

      return { needsEmailVerification: true };
    } catch (error) {
      console.error('Sign up error:', error);
      throw new Error(translateSupabaseError(error, 'Kayıt olurken bir hata oluştu.'));
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthMobileCallbackUrl('recovery'),
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Reset password email error:', error);
      throw new Error(
        translateSupabaseError(error, AUTH_MOBILE.context.resetEmailFailed),
      );
    }
  };

  const verifyEmailOtp = async (email: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });

      if (error) {
        throw error;
      }

      const session = data.session ?? (await supabase.auth.getSession()).data.session;

      await applySession(session);
    } catch (error) {
      console.error('Verify email OTP error:', error);
      throw new Error(translateSupabaseError(error, AUTH_MOBILE.context.verifyEmailFailed));
    }
  };

  const verifyRecoveryOtp = async (email: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery',
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Verify recovery OTP error:', error);
      throw new Error(translateSupabaseError(error, AUTH_MOBILE.context.invalidOtp));
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Update password error:', error);
      throw new Error(translateSupabaseError(error, AUTH_MOBILE.context.updatePasswordFailed));
    }
  };

  const refreshAuthSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      throw new Error(translateSupabaseError(error, 'Oturum yenilenemedi.'));
    }

    await applySession(session);
  };

  const isEmailConfirmed = Boolean(user?.email_confirmed_at);

  const resendSignupConfirmation = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: getAuthMobileCallbackUrl('signup'),
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Resend signup confirmation error:', error);
      throw new Error(
        translateSupabaseError(error, AUTH_MOBILE.context.resendFailed),
      );
    }
  };

const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error(translateSupabaseError(error, 'Çıkış yapılırken bir hata oluştu.'));
  }
};

const reloadAuth = () => {
  setIsLoading(true);
  setIsAuthenticated(false);
  setUser(null);
  userIdRef.current = undefined;

  // Re-fetch session and profile
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    await applySession(session);
    setIsLoading(false);
  });
};

return (
  <AuthContext.Provider
    value={{
      isAuthenticated,
      isLoading,
      user,
      signIn,
      signUp,
      resetPasswordForEmail,
      verifyEmailOtp,
      verifyRecoveryOtp,
      updatePassword,
      resendSignupConfirmation,
      isEmailConfirmed,
      refreshAuthSession,
      logout,
      reloadAuth,
      unreadNotificationCount,
      setUnreadNotificationCount,
    }}>
    {children}
  </AuthContext.Provider>
);
};
