import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { DefaultAvatar } from '../assets';

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
  ) => Promise<void>;
  logout: () => Promise<void>;
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

  const setUnreadNotificationCount = (count: number) => {
    setUnreadNotificationCountState(count);
  };

  useEffect(() => {
    const fetchUnreadNotificationCount = async () => {
      console.log("🚀 ~ fetchUnreadNotificationCount ~ user?.id:", user?.id)
      if (!user?.id) return;
      try {
        const { data, error: countError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact' })
          .eq('is_read', false)
          .eq('recipient_id', user.id);

        console.log("🚀 ~ fetchUnreadNotificationCount ~ data:", data)
        if (countError) throw countError;
        setUnreadNotificationCountState(data?.length || 0);
      } catch (error) {
        console.error('Error fetching unread notification count:', error);
      }
    };

    const fetchSessionAndProfile = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        setIsAuthenticated(!!session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (session?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, username, full_name, image_url')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
          } else if (profileData) {
            console.log('Profile data:', profileData);
            setUser((prevUser: UserWithProfile | null) => ({
              ...prevUser!,
              profile: profileData as Profile,
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching session or profile:', error);
      }
    };

    fetchUnreadNotificationCount();
    fetchSessionAndProfile();

    const interval = setInterval(() => {
      if (user?.id) {
        fetchUnreadNotificationCount();
      }
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsAuthenticated(!!session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, full_name, image_url, is_verified')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error on state change:', profileError);
        } else if (profileData) {
          setUser((prevUser: UserWithProfile | null) => ({
            ...prevUser!,
            profile: profileData as Profile,
          }));
        }
      }
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
      if (error) throw error;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  //* Signup 
  const signUp = async (
    email: string,
    password: string,
    full_name: string,
    username: string,
  ) => {
    try {
      
      console.log('Signing up with:', { email, password, options: { data: { username, full_name, image_url: '' } } });

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name,
            image_url: '',
          },
        },
      });

      if (signUpError) {
        console.log("🚀 ~ signUp ~ signUpError:", signUpError)
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('No user data returned from signup');
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Wait for the trigger to create the profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileData) {
        // Profile was created successfully
        setUser({
          ...authData.user,
          profile: profileData,
        });
        return;
      }

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Profile verification error:', profileError);
        throw new Error('Failed to verify profile creation');
      }

      throw new Error('Profile creation timed out');

  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

return (
  <AuthContext.Provider
    value={{
      isAuthenticated,
      isLoading,
      user,
      signIn,
      signUp,
      logout,
      unreadNotificationCount,
      setUnreadNotificationCount,
    }}>
    {children}
  </AuthContext.Provider>
);
};
