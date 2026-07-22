import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useWallet() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { balance: 0 };

      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        // Suppress console error if it's just a generic fetch issue on load
        return { balance: 0 };
      }

      return data || { balance: 0 };
    },
    staleTime: 1000 * 60,
  });
}
