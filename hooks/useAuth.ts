import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

interface AuthState {
  user: { id: string; email?: string | null } | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: !!supabase, error: null });

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setState((prev) => ({ ...prev, user: data.session?.user ?? null, loading: false }));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ user: session?.user ?? null, loading: false, error: null });
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase não configurado' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setState((prev) => ({ ...prev, error: error.message }));
      return { error: error.message };
    }
    setState((prev) => ({ ...prev, error: null }));
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase não configurado' };
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setState((prev) => ({ ...prev, error: error.message }));
      return { error: error.message };
    }
    setState((prev) => ({ ...prev, error: null }));
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    signIn,
    signUp,
    signOut,
    enabled: !!supabase,
  };
}

