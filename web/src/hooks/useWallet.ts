import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useWallet() {
  const { user } = useAuth();
  const isDemo = user?.isDemo || user?.role === 'demo';

  return useQuery({
    queryKey: ['wallet', user?.id, isDemo],
    queryFn: async () => {
      if (isDemo) {
        return { balance: 2500 };
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return { balance: 0 };

      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (error) {
        // Suppress console error if it's just a generic fetch issue on load
        return { balance: 0 };
      }

      return data || { balance: 0 };
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

