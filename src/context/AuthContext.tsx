import React, {createContext, useContext, useState, useEffect} from 'react';
import {supabase} from '../lib/supabase';
import {Session} from '@supabase/supabase-js';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    full_name: string,
    username: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

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
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      try {
        // Fetch session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
  
        setIsAuthenticated(!!session);
        setUser(session?.user ?? null);
        setIsLoading(false);
  
        if (session?.user) {
          // Fetch profile data
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, username, image_url')
            .eq('id', session.user.id)
            .single();
  
          if (profileError) {
            console.error('Profile fetch error:', profileError);
          } else {
            console.log('Profile data:', profileData);
            setUser((prevUser) => ({
              ...prevUser,
              profile: profileData,
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching session or profile:', error);
      }
    };
  
    fetchSessionAndProfile();
  
    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsAuthenticated(!!session);
      setUser(session?.user ?? null);
  
      if (session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, username, image_url, is_verified')
          .eq('id', session.user.id)
          .single();
  
        if (profileError) {
          console.error('Profile fetch error on state change:', profileError);
        } else {
          setUser((prevUser) => ({
            ...prevUser,
            profile: profileData,
          }));
        }
      }
    });
  
    return () => {
      subscription.unsubscribe();
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
      const {error: signUpError} = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name,
          },
        },
      });
      if (signUpError) throw signUpError;
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
      }}>
      {children}
    </AuthContext.Provider>
  );
};
