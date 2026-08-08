import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import siteConfig from '@generated/docusaurus.config';

const supabaseUrl = siteConfig.customFields.SUPABASE_URL as string;
const supabaseAnonKey = siteConfig.customFields.SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PublisherProfile {
  id: string;
  publisher_id: string;
  display_name: string;
  avatar_url: string;
}

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<PublisherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
      else setLoading(false);
    });

    // Listen for auth state mutations
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (currentUser: any) => {
    try {
      // At first checking profile exist or not 
      const { data, error } = await supabase
        .from('publishers')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // If doesn't have a profile then create a profile 
        const meta = currentUser.user_metadata || {};
        const fallbackId = currentUser.id.split('-')[0]; // UUID first part if not getting github Username

        const newProfile = {
          id: currentUser.id,
          publisher_id: meta.user_name || `user-${fallbackId}`, // GitHub username
          display_name: meta.full_name || meta.user_name || `Publisher ${fallbackId}`,
          avatar_url: meta.avatar_url || '',
        };

        const { data: insertedData, error: insertError } = await supabase
          .from('publishers')
          .insert([newProfile])
          .select()
          .single();

        if (!insertError && insertedData) {
          setProfile(insertedData);
        }
      } else if (data) {
        setProfile(data);
      }
    } catch (e) {
      console.error("Profile fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGitHub = async () => {
    // SSR safe location mapping for Docusaurus context
    const targetOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${targetOrigin}/publisher`,
      },
    });
  };

  const signInWithGoogle = async () => {
    const targetOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${targetOrigin}/publisher`,
      },
    });
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
  };

  return {
    user,
    profile,
    loading,
    signInWithGitHub,
    signInWithGoogle,
    signOut
  };
}
