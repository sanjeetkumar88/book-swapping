import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { getToken, removeToken, isAuthenticated } from '@/lib/auth-client';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    checkAuth();
  }, [session, status]);

  const checkAuth = async () => {
    console.log('=== checkAuth called ===');
    console.log('Session:', session);
    console.log('Session user:', session?.user);
    console.log('Session status:', status);
    
    try {
      // Check NextAuth session first
      if (session?.user) {
        console.log('NextAuth session found');
        // For NextAuth users, fetch fresh data from API
        try {
          const response = await fetch('/api/auth/me');
          
          if (response.ok) {
            const data = await response.json();
            const userData = {
              ...data.user,
              isGoogleUser: true,
              profilePicture: data.user.profilePicture,
              image: data.user.profilePicture
            };
            console.log('NextAuth user data from API:', userData);
            setUser(userData);
          } else {
            console.log('API failed, using session data');
            const userData = {
              ...session.user,
              isGoogleUser: true,
              books: session.user.books || [],
              exchanges: session.user.exchanges || [],
              profilePicture: session.user.image
            };
            console.log('NextAuth user data from session:', userData);
            setUser(userData);
          }
        } catch (error) {
          console.error('Error fetching NextAuth user data:', error);
          const userData = {
            ...session.user,
            isGoogleUser: true,
            books: session.user.books || [],
            exchanges: session.user.exchanges || [],
            profilePicture: session.user.image
          };
          console.log('NextAuth user data fallback:', userData);
          setUser(userData);
        }
        setLoading(false);
        return;
      }

      // Fallback to JWT token
      const token = getToken();
      console.log('JWT token:', token ? 'Found' : 'Not found');
      if (!token) {
        console.log('No JWT token found');
        setLoading(false);
        return;
      }
      
      console.log('Fetching user data with JWT...');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('JWT API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('JWT user data:', data.user);
        setUser(data.user);
      } else {
        console.log('JWT API failed, removing token');
        removeToken();
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      removeToken();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // Clear user data immediately
    setUser(null);
    
    if (session) {
      // NextAuth logout
      await signOut({ callbackUrl: '/' });
    } else {
      // JWT logout
      removeToken();
      router.push('/');
    }
  };

  const refreshUser = async () => {
    console.log('=== refreshUser called ===');
    console.log('Current user:', user);
    console.log('Session:', session);
    
    if (session?.user) {
      console.log('NextAuth user - refreshing...');
      // For NextAuth users, fetch fresh data from API
      try {
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
          const data = await response.json();
          const userData = {
            ...data.user,
            isGoogleUser: true,
            profilePicture: data.user.profilePicture,
            image: data.user.profilePicture
          };
          console.log('Fresh user data from API:', userData);
          setUser(userData);
        } else {
          console.log('API failed, using session data');
          const userData = {
            ...session.user,
            isGoogleUser: true,
            books: session.user.books || [],
            exchanges: session.user.exchanges || [],
            profilePicture: session.user.image
          };
          console.log('Fallback user data:', userData);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error refreshing NextAuth user:', error);
        const userData = {
          ...session.user,
          isGoogleUser: true,
          books: session.user.books || [],
          exchanges: session.user.exchanges || [],
          profilePicture: session.user.image
        };
        console.log('Error fallback user data:', userData);
        setUser(userData);
      }
    } else {
      console.log('JWT user - refreshing...');
      await checkAuth();
    }
  };

  return { user, loading, logout, refreshUser, isAuthenticated: !!user };
}
