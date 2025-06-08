import React, {createContext, useContext, useState, useEffect} from 'react';
import {supabase} from '../lib/supabase';
import {Session, User} from '@supabase/supabase-js';

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

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<UnreadNotificationCountType>(undefined);

  useEffect(() => {
    const fetchUnreadNotificationCount = async () => {
      try {
        const { data: { count }, error: countError } = await supabase
          .from('notifications')
          .select('*')
        if (countError) throw countError;
        setUnreadNotificationCount(count);
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
      fetchUnreadNotificationCount();
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
  

  const signIn = async (email: string, password: string) => {
    try {
      const {error} = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    full_name: string,
    username: string,
  ) => {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name,
          },
        },
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('No user data returned from signup');
      }

      // The trigger will handle profile creation
      // We just need to wait a moment for it to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify profile was created
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profileData) {
        console.error('Profile verification error:', profileError);
        throw new Error('Failed to verify profile creation');
      }

      // Update local user state
      setUser({
        ...authData.user,
        profile: profileData,
      });

    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const {error} = await supabase.auth.signOut();
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
      }}>
      {children}
    </AuthContext.Provider>
  );
};
